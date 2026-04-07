import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const TrendChart = ({ data }) => {
    if (!data || data.length === 0) return (
         <div className="h-64 flex items-center justify-center text-text-secondary">No data available</div>
    );

    return (
        <div className="card p-6 border border-border-dark shadow-xl hover:border-accent-primary/20 transition-all bg-bg-secondary/40 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-secondary/5 rounded-full blur-3xl group-hover:bg-accent-secondary/10 transition-colors"></div>
            <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center">
                Sentiment Trend Velocity
            </h3>
            <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold mb-6">Historical Tracking</p>
            <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            stroke="#94A3B8" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            stroke="#94A3B8" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            dx={-10}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0F172A', borderColor: '#4F46E5', borderRadius: '12px' }}
                            itemStyle={{ fontWeight: 'bold' }}
                            labelStyle={{ color: '#94A3B8', marginBottom: '8px' }}
                        />
                        <Legend 
                            verticalAlign="top" 
                            height={36} 
                            iconType="circle"
                            formatter={(value) => <span className="text-text-primary text-sm font-semibold capitalize">{value}</span>}
                        />
                        <Line type="monotone" dataKey="positive" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="negative" stroke="#EF4444" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="neutral" stroke="#F59E0B" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrendChart;
