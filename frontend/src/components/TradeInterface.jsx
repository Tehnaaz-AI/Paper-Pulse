import React, { useState } from 'react';
import axios from 'axios';
import { TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const TradeInterface = ({ stockData, onTrade }) => {
  const [quantity, setQuantity] = useState(10);
  const [loading, setLoading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState(null);

  const handleTrade = (action) => {
    setLoading(true);
    setTradeMessage(null);
    axios.post(`${API_BASE}/trades/execute`, {
      symbol: stockData.symbol,
      action: action,
      quantity: action === 'HOLD' ? 0 : Number(quantity),
      price: stockData.currentPrice,
      signal: stockData.analysis.signal
    })
    .then(res => {
      setTradeMessage({ type: 'success', text: `Executed ${action} order for ${stockData.symbol}!` });
      if (onTrade) onTrade();
    })
    .catch(err => {
      setTradeMessage({ type: 'error', text: err.response?.data?.message || 'Trade execution failed' });
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const getSignalBadgeStyle = (signal) => {
    if (signal === 'BUY') return { bg: 'rgba(16, 185, 129, 0.2)', text: 'var(--accent-green)', border: 'rgba(16, 185, 129, 0.4)' };
    if (signal === 'SELL') return { bg: 'rgba(244, 63, 94, 0.2)', text: 'var(--accent-red)', border: 'rgba(244, 63, 94, 0.4)' };
    return { bg: 'rgba(148, 163, 184, 0.2)', text: 'var(--text-secondary)', border: 'rgba(148, 163, 184, 0.4)' };
  };

  const badge = getSignalBadgeStyle(stockData.analysis.signal);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Instant Execution</span>
            <h3 style={{ margin: '0.1rem 0', fontSize: '1.4rem' }}>{stockData.symbol}</h3>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
            ₹{stockData.currentPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>AI Signal Engine</span>
          <span style={{ 
            color: badge.text,
            fontWeight: 'bold',
            fontSize: '0.82rem',
            padding: '0.2rem 0.65rem',
            background: badge.bg,
            border: `1px solid ${badge.border}`,
            borderRadius: '1rem'
          }}>
            {stockData.analysis.signal}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {stockData.analysis.reasoning || 'Analyzing market patterns and sentiment indicators.'}
        </p>
      </div>

      {tradeMessage && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.65rem 0.85rem', 
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
          background: tradeMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          border: `1px solid ${tradeMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          color: tradeMessage.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'
        }}>
          {tradeMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{tradeMessage.text}</span>
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quantity (Shares)</label>
        <input 
          type="number" 
          className="input-field" 
          style={{ width: '100%' }} 
          value={quantity} 
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          min="1"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Estimated Total:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            ₹{((stockData.currentPrice || 0) * (Number(quantity) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <button 
          className="btn-success" 
          onClick={() => handleTrade('BUY')}
          disabled={loading}
          style={{ width: '100%', height: '42px' }}
        >
          {loading ? 'Processing...' : 'BUY'}
        </button>
        <button 
          className="btn-danger" 
          onClick={() => handleTrade('SELL')}
          disabled={loading}
          style={{ width: '100%', height: '42px' }}
        >
          {loading ? 'Processing...' : 'SELL'}
        </button>
      </div>

      <button 
        className="btn-outline" 
        onClick={() => handleTrade('HOLD')}
        disabled={loading}
        style={{ width: '100%', fontSize: '0.88rem' }}
      >
        HOLD (Pass)
      </button>
    </div>
  );
};

export default TradeInterface;
