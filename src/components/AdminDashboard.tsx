import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Visitor } from '../types/Visitor';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { format, subDays, isWithinInterval } from 'date-fns';
import './AdminDashboard.css';
import PhotoViewerModal from './PhotoViewerModal';
import EditVisitorModal from './EditVisitorModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

const AdminDashboard: React.FC = () => {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRangeFilter, setDateRangeFilter] = useState('all');
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVisitors = async () => {
            try {
                // 1. Data is fetched from the PostgreSQL database via the API.
                const response = await fetch('http://localhost:3001/api/visitors');
                if (!response.ok) {
                    throw new Error('Failed to fetch');
                }
                const data: Visitor[] = await response.json();
                // The id from postgres is a number, but the Visitor type might expect a string.
                // Let's ensure it's a string for consistency with previous localStorage implementation.
                const formattedData = data.map(v => ({ ...v, id: String(v.id) }));
                // 2. The component's 'visitors' state is updated with the fetched data.
                setVisitors(formattedData);
            } catch (error) {
                console.error("Error fetching visitors:", error);
            }
        };

        fetchVisitors();
    }, []);

    const handleSignOut = async (visitorId: string) => {
        const timeOut = new Date().toLocaleTimeString();
        try {
            const response = await fetch(`http://localhost:3001/api/visitors/${visitorId}/signout`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeOut }),
            });
            if (!response.ok) throw new Error('Sign out failed');
            const updatedVisitor = await response.json();
            setVisitors(visitors.map(v => v.id === visitorId ? { ...updatedVisitor, id: String(updatedVisitor.id) } : v));
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleDelete = async (visitorId: string) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                const response = await fetch(`http://localhost:3001/api/visitors/${visitorId}`, {
                    method: 'DELETE',
                });
                if (!response.ok) throw new Error('Delete failed');
                setVisitors(visitors.filter(v => v.id !== visitorId));
            } catch (error) {
                console.error("Error deleting visitor:", error);
            }
        }
    };

    const handleSaveEdit = async (updatedVisitor: Visitor) => {
        try {
            const response = await fetch(`http://localhost:3001/api/visitors/${updatedVisitor.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedVisitor),
            });
            if (!response.ok) throw new Error('Update failed');
            const savedVisitor = await response.json();
            setVisitors(visitors.map(v => v.id === updatedVisitor.id ? { ...savedVisitor, id: String(savedVisitor.id) } : v));
        } catch (error) {
            console.error("Error updating visitor:", error);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isAdminAuthenticated');
        navigate('/login');
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Surname', 'Company', 'Host', 'Date', 'Time In', 'Time Out'];
        const rows = filteredVisitors.map(v => [v.name, v.surname, v.company, v.host, v.date, v.timeIn, v.timeOut || 'N/A'].join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `visitor_log_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredVisitors = useMemo(() => {
        const now = new Date();
        // This logic uses 'visitors' state directly.
        return visitors.filter(v => {
            // Assuming all visitors in the log should have a timeIn
            if (!v.timeIn) return false;

            const visitorDate = new Date(v.date);
            const nameMatch = `${v.name} ${v.surname}`.toLowerCase().includes(searchTerm.toLowerCase());
            const companyMatch = v.company.toLowerCase().includes(searchTerm.toLowerCase());
            const searchMatch = nameMatch || companyMatch;

            const statusMatch = statusFilter === 'all' ||
                (statusFilter === 'checked-in' && !v.timeOut) ||
                (statusFilter === 'checked-out' && v.timeOut);

            const dateRangeMatch = dateRangeFilter === 'all' ||
                (dateRangeFilter === 'today' && format(visitorDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) ||
                (dateRangeFilter === '7days' && isWithinInterval(visitorDate, { start: subDays(now, 7), end: now })) ||
                (dateRangeFilter === '30days' && isWithinInterval(visitorDate, { start: subDays(now, 30), end: now }));

            return searchMatch && statusMatch && dateRangeMatch;
        });
    }, [visitors, searchTerm, statusFilter, dateRangeFilter]);

    // 3. This memoized value processes 'filteredVisitors' to create data for the Bar chart.
    const chartData = useMemo(() => {
        const dailyCounts = filteredVisitors.reduce((acc, visitor) => {
            const date = format(new Date(visitor.date), 'yyyy-MM-dd'); // Normalize date format for grouping
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const sortedDates = Object.keys(dailyCounts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        return { labels: sortedDates, datasets: [{ label: 'Visitors per Day', data: sortedDates.map(date => dailyCounts[date]), backgroundColor: 'rgba(0, 123, 255, 0.6)', borderColor: 'rgba(0, 123, 255, 1)', borderWidth: 1 }] };
    }, [filteredVisitors]);

    // 4. This memoized value also processes 'filteredVisitors' for the Line chart.
    const peakTimesData = useMemo(() => {
        const hourlyCounts = Array(24).fill(0);
        filteredVisitors.forEach(visitor => {
            try {
                const hour = parseInt(visitor.timeIn.split(':')[0]);
                if (!isNaN(hour)) {
                    hourlyCounts[hour]++;
                }
            } catch (e) {
                // Ignore if timeIn format is unexpected
            }
        });
        return {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Peak Visitor Hours',
                data: hourlyCounts,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.3
            }]
        };
    }, [filteredVisitors]);

    const overviewStats = useMemo(() => {
        const now = new Date();
        const todayCount = visitors.filter(v => format(new Date(v.date), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')).length;
        const checkedInCount = visitors.filter(v => !v.timeOut).length;
        return {
            total: visitors.length,
            today: todayCount,
            checkedIn: checkedInCount,
        };
    }, [visitors]);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
            </div>

            <div className="overview-grid">
                <div className="stat-card"><h4>Total Visitors</h4><span>{overviewStats.total}</span></div>
                <div className="stat-card"><h4>Today's Visitors</h4><span>{overviewStats.today}</span></div>
                <div className="stat-card"><h4>Currently Checked In</h4><span>{overviewStats.checkedIn}</span></div>
            </div>

            <div className="chart-container">
                <h3>Peak Visitor Hours</h3>
                <Line data={peakTimesData} options={{ responsive: true }} />
            </div>

            <div className="filters-container">
                <h3>Visitor Log</h3>
                <input type="text" placeholder="Search by name or company..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="checked-in">Checked In</option>
                    <option value="checked-out">Checked Out</option>
                </select>
                <select value={dateRangeFilter} onChange={e => setDateRangeFilter(e.target.value)}>
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                </select>
                <button onClick={exportToCSV} className="export-button">Export CSV</button>
            </div>

            <div className="visitor-table-container">
                <table className="visitor-table">
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>Name</th>
                            <th>Company</th>
                            <th>Host</th>
                            <th>Time In</th>
                            <th>Time Out</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVisitors.length > 0 ? (
                            filteredVisitors.map((visitor) => (
                                <tr key={visitor.id}>
                                    <td>
                                        <img src={visitor.photo} alt="Visitor" className="visitor-photo" onClick={() => setSelectedPhoto(visitor.photo)} />
                                    </td>
                                    <td>{visitor.name} {visitor.surname}</td>
                                    <td>{visitor.company || 'N/A'}</td>
                                    <td>{visitor.host}</td>
                                    <td>{visitor.timeIn ? `${format(new Date(visitor.date), 'yyyy-MM-dd')} at ${visitor.timeIn}`: 'Not Signed In'}</td>
                                    <td>{visitor.timeOut || (visitor.timeIn ? 'Checked In' : 'N/A')}</td>
                                    <td>{visitor.timeOut ? 'Checked Out' : 'Checked In'}</td>
                                    <td className="visitor-actions">
                                        <button onClick={() => setEditingVisitor(visitor)} className="edit-button">Edit</button>
                                        {visitor.timeOut ? (
                                            <span>{visitor.timeOut}</span>
                                        ) : (
                                            <button onClick={() => handleSignOut(visitor.id)} className="sign-out-button" disabled={!visitor.timeIn}>
                                                Sign Out
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(visitor.id)} className="delete-button">Delete</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="no-visitors-message">No visitors found matching your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="chart-container">
                <h3>Visitor Trends</h3>
                <Bar data={chartData} options={{ responsive: true }} />
            </div>

            {selectedPhoto && <PhotoViewerModal imageSrc={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
            {editingVisitor && <EditVisitorModal visitor={editingVisitor} onClose={() => setEditingVisitor(null)} onSave={handleSaveEdit} />}
            <footer className="dashboard-footer">
                <button onClick={handleLogout} className="logout-button">Log Out</button>
            </footer>
        </div>
    );
};

export default AdminDashboard;