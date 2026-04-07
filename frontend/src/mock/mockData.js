export const mockData = {
    // ✅ Matches backend structure (dataset-summary)
    stats: {
        totalDataPoints: 1200,
        positiveSentiment: 65,
        neutralSentiment: 20,   // ✅ added (backend has this)
        negativeSentiment: 15,
        activeTopics: 8,
    },

    // ✅ Matches trend-insights response
    sentimentDistribution: [
        { label: 'Positive', value: 65, color: '#10B981' },
        { label: 'Neutral', value: 20, color: '#6B7280' },
        { label: 'Negative', value: 15, color: '#EF4444' },
    ],

    // ✅ UI-only (keep as is)
    sentimentTrend: [
        { date: '2024-01-01', score: 65 },
        { date: '2024-01-02', score: 68 },
        { date: '2024-01-03', score: 62 },
        { date: '2024-01-04', score: 70 },
        { date: '2024-01-05', score: 75 },
        { date: '2024-01-06', score: 72 },
        { date: '2024-01-07', score: 78 },
        { date: '2024-01-08', score: 80 },
        { date: '2024-01-09', score: 75 },
        { date: '2024-01-10', score: 82 },
        { date: '2024-01-11', score: 85 },
        { date: '2024-01-12', score: 79 },
        { date: '2024-01-13', score: 88 },
        { date: '2024-01-14', score: 92 },
    ],

    sectorSentiment: [
        { sector: 'Technology', score: 85, vol: 12 },
        { sector: 'Finance', score: 45, vol: 24 },
        { sector: 'Healthcare', score: 65, vol: 8 },
        { sector: 'Consumer', score: 72, vol: 15 },
        { sector: 'Energy', score: 30, vol: 35 },
    ],

    liveSignals: [
        { id: 1, type: 'surge', sector: 'Tech', msg: 'Sudden surge in AI-related discussions', intensity: 'high', time: 'Just now' },
        { id: 2, type: 'dip', sector: 'Finance', msg: 'Sentiment dip after negative earnings report', intensity: 'medium', time: '5m ago' },
        { id: 3, type: 'neutral', sector: 'Health', msg: 'Stable sentiment across healthcare sector', intensity: 'low', time: '10m ago' },
        { id: 4, type: 'surge', sector: 'Energy', msg: 'Renewable energy discussions rising', intensity: 'medium', time: '20m ago' },
    ],

    // ✅ Matches backend topic format (name + frequency)
    topics: [
        { name: 'Battery', frequency: 150, trend: 'up' },
        { name: 'Camera', frequency: 120, trend: 'up' },
        { name: 'Performance', frequency: 90, trend: 'stable' },
        { name: 'Price', frequency: 70, trend: 'down' },
        { name: 'Design', frequency: 60, trend: 'up' },
    ],

    alerts: [
        { id: 1, type: 'warning', message: 'Drop in sentiment detected for battery performance.', time: '2h ago' },
        { id: 2, type: 'info', message: 'New trending topic: Camera improvements', time: '5h ago' },
        { id: 3, type: 'success', message: 'Dataset processed successfully.', time: '1d ago' },
    ],

    productSentiment: [
        { product: 'iPhone 15', positive: 75, negative: 10 },
        { product: 'iPhone 14', positive: 60, negative: 20 },
        { product: 'iPhone 13', positive: 50, negative: 30 },
        { product: 'iPhone SE', positive: 65, negative: 15 },
    ],

    ragResponse: "The sentiment analysis indicates a generally positive perception of iPhones, especially for camera and performance. However, concerns around battery life and pricing are emerging. Topic modeling highlights key areas like battery, camera, and design influencing user opinions."
};