import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Send,
    Bot,
    Sparkles,
    Copy,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    Database
} from 'lucide-react';
import * as api from '../services/api';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const RAG = () => {
    const location = useLocation();
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('chat_history')
                .select('query, response')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });
                
            if (!error && data) {
                setHistory(data);
            }
        };
        fetchHistory();
    }, [user]);

    const handleAskAI = async (e, customQuery) => {
        if (e) e.preventDefault();
        const finalQuery = customQuery || query;
        if (!finalQuery.trim()) return;

        setQuery('');
        setLoading(true);
        setHistory(prev => [...prev, { query: finalQuery, response: null }]);

        try {
            const res = await api.getRAGResponse(finalQuery);
            setResponse(res.response);
            setHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1].response = res.response;
                return updated;
            });

            if (user) {
                await supabase.from('chat_history').insert([
                    { user_id: user.id, query: finalQuery, response: res.response }
                ]);
            }
        } catch (error) {
            console.error("Error asking AI", error);
            setHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1].response = "Error connecting to backend.";
                return updated;
            });
        } finally {
            setLoading(false);
        }
    };

    // Auto-trigger if query is passed in state
    useEffect(() => {
        if (location.state?.query) {
            handleAskAI(null, location.state.query);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-8 h-full">
            <div className="text-center space-y-2 hidden">
                <h2 className="text-3xl font-bold text-text-primary">Insights Assistant</h2>
                <p className="text-text-secondary">Ask any question about your market data and get AI-powered answers.</p>
            </div>

            <div className="min-h-[75vh] flex flex-col shadow-2xl border border-border-dark bg-bg-primary overflow-hidden rounded-2xl">
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {!response && history.length === 0 && (
                        <div className="flex flex-col h-full space-y-8">
                            <div className="flex flex-col items-center justify-center text-center space-y-4 opacity-80 mt-4">
                                <div className="w-16 h-16 bg-accent-primary/10 rounded-3xl flex items-center justify-center text-accent-primary transform -rotate-6">
                                    <Bot className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-text-primary tracking-tight">Intelligence Engine Ready</h3>
                            </div>
                            
                            {/* Placeholder Response UI */}
                            <div className="max-w-3xl mx-auto w-full">
                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest text-center mb-4">Example Analysis</p>
                                <div className="flex items-start space-x-4 opacity-50 hover:opacity-100 transition-opacity duration-500">
                                    <div className="w-10 h-10 bg-accent-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-accent-secondary/30 shadow-sm relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-accent-secondary/20 to-transparent"></div>
                                        <Bot className="w-5 h-5 text-accent-secondary relative z-10" />
                                    </div>
                                    <div className="bg-gradient-to-b from-bg-secondary to-bg-primary/90 border border-border-dark/80 rounded-2xl rounded-tl-none px-6 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-text-primary relative w-full backdrop-blur-md">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Sparkles className="w-3.5 h-3.5 text-accent-secondary animate-pulse" />
                                            <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-secondary to-blue-400 uppercase tracking-widest">Assistant Preview</span>
                                        </div>
                                        <p className="text-sm leading-relaxed font-medium text-text-secondary">
                                            "Most negative sentiment is related to <span className="text-sentiment-negative font-bold">heating issues</span> and <span className="text-sentiment-negative font-bold">battery drain</span> during intensive tasks."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {history.map((chat, idx) => (
                        <div key={idx} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {/* User Question */}
                            <div className="flex justify-end">
                                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl rounded-tr-none px-6 py-4 max-w-[80%] shadow-lg shadow-[0_4px_20px_rgba(99,102,241,0.3)] border border-white/10">
                                    <p className="text-sm font-medium">{chat.query}</p>
                                </div>
                            </div>
                            {/* AI Answer */}
                            {chat.response && (
                            <div className="flex justify-start">
                                <div className="flex items-start space-x-4 max-w-[90%]">
                                    <div className="w-10 h-10 bg-accent-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-accent-secondary/30 shadow-sm relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-accent-secondary/20 to-transparent"></div>
                                        <Bot className="w-6 h-6 text-accent-secondary relative z-10" />
                                    </div>
                                    <div className="bg-gradient-to-b from-bg-secondary to-bg-primary/90 border border-border-dark/80 rounded-3xl rounded-tl-none px-6 py-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-text-primary relative group backdrop-blur-md">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <Sparkles className="w-4 h-4 text-accent-secondary animate-pulse" />
                                            <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-secondary to-blue-400 uppercase tracking-widest">Context-Aware Intelligence</span>
                                        </div>
                                        <p className="text-sm leading-relaxed whitespace-pre-line font-medium text-text-secondary group-hover:text-text-primary transition-colors">{chat.response}</p>
                                        <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-border-dark/60 uppercase text-[10px] font-bold text-text-secondary tracking-wider">
                                            <button className="hover:text-white flex items-center transition-colors">
                                                <Copy className="w-3.5 h-3.5 mr-1.5 hover:scale-110 transition-transform" /> Copy
                                            </button>
                                            <button className="hover:text-sentiment-positive flex items-center transition-colors">
                                                <ThumbsUp className="w-3.5 h-3.5 mr-1.5 hover:scale-110 transition-transform" /> Helpful
                                            </button>
                                            <button className="hover:text-sentiment-negative flex items-center transition-colors">
                                                <ThumbsDown className="w-3.5 h-3.5 mr-1.5 hover:scale-110 transition-transform" /> Not Helpful
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 bg-accent-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0 ">
                                    <Bot className="w-6 h-6 text-accent-secondary" />
                                </div>
                                <div className="bg-bg-secondary border border-border-dark rounded-3xl rounded-tl-none px-8 py-5 shadow-sm flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-border-dark/80 bg-gradient-to-b from-bg-secondary/50 to-bg-secondary rounded-b-2xl">
                    <form onSubmit={handleAskAI} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-accent-primary to-blue-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about market shifts or topic resonance..."
                            className="relative w-full pl-8 pr-16 py-5 bg-bg-primary/80 backdrop-blur-xl border border-border-dark rounded-2xl focus:outline-none focus:border-accent-primary/50 shadow-inner transition-all text-sm font-medium text-text-primary placeholder-text-secondary/70"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-accent-primary to-indigo-600 text-white rounded-xl flex items-center justify-center hover:from-indigo-500 hover:to-blue-500 hover:scale-[1.05] transition-all active:scale-95 shadow-lg shadow-indigo-500/30 disabled:from-border-dark disabled:to-border-dark disabled:shadow-none disabled:text-text-secondary"
                        >
                            <Send className="w-5 h-5 ml-1" />
                        </button>
                    </form>
                    <div className="mt-4 flex items-center justify-center space-x-8">
                        <div className="text-[10px] font-bold text-text-secondary flex items-center uppercase tracking-widest">
                            <RefreshCw className="w-3.5 h-3.5 mr-2 text-accent-primary" /> 1,240 tokens remaining
                        </div>
                        <div className="text-[10px] font-bold text-text-secondary flex items-center uppercase tracking-widest">
                            <Database className="w-3.5 h-3.5 mr-2 text-accent-secondary" /> Data Source: Q1 Index
                        </div>
                    </div>
                </div>
            </div>

            {/* Suggested Questions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                    onClick={() => handleAskAI(null, "Why are users complaining about iPhone 14?")}
                    className="text-left p-6 bg-bg-secondary border border-border-dark rounded-2xl hover:border-accent-primary/40 hover:bg-bg-primary transition-all group relative overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-accent-primary mb-3 uppercase tracking-widest opacity-80 transition-opacity">Deep Dive</p>
                        <p className="text-sm font-bold text-text-primary leading-snug group-hover:text-accent-secondary transition-colors">Why are users complaining about iPhone 14?</p>
                    </div>
                </button>
                <button
                    onClick={() => handleAskAI(null, "What are trending topics?")}
                    className="text-left p-6 bg-bg-secondary border border-border-dark rounded-2xl hover:border-accent-primary/40 hover:bg-bg-primary transition-all group relative overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-accent-secondary mb-3 uppercase tracking-widest opacity-80 transition-opacity">Identify Clusters</p>
                        <p className="text-sm font-bold text-text-primary leading-snug group-hover:text-accent-secondary transition-colors">What are trending topics?</p>
                    </div>
                </button>
                <button
                    onClick={() => handleAskAI(null, "What drives negative sentiment?")}
                    className="text-left p-6 bg-bg-secondary border border-border-dark rounded-2xl hover:border-accent-primary/40 hover:bg-bg-primary transition-all group relative overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-sentiment-negative mb-3 uppercase tracking-widest opacity-80 transition-opacity">Root Cause Analysis</p>
                        <p className="text-sm font-bold text-text-primary leading-snug group-hover:text-sentiment-negative transition-colors">What drives negative sentiment?</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default RAG;
