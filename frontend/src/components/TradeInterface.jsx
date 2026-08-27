import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;
const TradeInterface = ({ stockData, onTrade }) => {
  const [quantity, setQuantity] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleTrade = (action) => {
    setLoading(true);
    axios.post(`${API_BASE}/trades/execute`, {
      symbol: stockData.symbol,
      action: action,
      quantity: action === 'HOLD' ? 0 : Number(quantity),
      price: stockData.currentPrice,
      signal: stockData.analysis.signal
    })
    .then(res => {
      alert(`Successfully executed ${action} trade!`);
      if (onTrade) onTrade();
    })
    .catch(err => {
      alert(err.response?.data?.message || 'Trade failed');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const getSignalColor = (signal) => {
    if (signal === 'BUY') return 'var(--accent-green)';
    if (signal === 'SELL') return 'var(--accent-red)';
    return 'var(--text-secondary)';
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>{stockData.symbol} Overview</h3>
        <h2 style={{ margin: 0, fontSize: '2rem' }}>₹{stockData.currentPrice.toLocaleString()}</h2>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
        <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>AI Signal Analysis</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Trend: <strong>{stockData.analysis.trend}</strong></span>
          <span style={{ 
            color: getSignalColor(stockData.analysis.signal),
            fontWeight: 'bold',
            padding: '0.25rem 0.75rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '1rem'
          }}>{stockData.analysis.signal}</span>
        </div>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {stockData.analysis.reasoning}
        </p>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Quantity</label>
        <input 
          type="number" 
          className="input-field" 
          style={{ width: '100%', marginBottom: '1rem' }} 
          value={quantity} 
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <button 
          className="btn-success" 
          onClick={() => handleTrade('BUY')}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'BUY'}
        </button>
        <button 
          className="btn-danger" 
          onClick={() => handleTrade('SELL')}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'SELL'}
        </button>
      </div>
      <button 
        className="btn-outline" 
        onClick={() => handleTrade('HOLD')}
        disabled={loading}
        style={{ width: '100%' }}
      >
        HOLD (Skip Trade)
      </button>
    </div>
  );
};

export default TradeInterface;
