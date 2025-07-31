import React from 'react';
import './MoodLineChart.css';

export const MoodLineChart = ({ data, width = 400, height = 200 }) => {
    if (!data || data.length === 0) {
        return (
            <div className="mood-line-chart">
                <div className="no-data-message">
                    <p>Dar nėra nuotaikos įrašų</p>
                </div>
            </div>
        );
    }

    // Group data by day and calculate averages
    const groupByDay = (entries) => {
        const grouped = {};

        entries.forEach(entry => {
            const date = new Date(entry.created_at).toDateString(); // Get date without time
            if (!grouped[date]) {
                grouped[date] = {
                    date: date,
                    entries: [],
                    avgMood: 0,
                    count: 0
                };
            }
            grouped[date].entries.push(entry);
            grouped[date].count++;
        });

        // Calculate average mood for each day
        Object.values(grouped).forEach(day => {
            const totalMood = day.entries.reduce((sum, entry) => sum + entry.mood_score, 0);
            day.avgMood = totalMood / day.count;
        });

        return Object.values(grouped);
    };

    const dailyData = groupByDay(data);

    // Don't show line if there's only one day of data
    if (dailyData.length <= 1) {
        return (
            <div className="mood-line-chart">
                <div className="no-data-message">
                    <p>Reikia daugiau dienų duomenų, kad būtų galima rodyti progresą</p>
                </div>
            </div>
        );
    }

    // Sort data by date
    const sortedData = dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate chart dimensions
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Calculate scales
    const xScale = (value) => {
        const minDate = new Date(sortedData[0].date);
        const maxDate = new Date(sortedData[sortedData.length - 1].date);
        const dateRange = maxDate - minDate;
        const currentDate = new Date(value);
        return margin.left + ((currentDate - minDate) / dateRange) * chartWidth;
    };

    const yScale = (value) => {
        const minMood = 1;
        const maxMood = 5;
        const moodRange = maxMood - minMood;
        return margin.top + chartHeight - ((value - minMood) / moodRange) * chartHeight;
    };

    // Generate path for the line
    const generatePath = () => {
        return sortedData.map((point, index) => {
            const x = xScale(point.date);
            const y = yScale(point.avgMood);
            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        }).join(' ');
    };

    // Generate grid lines
    const generateGridLines = () => {
        const lines = [];

        // Horizontal grid lines (mood levels)
        for (let i = 1; i <= 5; i++) {
            const y = yScale(i);
            lines.push(
                <line
                    key={`grid-h-${i}`}
                    x1={margin.left}
                    y1={y}
                    x2={margin.left + chartWidth}
                    y2={y}
                    className="grid-line"
                />
            );
        }

        // Vertical grid lines (dates)
        sortedData.forEach((point, index) => {
            const x = xScale(point.date);
            lines.push(
                <line
                    key={`grid-v-${index}`}
                    x1={x}
                    y1={margin.top}
                    x2={x}
                    y2={margin.top + chartHeight}
                    className="grid-line"
                />
            );
        });

        return lines;
    };

    // Generate axis labels
    const generateAxisLabels = () => {
        const labels = [];

        // Y-axis labels (mood scores)
        for (let i = 1; i <= 5; i++) {
            const y = yScale(i);
            labels.push(
                <text
                    key={`y-label-${i}`}
                    x={margin.left - 10}
                    y={y + 4}
                    className="axis-label"
                    textAnchor="end"
                >
                    {i}
                </text>
            );
        }

        // X-axis labels (dates)
        sortedData.forEach((point, index) => {
            const x = xScale(point.date);
            const date = new Date(point.date);
            const dayName = date.toLocaleDateString('lt-LT', { weekday: 'short' });

            labels.push(
                <text
                    key={`x-label-${index}`}
                    x={x}
                    y={margin.top + chartHeight + 20}
                    className="axis-label"
                    textAnchor="middle"
                >
                    {dayName}
                </text>
            );
        });

        return labels;
    };

    // Generate data points
    const generateDataPoints = () => {
        return sortedData.map((point, index) => {
            const x = xScale(point.date);
            const y = yScale(point.avgMood);

            return (
                <g key={`point-${index}`}>
                    <circle
                        cx={x}
                        cy={y}
                        r="4"
                        className="data-point"
                        fill={getMoodColor(point.avgMood)}
                        stroke="#fff"
                        strokeWidth="2"
                    />
                    <text
                        x={x}
                        y={y - 10}
                        className="point-label"
                        textAnchor="middle"
                    >
                        {point.avgMood.toFixed(1)}
                    </text>
                    {point.count > 1 && (
                        <text
                            x={x}
                            y={y + 20}
                            className="point-count"
                            textAnchor="middle"
                        >
                            ({point.count})
                        </text>
                    )}
                </g>
            );
        });
    };

    const getMoodColor = (mood) => {
        if (mood >= 4.5) return '#4CAF50';
        if (mood >= 3.5) return '#8BC34A';
        if (mood >= 2.5) return '#FFC107';
        if (mood >= 1.5) return '#FF9800';
        return '#F44336';
    };

    return (
        <div className="mood-line-chart">
            <svg width={width} height={height} className="chart-svg">
                {/* Grid lines */}
                {generateGridLines()}

                {/* Line path */}
                <path
                    d={generatePath()}
                    className="line-path"
                    stroke="#2196F3"
                    strokeWidth="3"
                    fill="none"
                />

                {/* Data points */}
                {generateDataPoints()}

                {/* Axis labels */}
                {generateAxisLabels()}

                {/* Y-axis */}
                <line
                    x1={margin.left}
                    y1={margin.top}
                    x2={margin.left}
                    y2={margin.top + chartHeight}
                    className="axis-line"
                />

                {/* X-axis */}
                <line
                    x1={margin.left}
                    y1={margin.top + chartHeight}
                    x2={margin.left + chartWidth}
                    y2={margin.top + chartHeight}
                    className="axis-line"
                />
            </svg>

            {/* Legend */}
            <div className="chart-legend">
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
                    <span>Puiki nuotaika (4-5)</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#8BC34A' }}></span>
                    <span>Gera nuotaika (3-4)</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#FFC107' }}></span>
                    <span>Vidutinė nuotaika (2-3)</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#FF9800' }}></span>
                    <span>Bloga nuotaika (1-2)</span>
                </div>
            </div>
        </div>
    );
}; 