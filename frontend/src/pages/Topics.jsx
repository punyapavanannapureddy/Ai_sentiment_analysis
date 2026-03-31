import React, { useState, useEffect } from 'react';
import Filters from '../components/dashboard/Filters';
import TopicCards from '../components/dashboard/TopicCards';
import ReviewList from '../components/dashboard/ReviewList';
import { getProductReviews } from '../services/api';
import { Loader2 } from 'lucide-react';

const Topics = () => {
    const [selectedProduct, setSelectedProduct] = useState('iPhone 14');
    const [selectedSource, setSelectedSource] = useState('Amazon');
    const [selectedDateRange, setSelectedDateRange] = useState('30');
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopics = async () => {
            setLoading(true);
            try {
                const res = await getProductReviews(selectedProduct, selectedSource, selectedDateRange);
                setData(res);
            } catch (error) {
                console.error("Failed to load topics", error);
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchTopics();
    }, [selectedProduct, selectedSource, selectedDateRange]);

    return (
        <div className="animate-in fade-in duration-500">
            <Filters 
                product={selectedProduct} setProduct={setSelectedProduct}
                source={selectedSource} setSource={setSelectedSource}
                days={selectedDateRange} setDays={setSelectedDateRange}
            />

            <main className="mt-8">
                 <div className="mb-8">
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">Extracted Topic Insights</h2>
                    <p className="text-text-secondary mt-1">AI-driven semantic cluster analysis for <span className="text-accent-primary font-bold">{selectedProduct}</span> reviews on {selectedSource}.</p>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                        <Loader2 className="w-12 h-12 text-accent-primary animate-spin" />
                        <p className="text-text-secondary font-medium tracking-wide animate-pulse uppercase text-sm">Aggregating Semantic Clusters...</p>
                    </div>
                ) : !data ? (
                     <div className="flex flex-col items-center justify-center min-h-[400px]">
                         <span className="text-sentiment-negative font-bold">Failed to load data</span>
                     </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-12">
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-bg-secondary/80 to-bg-primary border border-border-dark shadow-xl backdrop-blur-sm">
                                    <h4 className="text-sm font-bold text-accent-secondary uppercase tracking-widest mb-2 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-accent-secondary mr-2"></span>
                                        Cluster Driver Analysis
                                    </h4>
                                    <p className="text-text-primary font-medium text-lg leading-relaxed max-w-4xl">
                                        Battery and camera features are continuously driving positive engagement, while isolated heating reports and software bugs contribute directly to the negative sentiment ratios. {data.insightSummary}
                                    </p>
                                </div>
                            </div>
                            <div className="lg:col-span-5 h-[650px]">
                                 <TopicCards topics={data.topics} />
                            </div>
                            <div className="lg:col-span-7 h-[650px]">
                                 <ReviewList reviews={data.reviews} />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Topics;
