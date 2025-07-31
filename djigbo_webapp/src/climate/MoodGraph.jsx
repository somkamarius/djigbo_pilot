import { useEffect, useRef } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import './MoodGraph.css';

export const MoodGraph = ({ campMoodData }) => {
    const containerRef = useRef();
    const graphRef = useRef();

    const handleFitToCanvas = () => {
        if (graphRef.current) {
            graphRef.current.zoomToFit(800, 100);
        }
    };

    const generateIndividualThoughts = (baseThoughts, mood) => {
        const thoughtVariations = [
            'Labai gerai!',
            'Smagu su draugais.',
            'Puikus oras!',
            'Šiek tiek pavargau.',
            'Labai susijaudinęs!',
            'Puikūs veiksmai!',
            'Norėčiau dar ilgiau.',
            'Smagu susipažinti.',
            'Puikus žaidimas!',
            'Labai gerai pradėjome!'
        ];

        if (mood >= 4) {
            return thoughtVariations[Math.floor(Math.random() * 5)]; // Positive thoughts
        } else if (mood >= 3) {
            return thoughtVariations[Math.floor(Math.random() * 3) + 5]; // Neutral thoughts
        } else {
            return 'Šiek tiek pavargau, bet vis dar smagu.'; // Lower mood thoughts
        }
    };

    useEffect(() => {
        if (!containerRef.current || !campMoodData) return;

        try {

            // Create graph data structure
            const graphData = {
                nodes: [],
                links: []
            };

            // Create cluster nodes for each mood level
            const moodClusters = {};
            const moodLevels = [1, 2, 3, 4, 5];

            moodLevels.forEach(mood => {
                const clusterId = `cluster-${mood}`;
                moodClusters[mood] = clusterId;

                graphData.nodes.push({
                    id: clusterId,
                    name: `Nuotaika ${mood}`,
                    mood: mood,
                    isCluster: true,
                    size: 10,
                    color: getMoodColor(mood),
                    val: 10
                });
            });

            // Create individual participant feedback nodes
            let participantId = 0;
            campMoodData.forEach((day, dayIndex) => {
                // Create individual nodes for each participant's feedback
                for (let i = 0; i < day.participants; i++) {
                    const participantNodeId = `participant-${participantId}`;

                    // Generate individual mood variation around the day's average
                    const moodVariation = (Math.random() - 0.5) * 2; // ±1 variation
                    const individualMood = Math.max(1, Math.min(5, Math.round(day.avgMood + moodVariation)));

                    // Generate individual thoughts based on the day's theme
                    const individualThoughts = generateIndividualThoughts(day.thoughts, individualMood);

                    graphData.nodes.push({
                        id: participantNodeId,
                        name: `Dalyvis ${participantId + 1}`,
                        mood: individualMood,
                        isParticipant: true,
                        day: day.day,
                        dayIndex: dayIndex,
                        participantIndex: i,
                        thoughts: individualThoughts,
                        size: 5, // Fixed smaller size for better distribution
                        color: getMoodColor(individualMood),
                        val: individualMood
                    });

                    // Link participant to their mood cluster
                    const clusterId = moodClusters[individualMood];
                    graphData.links.push({
                        source: participantNodeId,
                        target: clusterId,
                        value: individualMood,
                        color: getMoodColor(individualMood)
                    });

                    // Create connections between participants from the same day
                    if (i > 0) {
                        const prevParticipantId = `participant-${participantId - 1}`;
                        graphData.links.push({
                            source: prevParticipantId,
                            target: participantNodeId,
                            value: 1,
                            color: '#888',
                            opacity: 0.2
                        });
                    }

                    participantId++;
                }

                // Create connections between days (representing time progression)
                if (dayIndex > 0) {
                    const prevDayLastParticipant = `participant-${participantId - day.participants - 1}`;
                    const currentDayFirstParticipant = `participant-${participantId - day.participants}`;
                    graphData.links.push({
                        source: prevDayLastParticipant,
                        target: currentDayFirstParticipant,
                        value: 1,
                        color: '#666',
                        opacity: 0.3
                    });
                }
            });

            // Initialize the 3D force graph
            const Graph = ForceGraph3D()(containerRef.current)
                .graphData(graphData)
                .nodeThreeObject(node => {
                    if (node.isCluster) {
                        // Create cluster node with text
                        const sprite = new THREE.Sprite(
                            new THREE.SpriteMaterial({
                                map: new THREE.CanvasTexture(
                                    (() => {
                                        const canvas = document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.width = 256;
                                        canvas.height = 128;

                                        // Background
                                        context.fillStyle = node.color;
                                        context.fillRect(0, 0, canvas.width, canvas.height);

                                        // Border
                                        context.strokeStyle = '#fff';
                                        context.lineWidth = 4;
                                        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

                                        // Text
                                        context.fillStyle = '#fff';
                                        context.font = 'bold 24px Arial';
                                        context.textAlign = 'center';
                                        context.fillText(node.name, canvas.width / 2, 35);

                                        const participantNodes = graphData.nodes.filter(n =>
                                            n.isParticipant && graphData.links.some(link =>
                                                link.source === n.id && link.target === node.id
                                            )
                                        );
                                        context.font = '18px Arial';
                                        context.fillText(`Dalyvių: ${participantNodes.length}`, canvas.width / 2, 65);

                                        return canvas;
                                    })()
                                )
                            })
                        );
                        sprite.scale.set(12, 6, 1);
                        return sprite;
                    } else {
                        // Create participant node with text
                        const sprite = new THREE.Sprite(
                            new THREE.SpriteMaterial({
                                map: new THREE.CanvasTexture(
                                    (() => {
                                        const canvas = document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.width = 200;
                                        canvas.height = 100;

                                        // Background
                                        context.fillStyle = node.color;
                                        context.fillRect(0, 0, canvas.width, canvas.height);

                                        // Border
                                        context.strokeStyle = '#fff';
                                        context.lineWidth = 2;
                                        context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

                                        // Text
                                        context.fillStyle = '#fff';
                                        context.font = 'bold 16px Arial';
                                        context.textAlign = 'center';
                                        context.fillText(node.name, canvas.width / 2, 25);
                                        context.font = '14px Arial';
                                        context.fillText(node.day, canvas.width / 2, 45);
                                        context.fillText(`Nuotaika: ${node.mood}/5`, canvas.width / 2, 65);

                                        // Truncate thoughts if too long
                                        const thoughts = node.thoughts.length > 20 ?
                                            node.thoughts.substring(0, 20) + '...' : node.thoughts;
                                        context.font = '12px Arial';
                                        context.fillText(`"${thoughts}"`, canvas.width / 2, 85);

                                        return canvas;
                                    })()
                                )
                            })
                        );
                        sprite.scale.set(8, 4, 1);
                        return sprite;
                    }
                })
                .nodeColor(node => node.color)
                .nodeVal(node => node.val)
                .linkColor(link => link.color)
                .linkOpacity(0.6)
                .linkWidth(link => link.value * 0.5)
                .cooldownTicks(200)
                .cooldownTime(20000)
                .enableNodeDrag(false)
                .enableNavigationControls(true)
                .onNodeClick(node => {
                    if (node.isCluster) {
                        // Focus on cluster with animation
                        Graph.centerAt(node.x, node.y, node.z, 1000);
                        Graph.controls().autoRotate = false;
                        setTimeout(() => {
                            Graph.controls().autoRotate = true;
                        }, 2000);
                    } else {
                        // Show detailed info for individual participants
                        console.log('Participant details:', {
                            name: node.name,
                            day: node.day,
                            mood: node.mood,
                            thoughts: node.thoughts
                        });
                    }
                })
                .onNodeHover(node => {
                    if (node) {
                        containerRef.current.style.cursor = 'pointer';
                    } else {
                        containerRef.current.style.cursor = 'default';
                    }
                })
                .onEngineStop(() => {
                    // Fit graph to canvas with proper parameters
                    Graph.zoomToFit(800, 100);
                    setTimeout(() => {
                        Graph.controls().autoRotate = true;
                        Graph.controls().autoRotateSpeed = 0.3;
                    }, 2000);
                });

            graphRef.current = Graph;

        } catch (error) {
            console.error('Error initializing 3D graph:', error);
            // Fallback to 2D graph will be handled by parent component
            throw error;
        }

        return () => {
            if (graphRef.current) {
                graphRef.current._destructor();
            }
        };
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
                <h3>3D Nuotaikos Vizualizacija</h3>
                <p>Kiekvienas taškas - individualus dalyvio atsiliepimas</p>
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
                    <span className="stat-label">Iš viso atsiliepimų</span>
                </div>
            </div>

            <div className="graph-legend">
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
                    <span>Labai gerai (4.5-5.0) 😊</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#8BC34A' }}></div>
                    <span>Gerai (3.5-4.4) 🙂</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#FFC107' }}></div>
                    <span>Vidutiniškai (2.5-3.4) 😐</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#FF9800' }}></div>
                    <span>Blogai (1.5-2.4) 😕</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#F44336' }}></div>
                    <span>Labai blogai (1.0-1.4) 😢</span>
                </div>
            </div>

            <div className="graph-instructions">
                <p>💡 Patarimai: Naudokite pelę grafikui pasukti, ratuką priartinti/atitolinti</p>
                <button
                    className="fit-canvas-btn"
                    onClick={handleFitToCanvas}
                    title="Priartinti grafiką prie ekrano"
                >
                    🔍 Priartinti grafiką
                </button>
            </div>

            <div ref={containerRef} className="graph-canvas" />
        </div>
    );
}; 