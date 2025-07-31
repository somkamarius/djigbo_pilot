import { useEffect, useRef } from 'react';
import './MoodGraph.css';

export const MoodGraph2D = ({ campMoodData }) => {
    const canvasRef = useRef();

    const handleFitToCanvas = () => {
        if (canvasRef.current) {
            // Trigger a re-render to fit the canvas
            const canvas = canvasRef.current;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            // Re-draw the graph
            const event = new Event('resize');
            window.dispatchEvent(event);
        }
    };

    useEffect(() => {
        if (!canvasRef.current || !campMoodData) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Create clusters
        const clusters = {};
        const moodLevels = [1, 2, 3, 4, 5];

        moodLevels.forEach((mood, index) => {
            clusters[mood] = {
                x: canvas.width * 0.2 + (index * canvas.width * 0.15),
                y: canvas.height * 0.3,
                radius: 30,
                mood: mood,
                color: getMoodColor(mood),
                feedbacks: []
            };
        });

        // Group individual participants by mood
        let participantId = 0;
        campMoodData.forEach((day, dayIndex) => {
            for (let i = 0; i < day.participants; i++) {
                // Generate individual mood variation around the day's average
                const moodVariation = (Math.random() - 0.5) * 2; // ±1 variation
                const individualMood = Math.max(1, Math.min(5, Math.round(day.avgMood + moodVariation)));

                if (clusters[individualMood]) {
                    clusters[individualMood].feedbacks.push({
                        day: day.day,
                        dayIndex: dayIndex,
                        participantId: participantId,
                        mood: individualMood,
                        participants: 1
                    });
                }
                participantId++;
            }
        });

        // Draw clusters
        Object.values(clusters).forEach(cluster => {
            // Draw cluster circle
            ctx.beginPath();
            ctx.arc(cluster.x, cluster.y, cluster.radius, 0, 2 * Math.PI);
            ctx.fillStyle = cluster.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw cluster label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Nuotaika ${cluster.mood}`, cluster.x, cluster.y + 5);

            // Draw participant count
            ctx.font = '12px Arial';
            ctx.fillText(`${cluster.feedbacks.length} dienos`, cluster.x, cluster.y + 20);
        });

        // Draw individual participant nodes and connections
        Object.values(clusters).forEach(cluster => {
            cluster.feedbacks.forEach((feedback, feedbackIndex) => {
                const angle = (feedbackIndex / cluster.feedbacks.length) * 2 * Math.PI;
                const distance = cluster.radius + 60;
                const feedbackX = cluster.x + Math.cos(angle) * distance;
                const feedbackY = cluster.y + Math.sin(angle) * distance;

                // Draw connection line
                ctx.beginPath();
                ctx.moveTo(cluster.x, cluster.y);
                ctx.lineTo(feedbackX, feedbackY);
                ctx.strokeStyle = cluster.color;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Draw participant node
                const nodeRadius = 6;
                ctx.beginPath();
                ctx.arc(feedbackX, feedbackY, nodeRadius, 0, 2 * Math.PI);
                ctx.fillStyle = cluster.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Draw participant ID
                ctx.fillStyle = '#333';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`P${feedback.participantId + 1}`, feedbackX, feedbackY + 2);

                // Draw mood value
                ctx.fillText(feedback.mood, feedbackX, feedbackY + 12);
            });
        });

        // Draw legend
        const legendY = canvas.height - 80;
        moodLevels.forEach((mood, index) => {
            const legendX = 20 + index * 120;

            ctx.fillStyle = getMoodColor(mood);
            ctx.beginPath();
            ctx.arc(legendX, legendY, 8, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Nuotaika ${mood}`, legendX + 15, legendY + 3);
        });

    }, [campMoodData]);

    const getMoodColor = (mood) => {
        if (mood >= 4.5) return '#4CAF50';
        if (mood >= 3.5) return '#8BC34A';
        if (mood >= 2.5) return '#FFC107';
        if (mood >= 1.5) return '#FF9800';
        return '#F44336';
    };

    return (
        <div className="mood-graph-container">
            <div className="graph-header">
                <h3>2D Nuotaikos Vizualizacija</h3>
                <p>Stovyklos dalyvių nuotaikos ir atsiliepimų tinklas</p>
            </div>

            <div className="graph-summary">
                <div className="summary-stat">
                    <span className="stat-number">{campMoodData.length}</span>
                    <span className="stat-label">Dienos</span>
                </div>
                <div className="summary-stat">
                    <span className="stat-number">
                        {(campMoodData.reduce((sum, day) => sum + day.avgMood, 0) / campMoodData.length).toFixed(1)}
                    </span>
                    <span className="stat-label">Vid. nuotaika</span>
                </div>
                <div className="summary-stat">
                    <span className="stat-number">
                        {campMoodData.reduce((sum, day) => sum + day.participants, 0)}
                    </span>
                    <span className="stat-label">Iš viso dalyvių</span>
                </div>
            </div>

            <div className="graph-instructions">
                <p>💡 Vizualizacija: Kiekvienas spalvotas apskritimas rodo nuotaikos lygį, maži apskritimai - atsiliepimus</p>
                <button
                    className="fit-canvas-btn"
                    onClick={handleFitToCanvas}
                    title="Perkrauti vizualizaciją"
                >
                    🔄 Perkrauti
                </button>
            </div>

            <canvas
                ref={canvasRef}
                className="graph-canvas-2d"
                style={{
                    width: '100%',
                    height: '500px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                }}
            />
        </div>
    );
}; 