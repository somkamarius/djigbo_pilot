import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './FeedbackWidget.css';

const InlineFeedbackWidget = () => {
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
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/feedback`, {
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
            {/* Inline Feedback Button */}
            <button
                className="inline-feedback-btn"
                onClick={() => setIsModalOpen(true)}
                title="Pateikti atsiliepimą"
                aria-label="Pateikti atsiliepimą"
                type="button"
            >
                Atsiliepimas
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

export default InlineFeedbackWidget; 