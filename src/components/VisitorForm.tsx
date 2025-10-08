import React, { useState, useEffect, useCallback } from 'react';
import type { Visitor } from '../types/Visitor';
import { Link } from 'react-router-dom';
// import { sendNotification } from '../services/notificationService';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import './VisitorForm.css';
import logo from '../assets/logo.jpeg';
import TermsModal from './TermsModal';
import CameraModal from './CameraModal';

const VisitorForm: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [formData, setFormData] = useState<Omit<Visitor, 'id' | 'timeOut'>>({
        name: '',
        surname: '',
        company: '',
        visitorPhoneNumber: '',
        photo: '',
        reasonForVisit: '',
        host: '',
        date: new Date().toLocaleDateString(),
        timeIn: new Date().toLocaleTimeString(),
        agreementSigned: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleResetView = useCallback(() => {
        setShowForm(false);
        setSubmissionSuccess(false);
        setMessage('');
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setFormData(prevData => ({
                ...prevData,
                timeIn: new Date().toLocaleTimeString()
            }));
        }, 60000); // Update time every minute
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (submissionSuccess) {
            const redirectTimer = setTimeout(() => {
                handleResetView();
            }, 10000); // 10 seconds

            return () => clearTimeout(redirectTimer);
        }
    }, [submissionSuccess, handleResetView]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePhoneChange = (value: string | undefined) => {
        setFormData({ ...formData, visitorPhoneNumber: value || '' });
    };

    const handleCapture = (imageSrc: string) => {
        setFormData({ ...formData, photo: imageSrc });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, agreementSigned: e.target.checked });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.agreementSigned) {
            setMessage('You must sign the agreement to proceed.');
            return;
        }
        setIsSubmitting(true);
        setMessage('Submitting...');

        try {
            // TODO: Replace with your actual backend server URL
            const response = await fetch('http://localhost:3001/api/visitors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to submit form.');
                } else {
                    // The response is not JSON, use status text instead.
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
            }

            setSubmissionSuccess(true);
            // Reset form
            setFormData({
                name: '',
                surname: '',
                company: '',
                visitorPhoneNumber: '',
                photo: '',
                reasonForVisit: '',
                host: '',
                date: new Date().toLocaleDateString(),
                timeIn: new Date().toLocaleTimeString(),
                agreementSigned: false,
            });
        } catch (error) {
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage('An unknown error occurred. Please try again.');
            }
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignInClick = () => {
        setShowForm(true);
        setSubmissionSuccess(false);
        setMessage('');
    };

    return (
        <div className={`page-container ${!showForm ? 'landing-view' : ''}`}>
            {!showForm ? (
                <div className="landing-wrapper">
                    <div className="landing-container">
                        <img src={logo} alt="Guestbook Logo" className="landing-logo" />
                        <h1>Welcome</h1>
                        <p>Please sign in to continue.</p>
                        <button onClick={handleSignInClick} className="landing-button">Sign In</button>
                    </div>
                    <footer className="app-footer">
                        <Link to="/login">Admin Dashboard</Link>
                    </footer>
                </div>
            ) : (
                <>
                    <div className="visitor-form-container">
                        <div className="logo-container">
                            <img src={logo} alt="Guestbook Logo" />
                        </div>
                        {submissionSuccess ? (
                            <div className="success-view">
                                <h2>Thank You!</h2>
                                <p>Your host will be notified shortly. Please take a seat in the waiting area and have a great day.</p>
                                <button onClick={handleResetView} className="landing-button">
                                    Sign in Another Visitor
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2>Visitor Sign-In</h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>Date:</label>
                                        <input type="text" value={formData.date} readOnly />
                                    </div>
                                    <div className="form-group">
                                        <label>Time In:</label>
                                        <input type="text" value={formData.timeIn} readOnly />
                                    </div>
                                    <div className="form-group photo-group">
                                        <label>Your Photo:</label>
                                        <div className="photo-area">
                                            <div className="photo-thumbnail">
                                                {formData.photo ? <img src={formData.photo} alt="Visitor" /> : <div className="photo-placeholder"></div>}
                                            </div>
                                            <button type="button" onClick={() => setIsCameraModalOpen(true)} className="take-photo-button">
                                                {formData.photo ? 'Retake Photo' : 'Take Photo'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="name">Name:</label>
                                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="surname">Surname:</label>
                                        <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="company">Company:</label>
                                        <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="visitorPhoneNumber">Your Phone Number:</label>
                                        <PhoneInput
                                            id="visitorPhoneNumber"
                                            placeholder="Enter phone number"
                                            value={formData.visitorPhoneNumber}
                                            onChange={handlePhoneChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reasonForVisit">Reason for Visit:</label>
                                        <textarea id="reasonForVisit" name="reasonForVisit" value={formData.reasonForVisit} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="host">Who are you visiting (Host):</label>
                                        <input type="text" id="host" name="host" value={formData.host} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group agreement">
                                        <input type="checkbox" id="agreementSigned" checked={formData.agreementSigned} onChange={handleCheckboxChange} />
                                        <label htmlFor="agreementSigned">
                                            I agree to the{' '}
                                            <span className="terms-link" onClick={() => setIsTermsModalOpen(true)}>
                                                terms and conditions.
                                            </span>
                                        </label>
                                    </div>
                                    <button type="submit" disabled={isSubmitting || !formData.agreementSigned}>
                                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                                    </button>
                                </form>
                                {message && <p className="message">{message}</p>}
                            </>
                        )}
                    </div>
                </>
            )}
            {isTermsModalOpen && <TermsModal onClose={() => setIsTermsModalOpen(false)} />}
            {isCameraModalOpen && <CameraModal onCapture={handleCapture} onClose={() => setIsCameraModalOpen(false)} />}
        </div>
    );
};
export default VisitorForm;

