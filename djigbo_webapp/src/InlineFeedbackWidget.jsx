import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './FeedbackWidget.css';

const InlineFeedbackWidget = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const { getAccessTokenSilently } = useAuth0();

    // Add event listener to catch page refresh attempts
    React.useEffect(() => {
        const handleBeforeUnload = (e) => {
            console.log('⚠️ Page refresh/navigation detected!');
            console.log('⚠️ Event type:', e.type);
            if (isSubmitting) {
                console.log('⚠️ Preventing refresh while submitting feedback');
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isSubmitting]);

    const handleSubmit = async (e) => {
        console.log('🚀 handleSubmit started - BEFORE preventDefault');
        console.log('📋 Event object:', e);
        console.log('📋 Event type:', e.type);
        console.log('📋 Event target:', e.target);
        console.log('📋 Event currentTarget:', e.currentTarget);

        e.preventDefault();
        console.log('✅ preventDefault called');

        console.log('📝 Feedback text:', feedbackText);
        console.log('📝 Feedback text length:', feedbackText.length);
        console.log('📝 Feedback text trimmed:', feedbackText.trim());
        console.log('📝 Is feedback text empty?', !feedbackText.trim());

        setIsSubmitting(true);
        setSubmitStatus(null);

        console.log('🔄 Set isSubmitting to true, cleared submitStatus');

        try {
            console.log('🔑 Getting access token...');
            // Get authentication token
            const token = await getAccessTokenSilently();
            console.log('✅ Got access token:', token ? 'Token received' : 'No token');
            console.log('🔑 Token length:', token ? token.length : 0);

            const requestBody = {
                feedbackText: feedbackText.trim()
            };
            console.log('📦 Request body:', requestBody);
            console.log('🌐 API URL:', `${import.meta.env.VITE_API_BASE_URL}/api/feedback`);

            console.log('📤 Making fetch request...');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📥 Response received');
            console.log('📊 Response status:', response.status);
            console.log('📊 Response statusText:', response.statusText);
            console.log('📊 Response ok:', response.ok);
            console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                console.log('✅ Response is ok, parsing response body...');
                try {
                    const result = await response.json();
                    console.log('📄 Response body:', result);
                } catch (parseError) {
                    console.log('⚠️ Could not parse response as JSON:', parseError);
                }

                console.log('🎉 Setting success status');
                setSubmitStatus('success');
                setFeedbackText('');
                console.log('⏰ Setting timeout to close modal in 2 seconds');
                setTimeout(() => {
                    console.log('🔒 Closing modal and clearing status');
                    setIsModalOpen(false);
                    setSubmitStatus(null);
                }, 2000);
            } else {
                console.log('❌ Response is not ok, handling error...');
                // Try to get error details from response
                let errorMessage = 'Įvyko klaida siunčiant atsiliepimą';
                try {
                    console.log('🔍 Attempting to parse error response...');
                    const errorData = await response.json();
                    console.log('📄 Error response body:', errorData);
                    if (errorData.error) {
                        errorMessage = errorData.error;
                        console.log('🚨 Error message from server:', errorMessage);
                    }
                } catch (parseError) {
                    // If we can't parse the error response, use default message
                    console.warn('⚠️ Could not parse error response:', parseError);
                }

                console.error('❌ Feedback submission failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorMessage
                });
                console.log('🚨 Setting error status');
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('💥 Caught exception in handleSubmit:', error);
            console.log('🔍 Error type:', error.constructor.name);
            console.log('🔍 Error message:', error.message);
            console.log('🔍 Error stack:', error.stack);

            // Handle specific authentication errors
            if (error.error === 'login_required' || error.error === 'consent_required') {
                console.error('🔐 Authentication error:', error.error_description);
            }

            console.log('🚨 Setting error status due to exception');
            setSubmitStatus('error');
        } finally {
            console.log('🏁 Finally block - setting isSubmitting to false');
            setIsSubmitting(false);
        }

        console.log('✅ handleSubmit completed');
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
                                    onClick={(e) => {
                                        console.log('🔘 Submit button clicked');
                                        console.log('🔘 Button disabled:', isSubmitting || !feedbackText.trim());
                                        if (isSubmitting || !feedbackText.trim()) {
                                            e.preventDefault();
                                            console.log('🔘 Preventing submission - button disabled or empty text');
                                        }
                                    }}
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