import React, { useState } from 'react';
import type { Visitor } from '../types/Visitor';
import './TermsModal.css'; // Reusing some modal styles

interface EditVisitorModalProps {
    visitor: Visitor;
    onSave: (updatedVisitor: Visitor) => void;
    onClose: () => void;
}

const EditVisitorModal: React.FC<EditVisitorModalProps> = ({ visitor, onSave, onClose }) => {
    const [formData, setFormData] = useState(visitor);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Visitor</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Name:</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Surname:</label>
                        <input type="text" name="surname" value={formData.surname} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Company:</label>
                        <input type="text" name="company" value={formData.company} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Host:</label>
                        <input type="text" name="host" value={formData.host} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Time Out:</label>
                        <input type="text" name="timeOut" value={formData.timeOut || ''} onChange={handleChange} placeholder="e.g., 4:30:00 PM" />
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={handleSave} className="landing-button">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default EditVisitorModal;
//visitor edit modal 
