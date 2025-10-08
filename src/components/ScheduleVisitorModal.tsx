import React, { useState } from 'react';
import type { Visitor } from '../types/Visitor';
import './Modal.css'; // Assuming a generic modal stylesheet
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

type ScheduleVisitorModalProps = {
    onClose: () => void;
    onSave: (visitorData: Omit<Visitor, 'id' | 'timeIn' | 'timeOut' | 'photo' | 'agreementSigned'>) => void;
};

const ScheduleVisitorModal: React.FC<ScheduleVisitorModalProps> = ({ onClose, onSave }) => {
    const [visitorData, setVisitorData] = useState({
        name: '',
        surname: '',
        company: '',
        visitorPhoneNumber: '',
        host: '',
        reasonForVisit: '',
        date: new Date().toISOString().split('T')[0], // Default to today
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setVisitorData({ ...visitorData, [name]: value });
    };

    const handlePhoneChange = (value: string | undefined) => {
        setVisitorData({ ...visitorData, visitorPhoneNumber: value || '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(visitorData);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Schedule a Visitor</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input type="text" id="name" name="name" value={visitorData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="surname">Surname:</label>
                        <input type="text" id="surname" name="surname" value={visitorData.surname} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="company">Company:</label>
                        <input type="text" id="company" name="company" value={visitorData.company} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="visitorPhoneNumber">Phone Number:</label>
                        <PhoneInput
                            id="visitorPhoneNumber"
                            placeholder="Enter phone number"
                            value={visitorData.visitorPhoneNumber}
                            onChange={handlePhoneChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="host">Host:</label>
                        <input type="text" id="host" name="host" value={visitorData.host} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="reasonForVisit">Reason for Visit:</label>
                        <textarea id="reasonForVisit" name="reasonForVisit" value={visitorData.reasonForVisit} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="date">Expected Date of Visit:</label>
                        <input type="date" id="date" name="date" value={visitorData.date} onChange={handleChange} required />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} disabled={isSaving}>Cancel</button>
                        <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleVisitorModal;
