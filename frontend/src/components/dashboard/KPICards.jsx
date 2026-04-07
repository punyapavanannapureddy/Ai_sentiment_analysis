import React from 'react';
import { Target, Smile, Frown, Meh, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const KPICards = ({ kpi }) => {
    if (!kpi) return null;

    const cards = [
        {
            title: 'Total Reviews',
            value: kpi.totalReviews.toLocaleString(),
            trend: `${kpi.totalTrend > 0 ? '+' : ''}${kpi.totalTrend}%`,
            trendUp: kpi.totalTrend > 0,
            icon: Target,
            color: 'text-accent-primary',
            bg: 'bg-accent-primary/10',
            border: 'border-accent-primary/20',
            subtext: 'from last period'
        },
        {
            title: 'Positive Sentiment',
            value: `${kpi.positive}%`,
            count: `(${kpi.posCount.toLocaleString()} reviews)`,
            trend: `${kpi.trendPositive > 0 ? '+' : ''}${kpi.trendPositive}%`,
            trendUp: kpi.trendPositive > 0,
            icon: Smile,
            color: 'text-sentiment-positive',
            bg: 'bg-sentiment-positive/10',
            border: 'border-sentiment-positive/20',
            subtext: 'from last period'
        },
        {
            title: 'Negative Sentiment',
            value: `${kpi.negative}%`,
            count: `(${kpi.negCount.toLocaleString()} reviews)`,
            trend: `${kpi.trendNegative > 0 ? '+' : ''}${kpi.trendNegative}%`,
            trendUp: kpi.trendNegative < 0, // Less negative is good, so "Up/Green" if negative trend
            icon: Frown,
            color: 'text-sentiment-negative',
            bg: 'bg-sentiment-negative/10',
            border: 'border-sentiment-negative/20',
            subtext: 'from last period'
        },
        {
            title: 'Neutral Sentiment',
            value: `${kpi.neutral}%`,
            count: `(${kpi.neuCount.toLocaleString()} reviews)`,
            trend: `${kpi.trendNeutral > 0 ? '+' : ''}${kpi.trendNeutral}%`,
            trendUp: kpi.trendNeutral > 0,
            icon: Meh,
            color: 'text-sentiment-neutral',
            bg: 'bg-sentiment-neutral/10',
            border: 'border-sentiment-neutral/20',
            subtext: 'from last period'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-8">
            {cards.map((card, index) => (
                <motion.div 
                    key={index}
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`card p-6 border ${card.border} shadow-xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow bg-bg-secondary/40 backdrop-blur-sm relative overflow-hidden group`}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest">{card.title}</h3>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                    </div>
                    
                    <div className="flex items-end space-x-2">
                        <h2 className={`text-4xl font-black ${card.color}`}>{card.value}</h2>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                        {card.count && (
                            <span className="text-sm font-semibold text-text-secondary">{card.count}</span>
                        )}
                        {!card.count && <span></span>} {/* Spacing buffer if no count */}
                        
                        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${card.trendUp ? 'bg-sentiment-positive/10 text-sentiment-positive' : 'bg-sentiment-negative/10 text-sentiment-negative'}`}>
                            {card.trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {card.trend}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default KPICards;
