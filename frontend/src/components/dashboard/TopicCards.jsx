import React from 'react';
import { motion } from 'framer-motion';

const TopicCards = ({ topics }) => {
    if (!topics || topics.length === 0) return null;

    // Sort to highlight the most mentioned topics easily
    const sortedTopics = [...topics].sort((a,b) => b.frequency - a.frequency);

    return (
        <div className="card p-6 border border-border-dark shadow-xl hover:border-accent-primary/20 transition-all bg-bg-secondary/40 backdrop-blur-sm min-h-full">
            <h3 className="text-xl font-bold text-text-primary mb-2">Topic Intelligence</h3>
            <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold mb-6">Subject Highlight Combinities</p>
            
            <div className="flex flex-wrap gap-3">
                {sortedTopics.map((topic, index) => {
                    const isPositive = topic.sentiment === 'positive';
                    const isNegative = topic.sentiment === 'negative';
                    
                    const bgClass = isPositive ? 'bg-sentiment-positive/10 border-sentiment-positive/30' 
                                  : isNegative ? 'bg-sentiment-negative/10 border-sentiment-negative/30' 
                                  : 'bg-sentiment-neutral/10 border-sentiment-neutral/30';
                    
                    const textClass = isPositive ? 'text-sentiment-positive' 
                                    : isNegative ? 'text-sentiment-negative' 
                                    : 'text-sentiment-neutral';

                    return (
                        <motion.div 
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            className={`px-4 py-2 rounded-xl border flex items-center space-x-3 cursor-default transition-shadow hover:shadow-lg ${bgClass}`}
                        >
                            <span className="font-bold text-text-primary text-sm">{topic.name}</span>
                            <span className={`text-xs font-black bg-bg-primary px-2 py-1 rounded-md ${textClass}`}>
                                {topic.frequency} <span className="opacity-80 font-medium">({topic.score}% {topic.sentiment.charAt(0).toUpperCase() + topic.sentiment.slice(1)})</span>
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default TopicCards;
