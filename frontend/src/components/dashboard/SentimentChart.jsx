import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SentimentChart = ({ data, viewMode = 'percentage' }) => {
    if (!data || data.length === 0) return (
        <div className="h-64 flex items-center justify-center text-text-secondary">No data available</div>
    );

    const dataKey = viewMode === 'count' ? 'count' : 'value';

    return (
        <div className="card p-6 h-full border border-border-dark shadow-xl hover:border-accent-primary/20 transition-all bg-bg-secondary/40 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-3xl group-hover:bg-accent-primary/10 transition-colors"></div>
            <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center">
                Sentiment Distribution
            </h3>
            <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold mb-6">Proportional Insights</p>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey={dataKey}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={
                                    entry.name === 'Positive' ? '#10B981' :
                                        entry.name === 'Negative' ? '#EF4444' : '#F59E0B'
                                } />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px' }}
                            itemStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                            formatter={(value, name, props) => {
                                if (viewMode === 'count') {
                                    return [`${value.toLocaleString()} reviews (${props.payload.value}%)`, name];
                                }
                                return [`${value}% (${props.payload.count.toLocaleString()})`, name];
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-text-primary text-sm font-semibold">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SentimentChart;
