import axios from 'axios';
import { mockData } from '../mock/mockData';

// ✅ Use ENV if available, else fallback
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // ✅ Increased timeout (important for ML APIs)
    headers: {
        'ngrok-skip-browser-warning': 'true'
    }
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// NEW: Product Sentiment Analytics Endpoints
// ==========================================

const generateMockSentimentData = (product, source, days) => {
    const numDays = days === '7' ? 7 : (days === '30' ? 30 : 90);

    const totalReviews = Math.floor(Math.random() * 5000) + 1000;
    const previousTotal = Math.floor(totalReviews * (0.8 + Math.random() * 0.4));
    const totalTrend = (((totalReviews - previousTotal) / previousTotal) * 100).toFixed(1);

    const pos = Math.floor(Math.random() * 40) + 40;
    const neg = Math.floor(Math.random() * 20) + 5;
    const neu = 100 - pos - neg;

    const posCount = Math.floor(totalReviews * (pos / 100));
    const negCount = Math.floor(totalReviews * (neg / 100));
    const neuCount = totalReviews - posCount - negCount;

    const trendPositive = (Math.random() * 10 - 2).toFixed(1);
    const trendNegative = (Math.random() * 10 - 5).toFixed(1);
    const trendNeutral = (Math.random() * 6 - 3).toFixed(1);

    const trend = [];
    const now = new Date();

    for (let i = numDays; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        trend.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            positive: Math.floor(Math.random() * 100) + 50,
            negative: Math.floor(Math.random() * 40) + 10,
            neutral: Math.floor(Math.random() * 30) + 10
        });
    }

    const topics = [
        { name: 'Battery Life', frequency: Math.floor(Math.random() * 500) + 100, sentiment: 'positive', score: Math.floor(Math.random() * 20) + 70 },
        { name: 'Camera Quality', frequency: Math.floor(Math.random() * 400) + 100, sentiment: 'positive', score: Math.floor(Math.random() * 20) + 70 },
        { name: 'Heating Issue', frequency: Math.floor(Math.random() * 300) + 50, sentiment: 'negative', score: Math.floor(Math.random() * 20) + 70 },
        { name: 'Price Value', frequency: Math.floor(Math.random() * 200) + 50, sentiment: 'neutral', score: Math.floor(Math.random() * 20) + 40 },
        { name: 'Display', frequency: Math.floor(Math.random() * 200) + 50, sentiment: 'positive', score: Math.floor(Math.random() * 20) + 70 },
        { name: 'Software Bugs', frequency: Math.floor(Math.random() * 150) + 30, sentiment: 'negative', score: Math.floor(Math.random() * 20) + 70 },
        { name: 'Design', frequency: Math.floor(Math.random() * 300) + 80, sentiment: 'positive', score: Math.floor(Math.random() * 20) + 70 }
    ];

    const primaryPositive = topics.filter(t => t.sentiment === 'positive').sort((a, b) => b.frequency - a.frequency)[0];
    const primaryNegative = topics.filter(t => t.sentiment === 'negative').sort((a, b) => b.frequency - a.frequency)[0];

    const insightSummary = `Customer sentiment is mostly ${pos > 50 ? 'positive' : 'mixed'}, driven significantly by ${primaryPositive ? primaryPositive.name.toLowerCase() : 'various features'}. Negative sentiment is primarily due to ${primaryNegative ? primaryNegative.name.toLowerCase() : 'minor bugs'}. Volume is ${totalTrend > 0 ? 'up' : 'down'} ${Math.abs(totalTrend)}% from the last period.`;

    const reviews = Array.from({ length: 20 }).map((_, i) => {
        const type = i % 4 === 0 ? 'negative' : i % 2 === 0 ? 'positive' : 'neutral';
        return {
            id: i,
            snippet: type === 'negative'
                ? `The ${product} from ${source} has severe heating issues during charging.`
                : type === 'positive'
                    ? `Absolutely love the new features on the ${product}, totally worth it.`
                    : `It's an okay phone. ${product} is decent but not a huge upgrade.`,
            sentiment: type,
            source: source,
            date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString()
        };
    });

    return {
        kpi: {
            totalReviews, totalTrend,
            positive: pos, posCount, trendPositive,
            negative: neg, negCount, trendNegative,
            neutral: neu, neuCount, trendNeutral
        },
        insightSummary,
        distribution: [
            { name: 'Positive', value: pos, count: posCount },
            { name: 'Negative', value: neg, count: negCount },
            { name: 'Neutral', value: neu, count: neuCount }
        ],
        trend,
        topics,
        reviews
    };
};

export const getProductReviews = async (product, source, days) => {
    try {
        // 🔥 skip API and use mock directly
        return generateMockSentimentData(product, source, days);
    } catch (error) {
        console.warn("API '/reviews' failed, falling back to mock data.", error.message);
        await delay(600);
        return generateMockSentimentData(product, source, days);
    }
};

export const downloadReviews = async (product, sentiment, source, dateRange) => {
    try {
        const response = await client.get('/download', {
            params: { product, sentiment, source, dateRange },
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${product}_${sentiment}_reviews.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        return true;

    } catch (error) {
        console.warn("API '/download' failed, simulating mock download.", error.message);
        await delay(1000);

        const mockCsv = `Review,Sentiment,Source,Date\nMock Review 1,${sentiment},${source},2026-01-01\nMock Review 2,${sentiment},${source},2026-01-02`;

        const blob = new Blob([mockCsv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `mock_${product}_${sentiment}_reviews.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        return true;
    }
};

// ==========================================
// REAL API INTEGRATION
// ==========================================

export const getStats = async () => {
    try {
        const res = await client.get('/dataset-summary');
        const data = res.data || {};

        return {
            totalDataPoints: data.dataset_size || 0,
            positiveSentiment: data.sentiment_distribution?.positive || 0,
            negativeSentiment: data.sentiment_distribution?.negative || 0,
            activeTopics: data.number_of_topics || 0
        };

    } catch (error) {
        console.warn("API failed, fallback to mock", error.message);
        return mockData.stats;
    }
};

export const getSentimentDistribution = async () => {
    try {
        const res = await client.get('/trend-insights');
        const data = res.data || {};

        return [
            { label: 'Positive', value: data.sentiment_distribution?.positive || 0, color: '#10B981' },
            { label: 'Neutral', value: data.sentiment_distribution?.neutral || 0, color: '#6B7280' },
            { label: 'Negative', value: data.sentiment_distribution?.negative || 0, color: '#EF4444' }
        ];

    } catch (error) {
        console.warn("API failed, fallback to mock", error.message);
        return mockData.sentimentDistribution;
    }
};

export const getSectorSentiment = async () => {
    await delay(500);
    return mockData.sectorSentiment;
};

export const getLiveSignals = async () => {
    await delay(300);
    return mockData.liveSignals;
};

export const getTopics = async () => {
    try {
        const res = await client.get('/trend-insights');
        const data = res.data || {};

        return (data.top_topics || []).map(t => ({
            name: t.topic,
            frequency: t.count,
            trend: 'stable'
        }));

    } catch (error) {
        console.warn("API failed, fallback to mock", error.message);
        return mockData.topics;
    }
};

export const getAlerts = async () => {
    await delay(500);
    return mockData.alerts;
};

export const getProductSentiment = async () => {
    await delay(500);
    return mockData.productSentiment;
};

export const getRAGResponse = async (query) => {
    await delay(1000);
    return { query, response: mockData.ragResponse };
};

export const predictSentiment = async (text) => {
    try {
        const res = await client.post('/predict', { text });
        return res.data;

    } catch (error) {
        console.error("Prediction API failed", error.message);
        return {
            sentiment: "Error",
            confidence: 0,
            topic: "Unknown"
        };
    }
};