import React, { useState } from 'react';
import { MessageSquare, Calendar, Store, Filter } from 'lucide-react';

// Advanced highlighting utility function
const HighlightText = ({ text }) => {
    // Keywords from the mock topics and generated arrays
    const keywords = ['battery', 'camera', 'heating', 'price', 'display', 'bugs', 'design', 'update', 'features'];
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    
    const parts = text.split(regex);
    
    return (
        <span>
            {parts.map((part, i) => 
                keywords.includes(part.toLowerCase()) ? (
                    <span key={i} className="text-accent-primary font-bold bg-accent-primary/10 px-1 rounded">
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

const ReviewList = ({ reviews }) => {
    const [filter, setFilter] = useState('All'); // 'All', 'positive', 'negative', 'neutral'

    const filteredReviews = reviews ? (filter === 'All' ? reviews : reviews.filter(r => r.sentiment === filter)) : [];

    return (
        <div className="card p-6 border border-border-dark shadow-xl hover:border-accent-primary/20 transition-all bg-bg-secondary/40 backdrop-blur-sm h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">Live Review Feed</h3>
                    <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold">Real-world Consumer Voices</p>
                </div>
                <div className="flex items-center space-x-2 mt-4 md:mt-0 bg-bg-primary p-1 rounded-xl border border-border-dark">
                    <Filter className="w-4 h-4 text-text-secondary ml-2" />
                    {['All', 'positive', 'negative', 'neutral'].map(tag => (
                        <button
                            key={tag}
                            onClick={() => setFilter(tag)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${filter === tag ? 'bg-accent-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar" style={{ maxHeight: '420px' }}>
                {!filteredReviews || filteredReviews.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary space-y-3 opacity-60">
                        <MessageSquare className="w-10 h-10 mb-2" />
                        <p className="font-semibold text-lg">No {filter !== 'All' ? filter : ''} reviews found.</p>
                        <p className="text-sm">Try adjusting your filters or date range.</p>
                    </div>
                ) : (
                    filteredReviews.map((review, idx) => {
                        const isPositive = review.sentiment === 'positive';
                        const isNegative = review.sentiment === 'negative';
                        
                        const badgeClass = isPositive ? 'bg-sentiment-positive/10 text-sentiment-positive border border-sentiment-positive/30' 
                                        : isNegative ? 'bg-sentiment-negative/10 text-sentiment-negative border border-sentiment-negative/30' 
                                        : 'bg-sentiment-neutral/10 text-sentiment-neutral border border-sentiment-neutral/30';

                        return (
                            <div key={review.id || idx} className="p-5 bg-bg-primary rounded-xl border border-border-dark flex flex-col hover:border-accent-primary/50 transition-colors group relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-white/5 to-transparent rounded-bl-xl group-hover:from-accent-primary/10 transition-colors"></div>
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full ${badgeClass}`}>
                                        {review.sentiment}
                                    </span>
                                    <div className="flex space-x-3 text-xs text-text-secondary font-medium">
                                        <span className="flex items-center">
                                            <Store className="w-3.5 h-3.5 mr-1 text-accent-secondary" />
                                            {review.source}
                                        </span>
                                        <span className="flex items-center">
                                            <Calendar className="w-3.5 h-3.5 mr-1" />
                                            {review.date}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start mt-2">
                                    <MessageSquare className="w-4 h-4 text-accent-secondary mt-1 mr-3 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-sm font-medium text-text-primary leading-relaxed">
                                        "<HighlightText text={review.snippet} />"
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ReviewList;
