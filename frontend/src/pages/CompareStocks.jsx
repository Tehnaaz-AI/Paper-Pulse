import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_BASE = 'import.meta.env.VITE_API_URL';

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
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ paddingBottom: '2rem' }}
    >
      <h2 style={{ marginBottom: '2rem' }}>Compare Stocks</h2>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Stock A</label>
          <select className="input-field" style={{ width: '100%' }} value={stockA} onChange={(e) => setStockA(e.target.value)}>
            {stocks.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Stock B</label>
          <select className="input-field" style={{ width: '100%' }} value={stockB} onChange={(e) => setStockB(e.target.value)}>
            {stocks.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={handleCompare} disabled={loading} style={{ height: '40px', padding: '0 2rem' }}>
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {comparisonData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {comparisonData.map((data, idx) => (
            <motion.div 
              key={data.symbol}
              className="glass-panel" 
              style={{ padding: '2rem' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
            >
              <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--accent-pink)' }}>{data.symbol}</h3>
                <h2 style={{ margin: '0.5rem 0 0 0' }}>₹{data.currentPrice.toLocaleString()}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>P/E Ratio</span>
                  <span>{data.metrics.peRatio}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ROE</span>
                  <span>{data.metrics.roe}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>EPS</span>
                  <span>{data.metrics.eps}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Market Cap</span>
                  <span>{data.metrics.marketCap}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Dividend Yield</span>
                  <span>{data.metrics.dividendYield}</span>
                </div>
              </div>

              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>AI Signal</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Trend: <strong style={{ color: data.analysis.trend === 'Positive' ? 'var(--accent-green)' : (data.analysis.trend === 'Negative' ? 'var(--accent-red)' : 'var(--text-primary)') }}>{data.analysis.trend}</strong></span>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontWeight: 'bold',
                    backgroundColor: data.analysis.signal === 'BUY' ? 'rgba(34, 197, 94, 0.2)' : (data.analysis.signal === 'SELL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.2)'),
                    color: data.analysis.signal === 'BUY' ? 'var(--accent-green)' : (data.analysis.signal === 'SELL' ? 'var(--accent-red)' : 'var(--text-secondary)')
                  }}>
                    {data.analysis.signal}
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
