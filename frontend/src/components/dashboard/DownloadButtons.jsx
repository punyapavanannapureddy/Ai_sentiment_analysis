import React, { useState } from 'react';
import { Download, Loader2, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { downloadReviews } from '../../services/api';

const DownloadButtons = ({ product, source, dateRange }) => {
    const [downloading, setDownloading] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleDownload = async (sentiment) => {
        setDownloading(sentiment);
        setSuccess(null);
        try {
            await downloadReviews(product, sentiment, source, dateRange);
            setSuccess(sentiment);
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error("Export failed", error);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="card p-6 border border-border-dark shadow-xl hover:border-accent-primary/20 transition-all bg-bg-secondary/40 backdrop-blur-sm h-full flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none"></div>
            
            <div className="mb-6">
                <h3 className="text-xl font-bold text-text-primary mb-1 flex items-center">
                    <FileSpreadsheet className="w-5 h-5 mr-3 text-accent-primary" />
                    Data Extraction
                </h3>
                <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold">CSV Reporting Engine</p>
            </div>
            
            <div className="flex flex-col space-y-4">
                <button 
                    onClick={() => handleDownload('positive')}
                    disabled={downloading !== null}
                    className="w-full relative overflow-hidden flex justify-between items-center px-5 py-4 bg-[#111827] border border-sentiment-positive/30 hover:bg-sentiment-positive/10 text-sentiment-positive rounded-xl font-semibold transition-all group/btn disabled:opacity-50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:scale-[1.02]"
                >
                    <span className="text-sm tracking-wide z-10 flex items-center">
                        Positive Feed Extract
                    </span>
                    <div className="z-10">
                        {downloading === 'positive' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                         success === 'positive' ? <CheckCircle2 className="w-5 h-5 text-sentiment-positive" /> : 
                         <Download className="w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" />}
                    </div>
                </button>
                
                <button 
                    onClick={() => handleDownload('negative')}
                    disabled={downloading !== null}
                    className="w-full relative overflow-hidden flex justify-between items-center px-5 py-4 bg-[#111827] border border-sentiment-negative/30 hover:bg-sentiment-negative/10 text-sentiment-negative rounded-xl font-semibold transition-all group/btn disabled:opacity-50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:scale-[1.02]"
                >
                    <span className="text-sm tracking-wide z-10 flex items-center">
                        Negative Feed Extract
                    </span>
                    <div className="z-10">
                        {downloading === 'negative' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                         success === 'negative' ? <CheckCircle2 className="w-5 h-5 text-sentiment-negative" /> : 
                         <Download className="w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" />}
                    </div>
                </button>
                
                <button 
                    onClick={() => handleDownload('neutral')}
                    disabled={downloading !== null}
                    className="w-full relative overflow-hidden flex justify-between items-center px-5 py-4 bg-[#111827] border border-sentiment-neutral/30 hover:bg-sentiment-neutral/10 text-sentiment-neutral rounded-xl font-semibold transition-all group/btn disabled:opacity-50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:scale-[1.02]"
                >
                    <span className="text-sm tracking-wide z-10 flex items-center">
                        Neutral Feed Extract
                    </span>
                    <div className="z-10">
                        {downloading === 'neutral' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                         success === 'neutral' ? <CheckCircle2 className="w-5 h-5 text-sentiment-neutral" /> : 
                         <Download className="w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" />}
                    </div>
                </button>
            </div>
            
            <p className="text-center text-[10px] text-text-secondary mt-6 font-semibold uppercase tracking-widest opacity-60">
                Data formatted for external BI tools
            </p>
        </div>
    );
};

export default DownloadButtons;
