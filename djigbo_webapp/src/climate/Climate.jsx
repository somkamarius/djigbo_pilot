import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './Climate.css';
import { MoodGraph } from './MoodGraph';
import { MoodGraph2D } from './MoodGraph2D';
import { ParticipantFeedback } from './ParticipantFeedback';
import { MoodLineChart } from './MoodLineChart';

export const Climate = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [currentMood, setCurrentMood] = useState(3);
    const [moodText, setMoodText] = useState('');
    const [activeTab, setActiveTab] = useState('camp');
    const [showMoodModal, setShowMoodModal] = useState(false);
    const [use3DGraph, setUse3DGraph] = useState(true);
    const [graphError, setGraphError] = useState(false);

    // Real data states
    const [campMoodData, setCampMoodData] = useState([]);
    const [personalMoodData, setPersonalMoodData] = useState([]);
    const [todayMood, setTodayMood] = useState({ avgMood: 0, participantCount: 0 });
    const [overallStats, setOverallStats] = useState({});
    const [personalStats, setPersonalStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // API functions
    const fetchCampMoodData = async () => {
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/mood/camp`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch camp mood data');
            }

            const data = await response.json();
            setCampMoodData(data.campData || []);
            setTodayMood(data.today || { avgMood: 0, participantCount: 0 });
            setOverallStats(data.overall || {});
        } catch (err) {
            console.error('Error fetching camp mood data:', err);
            setError('Nepavyko gauti stovyklos nuotaikos duomenų');
        }
    };

    const fetchPersonalMoodData = async () => {
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/mood/personal`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch personal mood data');
            }

            const data = await response.json();
            setPersonalMoodData(data.entries || []);
            setPersonalStats(data.stats || {});
        } catch (err) {
            console.error('Error fetching personal mood data:', err);
            setError('Nepavyko gauti asmeninių nuotaikos duomenų');
        }
    };

    const submitMoodEntry = async (moodScore, thoughts) => {
        try {
            setSubmitting(true);
            const token = await getAccessTokenSilently();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/mood`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    moodScore,
                    thoughts: thoughts || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit mood');
            }

            // Refresh data after successful submission
            await Promise.all([fetchCampMoodData(), fetchPersonalMoodData()]);
            return true;
        } catch (err) {
            console.error('Error submitting mood:', err);
            setError('Nepavyko išsaugoti nuotaikos');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                await Promise.all([fetchCampMoodData(), fetchPersonalMoodData()]);
            } catch (err) {
                console.error('Error loading mood data:', err);
                setError('Nepavyko užkrauti duomenų');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleMoodSubmit = async (e) => {
        e.preventDefault();
        const success = await submitMoodEntry(currentMood, moodText);
        if (success) {
            alert('Jūsų nuotaika išsaugota!');
            setMoodText('');
            setShowMoodModal(false);
        }
    };

    const handleCloseModal = () => {
        setShowMoodModal(false);
        setMoodText('');
        setCurrentMood(3);
    };

    const getMoodEmoji = (mood) => {
        if (mood >= 4.5) return '😊';
        if (mood >= 3.5) return '🙂';
        if (mood >= 2.5) return '😐';
        if (mood >= 1.5) return '😕';
        return '😢';
    };

    const getMoodColor = (mood) => {
        if (mood >= 4.5) return '#4CAF50';
        if (mood >= 3.5) return '#8BC34A';
        if (mood >= 2.5) return '#FFC107';
        if (mood >= 1.5) return '#FF9800';
        return '#F44336';
    };

    return (
        <div className="climate-container">
            <div className="climate-header">
                <h1>Stovyklos Klimatas</h1>
                <p>Sekite nuotaiką ir mintis visos stovyklos bei savo asmeninį progresą</p>
            </div>

            {/* Mood Input Button */}
            <div className="mood-input-button-section">
                <button
                    className="open-mood-modal-btn"
                    onClick={() => setShowMoodModal(true)}
                >
                    <span className="btn-icon">😊</span>
                    <span className="btn-text">Pasidalinti savo nuotaika</span>
                </button>
            </div>

            {/* Tabs for Camp vs Personal vs Participants */}
            <div className="climate-tabs">
                <button
                    className={`tab-button ${activeTab === 'camp' ? 'active' : ''}`}
                    onClick={() => setActiveTab('camp')}
                >
                    Visos Stovyklos Nuotaika
                </button>
                <button
                    className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    Mano Nuotaika
                </button>
                <button
                    className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
                    onClick={() => setActiveTab('participants')}
                >
                    Dalyvių Atsiliepimai
                </button>
            </div>

            {/* Camp-wide Mood Overview */}
            {activeTab === 'camp' && (
                <div className="camp-mood-section">
                    {loading && (
                        <div className="loading-message">
                            <p>Kraunama...</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()} className="retry-button">
                                Bandyti dar kartą
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <div className="mood-summary">
                                <div className="summary-card">
                                    <h3>Šiandien</h3>
                                    <div className="summary-value">
                                        <span className="mood-number">{todayMood.avgMood ? Number(todayMood.avgMood).toFixed(1) : '0.0'}</span>
                                        <span className="mood-emoji">{getMoodEmoji(todayMood.avgMood || 0)}</span>
                                    </div>
                                    <p>{todayMood.participantCount || 0} dalyviai</p>
                                </div>
                                <div className="summary-card">
                                    <h3>Vidutinė nuotaika</h3>
                                    <div className="summary-value">
                                        <span className="mood-number">{overallStats.overall_avg_mood ? Number(overallStats.overall_avg_mood).toFixed(1) : '0.0'}</span>
                                        <span className="mood-emoji">{getMoodEmoji(overallStats.overall_avg_mood || 0)}</span>
                                    </div>
                                    <p>Per visą stovyklą</p>
                                </div>
                                <div className="summary-card">
                                    <h3>Dalyvių skaičius</h3>
                                    <div className="summary-value">
                                        <span className="mood-number">{overallStats.total_participants || 0}</span>
                                    </div>
                                    <p>Aktyvūs dalyviai</p>
                                </div>
                            </div>

                            <div className="mood-table-container">
                                <h3>Nuotaikos tendencijos per savaitę</h3>
                                <div className="mood-table">
                                    <div className="table-header">
                                        <div className="header-cell">Diena</div>
                                        <div className="header-cell">Vid. nuotaika</div>
                                        <div className="header-cell">Dalyviai</div>
                                        <div className="header-cell">Pagrindinės mintys</div>
                                    </div>
                                    {campMoodData.length > 0 ? (
                                        campMoodData.map((day, index) => (
                                            <div key={index} className="table-row">
                                                <div className="table-cell day-cell">{new Date(day.date).toLocaleDateString('lt-LT', { weekday: 'long' })}</div>
                                                <div className="table-cell mood-cell">
                                                    <span className="mood-display">
                                                        {day.avg_mood ? Number(day.avg_mood).toFixed(1) : '0.0'} {getMoodEmoji(day.avg_mood || 0)}
                                                    </span>
                                                </div>
                                                <div className="table-cell participants-cell">{day.participant_count || 0}</div>
                                                <div className="table-cell thoughts-cell">{day.thoughts || 'Nėra komentarų'}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="table-row">
                                            <div className="table-cell" colSpan="4">
                                                <p>Dar nėra nuotaikos duomenų</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mood Graph with Error Handling */}
                            {import.meta.env.VITE_ENABLE_CLIMATE_GRAPH === 'true' ? (
                                <div className="graph-section">
                                    <div className="graph-toggle">
                                        <button
                                            className={`toggle-btn ${use3DGraph ? 'active' : ''}`}
                                            onClick={() => setUse3DGraph(true)}
                                        >
                                            3D Vizualizacija
                                        </button>
                                        <button
                                            className={`toggle-btn ${!use3DGraph ? 'active' : ''}`}
                                            onClick={() => setUse3DGraph(false)}
                                        >
                                            2D Vizualizacija
                                        </button>
                                    </div>

                                    {graphError && (
                                        <div className="graph-error">
                                            <p>3D grafikas nepalaikomas. Perjungiama į 2D versiją.</p>
                                        </div>
                                    )}

                                    {use3DGraph ? (
                                        <div onError={() => {
                                            setGraphError(true);
                                            setUse3DGraph(false);
                                        }}>
                                            <MoodGraph campMoodData={campMoodData} />
                                        </div>
                                    ) : (
                                        <MoodGraph2D campMoodData={campMoodData} />
                                    )}
                                </div>
                            ) : (
                                <div className="feature-disabled-message">
                                    <div className="message-content">
                                        <h3>📊 Nuotaikos Vizualizacija</h3>
                                        <p>Ši funkcija šiuo metu išjungta.</p>
                                        {/* <div className="message-details">
                                            <p><strong>Funkcija:</strong> 3D/2D nuotaikos grafikas</p>
                                            <p><strong>Kintamasis:</strong> VITE_ENABLE_CLIMATE_GRAPH</p>
                                        </div> */}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Personal Mood History */}
            {activeTab === 'personal' && (
                <div className="personal-mood-section">
                    {loading && (
                        <div className="loading-message">
                            <p>Kraunama...</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()} className="retry-button">
                                Bandyti dar kartą
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <div className="personal-summary">
                                <div className="summary-card">
                                    <h3>Mano vidutinė nuotaika</h3>
                                    <div className="summary-value">
                                        <span className="mood-number">{personalStats.avg_mood ? Number(personalStats.avg_mood).toFixed(1) : '0.0'}</span>
                                        <span className="mood-emoji">{getMoodEmoji(personalStats.avg_mood || 0)}</span>
                                    </div>
                                    <p>Per visą stovyklą</p>
                                </div>
                                <div className="summary-card">
                                    <h3>Geriausia diena</h3>
                                    <div className="summary-value">
                                        <span className="mood-number">{personalStats.max_mood || 0}</span>
                                        <span className="mood-emoji">{getMoodEmoji(personalStats.max_mood || 0)}</span>
                                    </div>
                                    <p>Geriausias rezultatas</p>
                                </div>
                                <div className="summary-card">
                                    <h3>Dienų skaičius</h3>
                                    <div className="summary-value">
                                        <span className="mood-number">{personalStats.days_with_entries || 0}</span>
                                    </div>
                                    <p>Užpildyta dienų</p>
                                </div>
                            </div>

                            <div className="personal-mood-chart">
                                <h3>Mano nuotaikos progresas</h3>
                                <MoodLineChart data={personalMoodData} width={400} height={250} />
                            </div>

                            <div className="personal-thoughts">
                                <h3>Mano mintys per savaitę</h3>
                                <div className="thoughts-list">
                                    {personalMoodData.length > 0 ? (
                                        personalMoodData.map((entry, index) => (
                                            <div key={index} className="thought-item">
                                                <div className="thought-header">
                                                    <span className="thought-day">{new Date(entry.created_at).toLocaleDateString('lt-LT', { weekday: 'long' })}</span>
                                                    <span className="thought-mood">
                                                        {entry.mood_score} {getMoodEmoji(entry.mood_score)}
                                                    </span>
                                                </div>
                                                <p className="thought-text">{entry.thoughts || 'Nėra komentarų'}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-data-message">
                                            <p>Dar nėra nuotaikos įrašų</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Participant Feedback */}
            {activeTab === 'participants' && (
                <ParticipantFeedback />
            )}

            {/* Mood Input Modal */}
            {
                showMoodModal && (
                    <div className="mood-modal-overlay" onClick={handleCloseModal}>
                        <div className="mood-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Kaip jaučiatės šiandien?</h2>
                                <button className="close-modal-btn" onClick={handleCloseModal}>
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleMoodSubmit} className="mood-form">
                                <div className="mood-scale">
                                    <label>Nuotaikos skalė (1-5):</label>
                                    <div className="mood-buttons">
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                className={`mood-button ${currentMood === value ? 'active' : ''}`}
                                                onClick={() => setCurrentMood(value)}
                                                style={{
                                                    backgroundColor: currentMood === value ? getMoodColor(value) : 'var(--accent)',
                                                    borderColor: getMoodColor(value)
                                                }}
                                            >
                                                {value} {getMoodEmoji(value)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mood-text">
                                    <label htmlFor="moodText">Papildomi komentarai (neprivaloma):</label>
                                    <textarea
                                        id="moodText"
                                        value={moodText}
                                        onChange={(e) => setMoodText(e.target.value)}
                                        placeholder="Pasidalinkite savo mintimis, jausmais ar pastebėjimais..."
                                        rows="3"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={handleCloseModal} disabled={submitting}>
                                        Atšaukti
                                    </button>
                                    <button type="submit" className="submit-mood-btn" disabled={submitting}>
                                        {submitting ? 'Išsaugoma...' : 'Išsaugoti nuotaiką'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};