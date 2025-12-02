import React, { useState } from 'react';
import type { Visitor } from '../types/Visitor';
import './EditVisitorModal.css'; // Reusing styles from EditVisitorModal

interface AddVisitorModalProps {
    onClose: () => void;
    onSave: (visitor: Omit<Visitor, 'id' | 'photo' | 'timeIn' | 'timeOut'> & { expectedTimeIn?: string }) => void;
}

const AddVisitorModal: React.FC<AddVisitorModalProps> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [company, setCompany] = useState('');
    const [host, setHost] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedTimeIn, setExpectedTimeIn] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name, surname, company, host, date,
            expectedTimeIn,
            visitorPhoneNumber: '',
            reasonForVisit: '',
            agreementSigned: false
        });
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Add New Visitor</h2>
                <form onSubmit={handleSubmit}>
                    <label>Name: <input type="text" value={name} onChange={e => setName(e.target.value)} required /></label>
                    <label>Surname: <input type="text" value={surname} onChange={e => setSurname(e.target.value)} required /></label>
                    <label>Company: <input type="text" value={company} onChange={e => setCompany(e.target.value)} /></label>
                    <label>Host: <input type="text" value={host} onChange={e => setHost(e.target.value)} required /></label>
                    <label>Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} required /></label>
                    <label>Expected Time In: <input type="time" value={expectedTimeIn} onChange={e => setExpectedTimeIn(e.target.value)} /></label>
                    <div className="modal-actions">
                        <button type="submit" className="save-button">Save</button>
                        <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVisitorModal;
