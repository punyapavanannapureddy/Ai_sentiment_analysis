import React from 'react';
import Plot from 'react-plotly.js';

const SentimentPieChart = ({ data }) => {
    const chartData = [{
        values: data.map(d => d.value),
        labels: data.map(d => d.label),
        type: 'pie',
        hole: .5,
        marker: {
            colors: data.map(d => d.color),
            line: {
                color: '#1e293b', // Match border-dark
                width: 2
            }
        },
        textinfo: 'label+percent',
        hoverinfo: 'label+value',
        automargin: true,
        textfont: {
            color: '#ffffff'
        }
    }];

    const layout = {
        height: 300,
        margin: { t: 20, b: 20, l: 20, r: 20 },
        showlegend: true,
        legend: { orientation: 'h', x: 0.5, xanchor: 'center', font: { color: '#94a3b8' } },
        font: { family: 'Inter, sans-serif', color: '#f8fafc' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
    };

    return (
        <div className="w-full h-full flex items-center justify-center">
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

export default SentimentPieChart;
