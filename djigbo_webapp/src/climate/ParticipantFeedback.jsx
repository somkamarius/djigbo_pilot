import { useState } from 'react';
import './ParticipantFeedback.css';

export const ParticipantFeedback = () => {
    const [selectedDay, setSelectedDay] = useState('all');

    // Mock data for individual participant feedback
    const participantFeedbackData = [
        {
            day: 'Pirmadienis',
            participants: [
                { id: 1, name: 'Jonas', mood: 5, thoughts: 'Labai gerai pradėjome! Susipažinau su daugeliu naujų žmonių.', age: 15 },
                { id: 2, name: 'Marija', mood: 4, thoughts: 'Smagu, bet šiek tiek nerimauju dėl naujų veiklų.', age: 14 },
                { id: 3, name: 'Petras', mood: 4, thoughts: 'Puikus oras, puikūs žaidimai!', age: 16 },
                { id: 4, name: 'Ana', mood: 3, thoughts: 'Šiek tiek pavargau, bet vis dar smagu.', age: 15 },
                { id: 5, name: 'Tomas', mood: 5, thoughts: 'Labai gerai pradėjome stovyklą!', age: 14 },
                { id: 6, name: 'Laura', mood: 4, thoughts: 'Smagu susipažinti su naujais draugais.', age: 15 },
                { id: 7, name: 'Karolis', mood: 4, thoughts: 'Puikus oras, puikūs veiksmai!', age: 16 },
                { id: 8, name: 'Ieva', mood: 5, thoughts: 'Labai gerai pradėjome!', age: 14 }
            ]
        },
        {
            day: 'Antradienis',
            participants: [
                { id: 1, name: 'Jonas', mood: 4, thoughts: 'Šiek tiek pavargau, bet vis dar smagu.', age: 15 },
                { id: 2, name: 'Marija', mood: 3, thoughts: 'Nerimauju dėl rytojaus veiklų.', age: 14 },
                { id: 3, name: 'Petras', mood: 4, thoughts: 'Puikus oras, puikūs žaidimai!', age: 16 },
                { id: 4, name: 'Ana', mood: 2, thoughts: 'Labai pavargau, oras šaltas.', age: 15 },
                { id: 5, name: 'Tomas', mood: 4, thoughts: 'Smagu, bet šiek tiek pavargau.', age: 14 },
                { id: 6, name: 'Laura', mood: 4, thoughts: 'Puikus oras, puikūs veiksmai!', age: 15 },
                { id: 7, name: 'Karolis', mood: 5, thoughts: 'Labai gerai!', age: 16 },
                { id: 8, name: 'Ieva', mood: 4, thoughts: 'Smagu su draugais.', age: 14 }
            ]
        },
        {
            day: 'Trečiadienis',
            participants: [
                { id: 1, name: 'Jonas', mood: 5, thoughts: 'Puikus oras, puikūs veiksmai!', age: 15 },
                { id: 2, name: 'Marija', mood: 5, thoughts: 'Labai gerai! Visi žaidimai buvo smagu.', age: 14 },
                { id: 3, name: 'Petras', mood: 5, thoughts: 'Puikus oras, puikūs žaidimai!', age: 16 },
                { id: 4, name: 'Ana', mood: 4, thoughts: 'Smagu, bet šiek tiek pavargau.', age: 15 },
                { id: 5, name: 'Tomas', mood: 5, thoughts: 'Labai gerai!', age: 14 },
                { id: 6, name: 'Laura', mood: 5, thoughts: 'Puikus oras, puikūs veiksmai!', age: 15 },
                { id: 7, name: 'Karolis', mood: 5, thoughts: 'Labai gerai!', age: 16 },
                { id: 8, name: 'Ieva', mood: 5, thoughts: 'Smagu su draugais.', age: 14 }
            ]
        },
        {
            day: 'Ketvirtadienis',
            participants: [
                { id: 1, name: 'Jonas', mood: 4, thoughts: 'Artėja stovyklos pabaiga, šiek tiek liūdna.', age: 15 },
                { id: 2, name: 'Marija', mood: 4, thoughts: 'Smagu, bet jau galvoju apie namus.', age: 14 },
                { id: 3, name: 'Petras', mood: 4, thoughts: 'Puikus oras, puikūs žaidimai!', age: 16 },
                { id: 4, name: 'Ana', mood: 3, thoughts: 'Šiek tiek liūdna, kad greitai baigiasi.', age: 15 },
                { id: 5, name: 'Tomas', mood: 5, thoughts: 'Labai gerai!', age: 14 },
                { id: 6, name: 'Laura', mood: 4, thoughts: 'Puikus oras, puikūs veiksmai!', age: 15 },
                { id: 7, name: 'Karolis', mood: 4, thoughts: 'Smagu, bet šiek tiek liūdna.', age: 16 },
                { id: 8, name: 'Ieva', mood: 4, thoughts: 'Smagu su draugais.', age: 14 }
            ]
        },
        {
            day: 'Penktadienis',
            participants: [
                { id: 1, name: 'Jonas', mood: 5, thoughts: 'Paskutinė diena - labai susijaudinęs!', age: 15 },
                { id: 2, name: 'Marija', mood: 5, thoughts: 'Puiki stovykla! Norėčiau dar ilgiau.', age: 14 },
                { id: 3, name: 'Petras', mood: 5, thoughts: 'Puikus oras, puikūs žaidimai!', age: 16 },
                { id: 4, name: 'Ana', mood: 4, thoughts: 'Smagu, bet jau galvoju apie namus.', age: 15 },
                { id: 5, name: 'Tomas', mood: 5, thoughts: 'Labai gerai!', age: 14 },
                { id: 6, name: 'Laura', mood: 5, thoughts: 'Puikus oras, puikūs veiksmai!', age: 15 },
                { id: 7, name: 'Karolis', mood: 5, thoughts: 'Labai gerai!', age: 16 },
                { id: 8, name: 'Ieva', mood: 5, thoughts: 'Smagu su draugais.', age: 14 }
            ]
        }
    ];

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

    const allParticipants = filteredData.flatMap(day => day.participants);
    const avgMood = allParticipants.length > 0
        ? (allParticipants.reduce((sum, p) => sum + p.mood, 0) / allParticipants.length).toFixed(1)
        : '0.0';

    return (
        <div className="participant-feedback-container">
            <div className="feedback-header">
                <h3>Dalyvių Atsiliepimai</h3>
                <p>Detalūs atsiliepimai iš kiekvieno dalyvio</p>
            </div>

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
                        <span className="stat-number">{allParticipants.length}</span>
                        <span className="stat-label">Dalyviai</span>
                    </div>
                    <div className="summary-stat">
                        <span className="stat-number">{avgMood}</span>
                        <span className="stat-label">Vid. nuotaika</span>
                    </div>
                    <div className="summary-stat">
                        <span className="stat-number">
                            {allParticipants.filter(p => p.mood >= 4).length}
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
                                            <span className="participant-age">{participant.age} m.</span>
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
        </div>
    );
}; 