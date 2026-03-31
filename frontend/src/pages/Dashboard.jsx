import React, { useState, useEffect } from 'react';
import Filters from '../components/dashboard/Filters';
import KPICards from '../components/dashboard/KPICards';
import SentimentChart from '../components/dashboard/SentimentChart';
import TrendChart from '../components/dashboard/TrendChart';
import TopicCards from '../components/dashboard/TopicCards';
import ReviewList from '../components/dashboard/ReviewList';
import DownloadButtons from '../components/dashboard/DownloadButtons';
import { getProductReviews } from '../services/api';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
    const [selectedProduct, setSelectedProduct] = useState('iPhone 14');
    const [selectedSource, setSelectedSource] = useState('Amazon');
    const [selectedDateRange, setSelectedDateRange] = useState('30');
    
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const data = await getProductReviews(selectedProduct, selectedSource, selectedDateRange);
                setDashboardData(data);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                setDashboardData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedProduct, selectedSource, selectedDateRange]);

    return (
        <div className="animate-in fade-in duration-500">
            <Filters 
                product={selectedProduct} setProduct={setSelectedProduct}
                source={selectedSource} setSource={setSelectedSource}
                days={selectedDateRange} setDays={setSelectedDateRange}
            />

            <main className="mt-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
                        <Loader2 className="w-12 h-12 text-accent-primary animate-spin" />
                        <p className="text-text-secondary font-medium tracking-wide animate-pulse uppercase text-sm">Aggregating Sentiment Intelligence...</p>
                    </div>
                ) : !dashboardData ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
                        <div className="text-sentiment-negative p-4 bg-sentiment-negative/10 rounded-full">
                            <span className="font-bold">No Data Points Discovered</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 pt-6 animate-in fade-in duration-700">
                        {/* Dynamic Header & Insight Summary */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-text-primary tracking-tight mb-2">
                                {selectedProduct} Sentiment Analysis <span className="text-text-secondary font-medium">({selectedSource} • Last {selectedDateRange === '7' ? '7' : selectedDateRange === '30' ? '30' : '90'} Days)</span>
                            </h2>
                            <div className="p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-secondary font-medium text-sm">
                                {dashboardData.insightSummary}
                            </div>
                        </div>

                        {/* KPI Metrics First */}
                        <KPICards kpi={dashboardData.kpi} />

                        {/* Top Core Visuals */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-4 h-[420px]">
                                <SentimentChart data={dashboardData.distribution} />
                            </div>
                            <div className="lg:col-span-8 h-[420px]">
                                <TrendChart data={dashboardData.trend} />
                            </div>
                        </div>

                        {/* Secondary Insights & Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
                            <div className="lg:col-span-3 h-[500px]">
                                <DownloadButtons 
                                    product={selectedProduct} 
                                    source={selectedSource} 
                                    dateRange={selectedDateRange} 
                                />
                            </div>
                            <div className="lg:col-span-4 h-[500px]">
                                <TopicCards topics={dashboardData.topics} />
                            </div>
                            <div className="lg:col-span-5 h-[500px]">
                                <ReviewList reviews={dashboardData.reviews} />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
