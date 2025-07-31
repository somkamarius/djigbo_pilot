import { useState } from 'react';
import './Climate.css';
import { MoodGraph } from './MoodGraph';
import { MoodGraph2D } from './MoodGraph2D';
import { ParticipantFeedback } from './ParticipantFeedback';

export const Climate = () => {
    const [currentMood, setCurrentMood] = useState(3);
    const [moodText, setMoodText] = useState('');
    const [activeTab, setActiveTab] = useState('camp');
    const [showMoodModal, setShowMoodModal] = useState(false);
    const [use3DGraph, setUse3DGraph] = useState(true);
    const [graphError, setGraphError] = useState(false);

    // Mock data for camp-wide mood
    const campMoodData = [
        { day: 'Pirmadienis', avgMood: 4.2, participants: 24, thoughts: 'Labai gerai pradėjome stovyklą! Visi susipažinome ir pradėjome veiklą su entuziazmu.' },
        { day: 'Antradienis', avgMood: 3.8, participants: 24, thoughts: 'Šiek tiek pavargome po intensyvių veiklų, bet vis dar smagu. Oras buvo šaltesnis nei tikėtasi.' },
        { day: 'Trečiadienis', avgMood: 4.5, participants: 23, thoughts: 'Puikus oras, puikūs veiksmai! Visi dalyvavo žaidimuose ir buvo labai aktyvūs.' },
        { day: 'Ketvirtadienis', avgMood: 4.1, participants: 24, thoughts: 'Artėja stovyklos pabaiga, šiek tiek liūdna. Bet vis dar smagu ir veiklų daug.' },
        { day: 'Penktadienis', avgMood: 4.7, participants: 24, thoughts: 'Paskutinė diena - visi labai susijaudinę! Puiki stovykla, visi norėtų dar ilgiau.' },
        { day: 'Šeštadienis', avgMood: 4.3, participants: 22, thoughts: 'Papildoma diena stovyklai! Mažiau dalyvių, bet vis dar smagu ir veiklų daug.' },
        { day: 'Sekmadienis', avgMood: 4.8, participants: 20, thoughts: 'Paskutinė diena - visi labai susijaudinę! Puiki stovykla, visi norėtų dar ilgiau.' },
        { day: 'Pirmadienis', avgMood: 3.9, participants: 18, thoughts: 'Nauja savaitė prasidėjo! Kai kurie dalyviai grįžo, kiti išvyko. Vis dar smagu.' },
        { day: 'Antradienis', avgMood: 4.4, participants: 20, thoughts: 'Puikus oras, puikūs veiksmai! Visi dalyvavo žaidimuose ir buvo labai aktyvūs.' },
        { day: 'Trečiadienis', avgMood: 4.6, participants: 21, thoughts: 'Labai gerai pradėjome stovyklą! Visi susipažinome ir pradėjome veiklą su entuziazmu.' },
        { day: 'Ketvirtadienis', avgMood: 4.0, participants: 19, thoughts: 'Šiek tiek pavargome po intensyvių veiklų, bet vis dar smagu. Oras buvo šaltesnis nei tikėtasi.' },
        { day: 'Penktadienis', avgMood: 4.9, participants: 22, thoughts: 'Paskutinė diena - visi labai susijaudinę! Puiki stovykla, visi norėtų dar ilgiau.' }
    ];

    // Mock data for personal mood history
    const personalMoodData = [
        { day: 'Pirmadienis', mood: 4, thoughts: 'Labai gerai pradėjome stovyklą! Susipažinau su daugeliu naujų žmonių.' },
        { day: 'Antradienis', mood: 3, thoughts: 'Šiek tiek pavargau po intensyvių veiklų, bet vis dar smagu. Oras buvo šaltesnis.' },
        { day: 'Trečiadienis', mood: 5, thoughts: 'Puikus oras, puikūs veiksmai! Dalyvavau visuose žaidimuose ir buvau labai aktyvus.' },
        { day: 'Ketvirtadienis', mood: 4, thoughts: 'Artėja stovyklos pabaiga, šiek tiek liūdna. Bet vis dar smagu ir veiklų daug.' },
        { day: 'Penktadienis', mood: 5, thoughts: 'Paskutinė diena - labai susijaudinęs! Puiki stovykla, norėčiau dar ilgiau.' },
        { day: 'Šeštadienis', mood: 4, thoughts: 'Papildoma diena stovyklai! Mažiau dalyvių, bet vis dar smagu ir veiklų daug.' },
        { day: 'Sekmadienis', mood: 5, thoughts: 'Paskutinė diena - labai susijaudinęs! Puiki stovykla, norėčiau dar ilgiau.' },
        { day: 'Pirmadienis', mood: 4, thoughts: 'Nauja savaitė prasidėjo! Kai kurie dalyviai grįžo, kiti išvyko. Vis dar smagu.' },
        { day: 'Antradienis', mood: 4, thoughts: 'Puikus oras, puikūs veiksmai! Dalyvavau žaidimuose ir buvau aktyvus.' },
        { day: 'Trečiadienis', mood: 5, thoughts: 'Labai gerai pradėjome stovyklą! Susipažinau su daugeliu naujų žmonių.' },
        { day: 'Ketvirtadienis', mood: 3, thoughts: 'Šiek tiek pavargau po intensyvių veiklų, bet vis dar smagu. Oras buvo šaltesnis.' },
        { day: 'Penktadienis', mood: 5, thoughts: 'Paskutinė diena - labai susijaudinęs! Puiki stovykla, norėčiau dar ilgiau.' }
    ];

    const handleMoodSubmit = (e) => {
        e.preventDefault();
        // Here you would send the mood data to the API
        console.log('Mood submitted:', { mood: currentMood, thoughts: moodText });
        alert('Jūsų nuotaika išsaugota!');
        setMoodText('');
        setShowMoodModal(false);
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
                    <div className="mood-summary">
                        <div className="summary-card">
                            <h3>Šiandien</h3>
                            <div className="summary-value">
                                <span className="mood-number">4.2</span>
                                <span className="mood-emoji">😊</span>
                            </div>
                            <p>24 dalyviai</p>
                        </div>
                        <div className="summary-card">
                            <h3>Vidutinė nuotaika</h3>
                            <div className="summary-value">
                                <span className="mood-number">4.3</span>
                                <span className="mood-emoji">😊</span>
                            </div>
                            <p>Per visą stovyklą</p>
                        </div>
                        <div className="summary-card">
                            <h3>Dalyvių skaičius</h3>
                            <div className="summary-value">
                                <span className="mood-number">24</span>
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
                            {campMoodData.map((day, index) => (
                                <div key={index} className="table-row">
                                    <div className="table-cell day-cell">{day.day}</div>
                                    <div className="table-cell mood-cell">
                                        <span className="mood-display">
                                            {day.avgMood.toFixed(1)} {getMoodEmoji(day.avgMood)}
                                        </span>
                                    </div>
                                    <div className="table-cell participants-cell">{day.participants}</div>
                                    <div className="table-cell thoughts-cell">{day.thoughts}</div>
                                </div>
                            ))}
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
                                <p>Ši funkcija šiuo metu išjungta. Administratorius gali ją įjungti per aplinkos kintamuosius.</p>
                                <div className="message-details">
                                    <p><strong>Funkcija:</strong> 3D/2D nuotaikos grafikas</p>
                                    <p><strong>Kintamasis:</strong> VITE_ENABLE_CLIMATE_GRAPH</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Personal Mood History */}
            {activeTab === 'personal' && (
                <div className="personal-mood-section">
                    <div className="personal-summary">
                        <div className="summary-card">
                            <h3>Mano vidutinė nuotaika</h3>
                            <div className="summary-value">
                                <span className="mood-number">4.2</span>
                                <span className="mood-emoji">😊</span>
                            </div>
                            <p>Per visą stovyklą</p>
                        </div>
                        <div className="summary-card">
                            <h3>Geriausia diena</h3>
                            <div className="summary-value">
                                <span className="mood-number">5.0</span>
                                <span className="mood-emoji">😊</span>
                            </div>
                            <p>Trečiadienis</p>
                        </div>
                        <div className="summary-card">
                            <h3>Dienų skaičius</h3>
                            <div className="summary-value">
                                <span className="mood-number">5</span>
                            </div>
                            <p>Užpildyta dienų</p>
                        </div>
                    </div>

                    <div className="personal-mood-chart">
                        <h3>Mano nuotaikos progresas</h3>
                        <div className="mood-chart">
                            {personalMoodData.map((day, index) => (
                                <div key={index} className="chart-day">
                                    <div className="chart-bar">
                                        <div
                                            className="bar-fill"
                                            style={{
                                                height: `${(day.mood / 5) * 100}%`,
                                                backgroundColor: getMoodColor(day.mood)
                                            }}
                                        ></div>
                                    </div>
                                    <div className="chart-label">
                                        <span className="day-name">{day.day}</span>
                                        <span className="day-mood">{day.mood}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="personal-thoughts">
                        <h3>Mano mintys per savaitę</h3>
                        <div className="thoughts-list">
                            {personalMoodData.map((day, index) => (
                                <div key={index} className="thought-item">
                                    <div className="thought-header">
                                        <span className="thought-day">{day.day}</span>
                                        <span className="thought-mood">
                                            {day.mood} {getMoodEmoji(day.mood)}
                                        </span>
                                    </div>
                                    <p className="thought-text">{day.thoughts}</p>
                                </div>
                            ))}
                        </div>
                    </div>
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
                                    <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                                        Atšaukti
                                    </button>
                                    <button type="submit" className="submit-mood-btn">
                                        Išsaugoti nuotaiką
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