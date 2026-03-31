import React, { useState, useEffect } from 'react';
import Filters from '../components/dashboard/Filters';
import SentimentChart from '../components/dashboard/SentimentChart';
import TrendChart from '../components/dashboard/TrendChart';
import { getProductReviews } from '../services/api';
import { Loader2 } from 'lucide-react';

const Sentiment = () => {
    const [selectedProduct, setSelectedProduct] = useState('iPhone 14');
    const [selectedSource, setSelectedSource] = useState('Amazon');
    const [selectedDateRange, setSelectedDateRange] = useState('30');
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // New Toggle State explicitly requested by the user
    const [viewMode, setViewMode] = useState('percentage'); // 'percentage' | 'count'

    useEffect(() => {
        const fetchSentiment = async () => {
            setLoading(true);
            try {
                const res = await getProductReviews(selectedProduct, selectedSource, selectedDateRange);
                setData(res);
            } catch (error) {
                console.error("Failed to load sentiment", error);
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchSentiment();
    }, [selectedProduct, selectedSource, selectedDateRange]);

    return (
        <div className="animate-in fade-in duration-500">
            <Filters 
                product={selectedProduct} setProduct={setSelectedProduct}
                source={selectedSource} setSource={setSelectedSource}
                days={selectedDateRange} setDays={setSelectedDateRange}
            />

            <main className="mt-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary tracking-tight">Sentiment Distribution & Velocity</h2>
                        <p className="text-text-secondary mt-1">Deep dive into <span className="text-accent-primary font-bold">{selectedProduct}</span> consumer perception on {selectedSource}.</p>
                    </div>
                    
                    <div className="flex items-center space-x-1 bg-bg-secondary p-1 rounded-xl border border-border-dark self-start">
                        <button 
                            onClick={() => setViewMode('percentage')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'percentage' ? 'bg-accent-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Percentage View
                        </button>
                        <button 
                            onClick={() => setViewMode('count')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'count' ? 'bg-accent-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Count View
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                        <Loader2 className="w-12 h-12 text-accent-primary animate-spin" />
                        <p className="text-text-secondary font-medium tracking-wide animate-pulse uppercase text-sm">Aggregating Sentiment Intelligence...</p>
                    </div>
                ) : !data ? (
                     <div className="flex flex-col items-center justify-center min-h-[400px]">
                         <span className="text-sentiment-negative font-bold">Failed to load data</span>
                     </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
                             <SentimentChart data={data.distribution} viewMode={viewMode} />
                             <TrendChart data={data.trend} />
                        </div>
                        
                        {/* New Dedicated Insight Block Below Charts */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-bg-secondary/80 to-bg-primary border border-border-dark shadow-xl backdrop-blur-sm">
                            <h4 className="text-sm font-bold text-accent-secondary uppercase tracking-widest mb-2 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-accent-secondary mr-2"></span>
                                Semantic Narrative
                            </h4>
                            <p className="text-text-primary font-medium text-lg leading-relaxed max-w-4xl">
                                Positive sentiment peaked during structural updates around {selectedProduct}, while negative spikes are primarily linked to localized friction points and reported bugs. {data.insightSummary}
                            </p>
                        </div>

                        {/* Visual breakdown metrics */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-bg-secondary p-6 rounded-2xl border border-sentiment-positive/20 relative group hover:border-sentiment-positive/50 transition-colors">
                                <h4 className="text-xl font-bold text-text-primary uppercase tracking-widest text-[11px] mb-2">Positive Catalyst</h4>
                                <h2 className="text-3xl font-black text-sentiment-positive">{viewMode === 'count' ? data.kpi.posCount : `${data.kpi.positive}%`}</h2>
                                <p className="text-sm text-text-secondary mt-1 font-semibold">Satisfaction Output</p>
                            </div>
                            <div className="bg-bg-secondary p-6 rounded-2xl border border-sentiment-negative/20 relative group hover:border-sentiment-negative/50 transition-colors">
                                <h4 className="text-xl font-bold text-text-primary uppercase tracking-widest text-[11px] mb-2">Negative Friction</h4>
                                <h2 className="text-3xl font-black text-sentiment-negative">{viewMode === 'count' ? data.kpi.negCount : `${data.kpi.negative}%`}</h2>
                                <p className="text-sm text-text-secondary mt-1 font-semibold">Friction Instances</p>
                            </div>
                            <div className="bg-bg-secondary p-6 rounded-2xl border border-sentiment-neutral/20 relative group hover:border-sentiment-neutral/50 transition-colors">
                                <h4 className="text-xl font-bold text-text-primary uppercase tracking-widest text-[11px] mb-2">Neutral Ambivalence</h4>
                                <h2 className="text-3xl font-black text-sentiment-neutral">{viewMode === 'count' ? data.kpi.neuCount : `${data.kpi.neutral}%`}</h2>
                                <p className="text-sm text-text-secondary mt-1 font-semibold">Ambivalent Engagement</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Sentiment;
