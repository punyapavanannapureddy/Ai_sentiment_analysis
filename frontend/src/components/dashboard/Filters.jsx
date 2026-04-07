import React from 'react';

const Filters = ({ product, setProduct, source, setSource, days, setDays }) => {
    return (
        <div className="sticky top-16 z-10 w-full bg-bg-secondary/90 backdrop-blur-md border-b border-border-dark py-4 px-6 md:px-8 mt-16 flex flex-wrap gap-6 items-center shadow-lg shadow-black/20">
            <div className="flex flex-col">
                <label className="text-xs uppercase tracking-wider text-text-secondary mb-1 font-semibold">Product</label>
                <select 
                    value={product} 
                    onChange={(e) => setProduct(e.target.value)}
                    className="bg-bg-primary border border-border-dark text-text-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors cursor-pointer"
                >
                    <option value="iPhone 13">iPhone 13</option>
                    <option value="iPhone 14">iPhone 14</option>
                    <option value="iPhone 15">iPhone 15</option>
                </select>
            </div>

            <div className="flex flex-col">
                <label className="text-xs uppercase tracking-wider text-text-secondary mb-1 font-semibold">Source</label>
                <select 
                    value={source} 
                    onChange={(e) => setSource(e.target.value)}
                    className="bg-bg-primary border border-border-dark text-text-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors cursor-pointer"
                >
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                </select>
            </div>

            <div className="flex flex-col">
                <label className="text-xs uppercase tracking-wider text-text-secondary mb-1 font-semibold">Date Range</label>
                <select 
                    value={days} 
                    onChange={(e) => setDays(e.target.value)}
                    className="bg-bg-primary border border-border-dark text-text-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors cursor-pointer"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Custom Range (90 days)</option>
                </select>
            </div>
        </div>
    );
};

export default Filters;
