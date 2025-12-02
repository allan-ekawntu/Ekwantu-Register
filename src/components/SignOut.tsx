import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Visitor } from '../types/Visitor';
import './SignOut.css';

const SignOut: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [foundVisitors, setFoundVisitors] = useState<Visitor[]>([]);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setMessage('Please enter a name to search.');
            setFoundVisitors([]);
            return;
        }
        try {
            const response = await fetch(`http://localhost:3001/api/visitors/search?name=${encodeURIComponent(searchTerm)}&status=checked-in`);
            if (!response.ok) throw new Error('Search failed');
            const data: Visitor[] = await response.json();
            
            const formattedData = data.map(v => ({ ...v, id: String(v.id) }));
            setFoundVisitors(formattedData);
            setMessage(formattedData.length > 0 ? '' : 'No matching signed-in visitors found.');
        } catch (error) {
            console.error("Error searching visitors:", error);
            setMessage('Failed to search for visitors. Please try again.');
        }
    };

    const handleSignOut = async (visitorId: string) => {
        const timeOut = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        try {
            const response = await fetch(`http://localhost:3001/api/visitors/${visitorId}/signout`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeOut }),
            });
            if (!response.ok) throw new Error('Sign out failed');
            
            setMessage('You have been successfully signed out. Thank you for your visit!');
            setFoundVisitors([]);
            setSearchTerm('');

            setTimeout(() => {
                navigate('/'); // Redirect to home page after a delay
            }, 3000);

        } catch (error) {
            console.error("Error signing out:", error);
            setMessage('Sign-out failed. Please contact reception.');
        }
    };

    return (
        <div className="signout-container">
            <div className="signout-box">
                <h2>Visitor Sign Out</h2>
                <p>Please enter your name to find your record and sign out.</p>
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Enter your full name..."
                        className="search-input"
                    />
                    <button type="submit" className="search-button">Search</button>
                </form>

                {message && <p className="message">{message}</p>}

                {foundVisitors.length > 0 && (
                    <ul className="visitor-list">
                        {foundVisitors.map(visitor => (
                            <li key={visitor.id} className="visitor-item">
                                <span>{visitor.name} {visitor.surname} from {visitor.company}</span>
                                <button onClick={() => handleSignOut(visitor.id)} className="signout-button">Sign Out</button>
                            </li>
                        ))}
                    </ul>
                )}
                 <button onClick={() => navigate('/')} className="back-button">Back to Home</button>
            </div>
        </div>
    );
};

export default SignOut;
