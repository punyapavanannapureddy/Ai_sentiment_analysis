import React from 'react';
import Plot from 'react-plotly.js';

const SentimentTrendChart = ({ data }) => {
    const chartData = [{
        x: data.map(d => d.date),
        y: data.map(d => d.score),
        type: 'scatter',
        mode: 'lines+markers',
        fill: 'tozeroy',
        line: {
            shape: 'spline',
            color: '#6366f1',
            width: 3
        },
        marker: {
            size: 8,
            color: '#818cf8',
            line: {
                color: '#fff',
                width: 1
            }
        },
        fillcolor: 'rgba(99, 102, 241, 0.15)'
    }];

    const layout = {
        height: 350,
        margin: { t: 20, b: 40, l: 40, r: 20 },
        xaxis: {
            showgrid: false,
            tickfont: { color: '#94a3b8' }
        },
        yaxis: {
            gridcolor: '#1e293b',
            tickfont: { color: '#94a3b8' },
            range: [0, 100]
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Inter, sans-serif' },
        hovermode: 'x unified'
    };

    return (
        <div className="w-full h-full">
            <Plot
                data={chartData}
                layout={layout}
                useResizeHandler={true}
                className="w-full h-full"
                config={{ displayModeBar: false, responsive: true }}
            />
        </div>
    );
};

export default SentimentTrendChart;
