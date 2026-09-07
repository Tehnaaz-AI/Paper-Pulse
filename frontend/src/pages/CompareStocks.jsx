import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ArrowRightLeft } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const CompareStocks = () => {
  const [stocks, setStocks] = useState([]);
  const [stockA, setStockA] = useState('TCS');
  const [stockB, setStockB] = useState('INFY');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/stocks`).then(res => setStocks(res.data.data)).catch(console.error);
  }, []);

  const handleCompare = () => {
    if (stockA === stockB) {
      alert("Please select different stocks to compare");
      return;
    }
    setLoading(true);
    axios.get(`${API_BASE}/stocks/compare?symbols=${stockA},${stockB}`)
      .then(res => {
        setComparisonData(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ paddingBottom: '2rem' }}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Comparison</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Direct head-to-head metrics and AI signal breakdown
          </p>
        </div>
      </div>
      
      <div className="glass-panel compare-form-card">
        <div style={{ flex: 1, width: '100%' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Asset A</label>
          <select className="input-field" style={{ width: '100%' }} value={stockA} onChange={(e) => setStockA(e.target.value)}>
            {stocks.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ flex: 1, width: '100%' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Asset B</label>
          <select className="input-field" style={{ width: '100%' }} value={stockB} onChange={(e) => setStockB(e.target.value)}>
            {stocks.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleCompare} 
          disabled={loading} 
          style={{ height: '42px', padding: '0 1.75rem', minWidth: '130px' }}
        >
          <ArrowRightLeft size={16} />
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {comparisonData && (
        <div className="compare-grid">
          {comparisonData.map((data, idx) => (
            <motion.div 
              key={data.symbol}
              className="glass-panel" 
              style={{ padding: '1.5rem' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
            >
              <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Symbol</span>
                <h3 style={{ fontSize: '1.6rem', margin: '0.1rem 0', color: 'var(--accent-pink)', fontWeight: 700 }}>{data.symbol}</h3>
                <h2 style={{ margin: '0.4rem 0 0 0', fontSize: '1.4rem' }}>₹{data.currentPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || data.currentPrice}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>P/E Ratio</span>
                  <span style={{ fontWeight: 600 }}>{data.metrics?.peRatio || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ROE</span>
                  <span style={{ fontWeight: 600 }}>{data.metrics?.roe || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>EPS</span>
                  <span style={{ fontWeight: 600 }}>{data.metrics?.eps || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Market Cap</span>
                  <span style={{ fontWeight: 600 }}>{data.metrics?.marketCap || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Dividend Yield</span>
                  <span style={{ fontWeight: 600 }}>{data.metrics?.dividendYield || 'N/A'}</span>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI Signal</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>Trend: <strong style={{ color: data.analysis?.trend === 'Positive' ? 'var(--accent-green)' : (data.analysis?.trend === 'Negative' ? 'var(--accent-red)' : 'var(--text-primary)') }}>{data.analysis?.trend || 'Neutral'}</strong></span>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    backgroundColor: data.analysis?.signal === 'BUY' ? 'rgba(34, 197, 94, 0.2)' : (data.analysis?.signal === 'SELL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.2)'),
                    color: data.analysis?.signal === 'BUY' ? 'var(--accent-green)' : (data.analysis?.signal === 'SELL' ? 'var(--accent-red)' : 'var(--text-secondary)')
                  }}>
                    {data.analysis?.signal || 'HOLD'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default CompareStocks;
