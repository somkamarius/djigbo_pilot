import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './ParticipantFeedback.css';

export const ParticipantFeedback = () => {
    const { getAccessTokenSilently } = useAuth0();
    const [selectedDay, setSelectedDay] = useState('all');
    const [participantsData, setParticipantsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch participants data
    const fetchParticipantsData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getAccessTokenSilently();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/mood/participants`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch participants data');
            }

            const data = await response.json();
            setParticipantsData(data.participantsByDate || {});
        } catch (err) {
            console.error('Error fetching participants data:', err);
            setError('Nepavyko gauti dalyvių duomenų');
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchParticipantsData();
    }, []);

    // Transform data for display
    const transformDataForDisplay = () => {
        const transformedData = [];

        Object.entries(participantsData).forEach(([date, participants]) => {
            const dayName = new Date(date).toLocaleDateString('lt-LT', { weekday: 'long' });

            // Ensure participants is an array before mapping
            const participantsArray = Array.isArray(participants) ? participants : [];

            transformedData.push({
                day: dayName,
                date: date,
                participants: participantsArray.map(p => ({
                    id: p.id,
                    name: p.nickname || 'Anonimas',
                    mood: p.mood_score,
                    thoughts: p.thoughts || 'Nėra komentarų',
                    avatar: p.avatar
                }))
            });
        });

        return transformedData.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const participantFeedbackData = transformDataForDisplay();

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

    const filteredData = selectedDay === 'all'
        ? participantFeedbackData
        : participantFeedbackData.filter(day => day.day === selectedDay);

    const filteredParticipants = filteredData.flatMap(day => day.participants);
    const avgMood = filteredParticipants.length > 0
        ? (filteredParticipants.reduce((sum, p) => sum + p.mood, 0) / filteredParticipants.length).toFixed(1)
        : '0.0';

    return (
        <div className="participant-feedback-container">
            <div className="feedback-header">
                <h3>Dalyvių Atsiliepimai</h3>
                <p>Detalūs atsiliepimai iš kiekvieno dalyvio</p>
            </div>

            {loading && (
                <div className="loading-message">
                    <p>Kraunama...</p>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchParticipantsData} className="retry-button">
                        Bandyti dar kartą
                    </button>
                </div>
            )}

            {!loading && !error && (
                <>

                    <div className="feedback-controls">
                        <div className="day-selector">
                            <label>Pasirinkite dieną:</label>
                            <select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                            >
                                <option value="all">Visos dienos</option>
                                {participantFeedbackData.map(day => (
                                    <option key={day.day} value={day.day}>{day.day}</option>
                                ))}
                            </select>
                        </div>

                        <div className="feedback-summary">
                            <div className="summary-stat">
                                <span className="stat-number">{filteredParticipants.length}</span>
                                <span className="stat-label">Dalyviai</span>
                            </div>
                            <div className="summary-stat">
                                <span className="stat-number">{avgMood}</span>
                                <span className="stat-label">Vid. nuotaika</span>
                            </div>
                            <div className="summary-stat">
                                <span className="stat-number">
                                    {filteredParticipants.filter(p => p.mood >= 4).length}
                                </span>
                                <span className="stat-label">Patenkinti</span>
                            </div>
                        </div>
                    </div>

                    <div className="participants-grid">
                        {filteredData.map(day => (
                            <div key={day.day} className="day-section">
                                <h4 className="day-title">{day.day}</h4>
                                <div className="participants-list">
                                    {day.participants.map(participant => (
                                        <div
                                            key={`${day.day}-${participant.id}`}
                                            className="participant-card"
                                            style={{ borderLeftColor: getMoodColor(participant.mood) }}
                                        >
                                            <div className="participant-header">
                                                <div className="participant-info">
                                                    <span className="participant-name">{participant.name}</span>
                                                </div>
                                                <div className="participant-mood">
                                                    <span className="mood-value">{participant.mood}</span>
                                                    <span className="mood-emoji">{getMoodEmoji(participant.mood)}</span>
                                                </div>
                                            </div>
                                            <p className="participant-thoughts">{participant.thoughts}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}; 