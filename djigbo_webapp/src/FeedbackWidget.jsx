import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './FeedbackWidget.css';

const FeedbackWidget = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const { getAccessTokenSilently } = useAuth0();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!feedbackText.trim()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    feedbackText: feedbackText.trim()
                })
            });

            if (response.ok) {
                setSubmitStatus('success');
                setFeedbackText('');
                setTimeout(() => {
                    setIsModalOpen(false);
                    setSubmitStatus(null);
                }, 2000);
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setIsModalOpen(false);
            setFeedbackText('');
            setSubmitStatus(null);
        }
    };

    return (
        <>
            {/* Feedback Badge */}
            <button
                className="feedback-badge"
                onClick={() => setIsModalOpen(true)}
                title="Pateikti atsiliepimą"
                aria-label="Pateikti atsiliepimą"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor" />
                    <path d="M19 15L19.74 17.74L22.5 18.5L19.74 19.26L19 22L18.26 19.26L15.5 18.5L18.26 17.74L19 15Z" fill="currentColor" />
                    <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="currentColor" />
                </svg>
            </button>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="feedback-modal-overlay" onClick={handleCloseModal}>
                    <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="feedback-modal-header">
                            <h3>Atsiliepimas</h3>
                            <button
                                className="feedback-modal-close"
                                onClick={handleCloseModal}
                                disabled={isSubmitting}
                                aria-label="Uždaryti"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="feedback-form">
                            <div className="feedback-input-group">
                                <label htmlFor="feedback-text" className="feedback-label">
                                    Jūsų atsiliepimas:
                                </label>
                                <textarea
                                    id="feedback-text"
                                    className="feedback-textarea"
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Parašykite savo atsiliepimą čia..."
                                    rows="4"
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>

                            {submitStatus === 'success' && (
                                <div className="feedback-success">
                                    Ačiū už atsiliepimą! Jis buvo sėkmingai išsiųstas.
                                </div>
                            )}

                            {submitStatus === 'error' && (
                                <div className="feedback-error">
                                    Įvyko klaida siunčiant atsiliepimą. Bandykite dar kartą.
                                </div>
                            )}

                            <div className="feedback-actions">
                                <button
                                    type="button"
                                    className="feedback-cancel-btn"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Atšaukti
                                </button>
                                <button
                                    type="submit"
                                    className="feedback-submit-btn"
                                    disabled={isSubmitting || !feedbackText.trim()}
                                >
                                    {isSubmitting ? 'Siunčiama...' : 'Pateikti'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackWidget; 