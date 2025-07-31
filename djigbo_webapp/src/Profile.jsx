import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './Profile.css';

const Profile = () => {
    const { isAuthenticated, getAccessTokenSilently, user: auth0User } = useAuth0();
    const [userData, setUserData] = useState(null);
    const [conversationStats, setConversationStats] = useState(null);
    const [moodData, setMoodData] = useState(null);
    const [userFeedback, setUserFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const token = await getAccessTokenSilently();

                // Fetch user profile data
                const userResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/check`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (userResponse.ok) {
                    const userResult = await userResponse.json();
                    setUserData(userResult.user);
                }

                // Fetch conversation statistics
                const statsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/conversations/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (statsResponse.ok) {
                    const statsResult = await statsResponse.json();
                    setConversationStats(statsResult);
                }

                // Fetch personal mood data
                const moodResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/mood/personal`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (moodResponse.ok) {
                    const moodResult = await moodResponse.json();
                    setMoodData(moodResult);
                }

                // Fetch user feedback
                const feedbackResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/feedback`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (feedbackResponse.ok) {
                    const feedbackResult = await feedbackResponse.json();
                    setUserFeedback(feedbackResult.feedback || []);
                }

            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Nepavyko įkelti profilio duomenų');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isAuthenticated, getAccessTokenSilently]);

    if (!isAuthenticated) {
        return (
            <div className="profile-container">
                <div className="profile-card">
                    <h2>Profilis</h2>
                    <p>Prisijunkite, kad pamatytumėte savo profilį.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="profile-container">
                <div className="profile-card">
                    <h2>Profilis</h2>
                    <div className="loading">Kraunama profilio informacija...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-container">
                <div className="profile-card">
                    <h2>Profilis</h2>
                    <div className="error">{error}</div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('lt-LT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getMoodEmoji = (score) => {
        const emojis = ['😢', '😕', '😐', '🙂', '😊'];
        return emojis[score - 1] || '😐';
    };

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="avatar-section">
                        {userData?.avatar ? (
                            <img
                                src={userData.avatar}
                                alt="User Avatar"
                                className="profile-avatar"
                            />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                {auth0User?.name?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                    <div className="profile-info">
                        <h2>{userData?.nickname || auth0User?.name || 'User'}</h2>
                        <p className="user-email">{auth0User?.email}</p>
                        {userData?.created_at && (
                            <p className="member-since">
                                Narys nuo {formatDate(userData.created_at)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="profile-sections">
                    {/* Activity Section */}
                    <div className="profile-section">
                        <h3>Veikla</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-number">
                                    {conversationStats?.total_conversations || 0}
                                </div>
                                <div className="stat-label">Pokalbiai</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">
                                    {conversationStats?.avg_message_count?.toFixed(1) || 0}
                                </div>
                                <div className="stat-label">Vid. Žinučių</div>
                            </div>
                            {conversationStats?.latest_conversation && (
                                <div className="stat-card">
                                    <div className="stat-date">
                                        {formatDate(conversationStats.latest_conversation)}
                                    </div>
                                    <div className="stat-label">Paskutinį Kartą</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mood Section */}
                    {moodData && (
                        <div className="profile-section">
                            <h3>Nuotaikos Sekimas</h3>
                            <div className="mood-stats">
                                <div className="mood-overview">
                                    <div className="current-mood">
                                        <span className="mood-emoji">
                                            {moodData.stats?.avg_mood ?
                                                getMoodEmoji(Math.round(moodData.stats.avg_mood)) : '😐'
                                            }
                                        </span>
                                        <div className="mood-details">
                                            <div className="mood-score">
                                                {moodData.stats?.avg_mood?.toFixed(1) || 'N/A'} / 5
                                            </div>
                                            <div className="mood-label">Vidutinė Nuotaika</div>
                                        </div>
                                    </div>
                                    <div className="mood-metrics">
                                        <div className="metric">
                                            <span className="metric-number">{moodData.stats?.total_entries || 0}</span>
                                            <span className="metric-label">Įrašai</span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-number">{moodData.stats?.days_with_entries || 0}</span>
                                            <span className="metric-label">Dienos</span>
                                        </div>
                                    </div>
                                </div>

                                {moodData.entries && moodData.entries.length > 0 && (
                                    <div className="recent-moods">
                                        <h4>Naujausi Nuotaikos Įrašai</h4>
                                        <div className="mood-entries">
                                            {moodData.entries.slice(0, 5).map((entry, index) => (
                                                <div key={index} className="mood-entry">
                                                    <span className="mood-emoji-small">
                                                        {getMoodEmoji(entry.mood_score)}
                                                    </span>
                                                    <span className="mood-date">
                                                        {formatDate(entry.created_at)}
                                                    </span>
                                                    {entry.thoughts && (
                                                        <span className="mood-thoughts">
                                                            "{entry.thoughts}"
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Feedback Section */}
                    {userFeedback.length > 0 && (
                        <div className="profile-section">
                            <h3>Jūsų Atsiliepimai</h3>
                            <div className="feedback-list">
                                {userFeedback.map((feedback, index) => (
                                    <div key={index} className="feedback-item">
                                        <div className="feedback-text">"{feedback.feedback_text}"</div>
                                        <div className="feedback-date">
                                            {formatDate(feedback.created_at)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Auth0 Info Section */}
                    <div className="profile-section">
                        <h3>Paskyros Informacija</h3>
                        <div className="account-info">
                            <div className="info-row">
                                <span className="info-label">Auth0 ID:</span>
                                <span className="info-value">{auth0User?.sub}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">El. Paštas Patvirtintas:</span>
                                <span className="info-value">
                                    {auth0User?.email_verified ? 'Taip' : 'Ne'}
                                </span>
                            </div>
                            {auth0User?.updated_at && (
                                <div className="info-row">
                                    <span className="info-label">Paskutinį Kartą Atnaujinta:</span>
                                    <span className="info-value">
                                        {formatDate(auth0User.updated_at)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile; 