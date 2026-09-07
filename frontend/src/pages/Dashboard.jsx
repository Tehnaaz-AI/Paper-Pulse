import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import axios from 'axios';
import { Wallet, Briefcase, TrendingUp, HelpCircle } from 'lucide-react';
import StockChart from '../components/StockChart';
import TradeInterface from '../components/TradeInterface';
import ExplainItPanel from '../components/ExplainItPanel';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const TiltCard = ({ children, style }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [6, -6]);
  const rotateY = useTransform(x, [-100, 100], [-6, 6]);

  function handleMouse(event) {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return; // Disable 3D tilt on mobile
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      className="glass-panel"
      style={{
        ...style,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
        minWidth: 0,
        width: '100%'
      }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div style={{ transform: "translateZ(20px)", minWidth: 0, width: '100%' }}>
        {children}
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const [wallet, setWallet] = useState({ balance: 100000 });
  const [portfolio, setPortfolio] = useState({ totalValue: 0, totalReturn: 0, holdings: [] });
  const [stocks, setStocks] = useState([]);
  const [tickerData, setTickerData] = useState([]);
  const [selectedStock, setSelectedStock] = useState('TCS');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExplain, setShowExplain] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);

  useEffect(() => {
    // Fetch available stocks
    axios.get(`${API_BASE}/stocks`).then(res => {
      setStocks(res.data.data);
      // Fetch prices for ticker
      Promise.all(res.data.data.map(sym => axios.get(`${API_BASE}/stocks/${sym}`)))
        .then(results => {
          setTickerData(results.map(r => r.data.data));
        });
    }).catch(console.error);
    fetchUserData();
  }, []);

  useEffect(() => {
    if (selectedStock) {
      setLoading(true);
      
      // Fetch stock historical data and ML Prediction in parallel
      Promise.all([
        axios.get(`${API_BASE}/stocks/${selectedStock}/history?limit=30`),
        axios.get(`${API_BASE}/ml/predict/${selectedStock}`)
      ])
      .then(([historyRes, mlRes]) => {
        // Fetch current price
        axios.get(`${API_BASE}/stocks/${selectedStock}`).then(priceRes => {
          setStockData({
            symbol: selectedStock,
            currentPrice: priceRes.data.data.price,
            history: historyRes.data.data,
            analysis: {
              trend: mlRes.data.data.trend,
              signal: mlRes.data.data.prediction,
              reasoning: mlRes.data.data.reasons?.join(' ') || ''
            }
          });
          setLoading(false);
        });
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [selectedStock]);

  const fetchUserData = () => {
    // Fetch wallet
    axios.get(`${API_BASE}/wallet`)
      .then(res => setWallet({ balance: res.data.data.balance }))
      .catch(console.error);

    // Fetch portfolio
    axios.get(`${API_BASE}/portfolio`)
      .then(res => {
        setPortfolio({
          holdings: res.data.data.holdings || [],
          totalValue: res.data.data.totalValue || 0,
          totalReturn: res.data.data.totalReturn || 0
        });
      })
      .catch(console.error);

    // Fetch trades
    axios.get(`${API_BASE}/trades`)
      .then(res => setTradeHistory(res.data.data || []))
      .catch(console.error);
  };

  const handleTradeComplete = () => {
    fetchUserData();
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ paddingBottom: '2rem', width: '100%', minWidth: 0 }}
    >
      <motion.div className="page-header" variants={itemVariants}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="page-title">
            Trading Command Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
            Real-time simulated trading powered by AI analysis
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.04 }} 
          whileTap={{ scale: 0.96 }} 
          className="btn-outline" 
          onClick={() => setShowExplain(true)}
          style={{ gap: '0.4rem', flexShrink: 0 }}
        >
          <HelpCircle size={16} /> Explain Terms
        </motion.button>
      </motion.div>

      {/* Infinite Marquee Ticker */}
      {tickerData.length > 0 && (
        <motion.div variants={itemVariants} style={{ marginBottom: '1.5rem', width: '100%', minWidth: 0 }}>
          <div className="marquee-container" style={{ padding: '0.25rem 0' }}>
            <div className="marquee-content">
              {[...tickerData, ...tickerData, ...tickerData, ...tickerData].map((t, i) => (
                <div 
                  key={i} 
                  className="glass-panel marquee-item" 
                  onClick={() => setSelectedStock(t.symbol)}
                  style={{ 
                    cursor: 'pointer',
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.2rem', 
                    padding: '0.75rem 0.9rem', 
                    minWidth: '150px', 
                    margin: '0 0.5rem', 
                    flexShrink: 0, 
                    borderLeft: selectedStock === t.symbol ? '4px solid var(--accent-pink)' : '4px solid rgba(255,255,255,0.12)',
                    transition: 'all 0.2s ease',
                    background: selectedStock === t.symbol ? 'rgba(236, 72, 153, 0.12)' : 'var(--glass-bg)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t.symbol}</strong>
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>₹{t.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Top Stats Cards */}
      <motion.div variants={itemVariants} className="stats-grid">
        <TiltCard>
          <div className="stat-card-inner">
            <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.18)', borderRadius: '50%', boxShadow: '0 0 15px rgba(236, 72, 153, 0.25)', flexShrink: 0 }}>
              <Wallet color="var(--accent-pink)" size={24} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.15rem' }}>Virtual Balance</p>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 2.4vw, 1.6rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ₹{wallet.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
        </TiltCard>
        
        <TiltCard>
          <div className="stat-card-inner">
            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.18)', borderRadius: '50%', boxShadow: '0 0 15px rgba(16, 185, 129, 0.25)', flexShrink: 0 }}>
              <Briefcase color="var(--accent-green)" size={24} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.15rem' }}>Holdings</p>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 2.4vw, 1.6rem)' }}>
                {portfolio.holdings.length} {portfolio.holdings.length === 1 ? 'Stock' : 'Stocks'}
              </h2>
            </div>
          </div>
        </TiltCard>
        
        <TiltCard>
          <div className="stat-card-inner">
            <div style={{ 
              padding: '0.75rem', 
              background: portfolio.totalReturn >= 0 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)', 
              borderRadius: '50%', 
              boxShadow: portfolio.totalReturn >= 0 ? '0 0 15px rgba(16, 185, 129, 0.25)' : '0 0 15px rgba(244, 63, 94, 0.25)',
              flexShrink: 0
            }}>
              <TrendingUp color={portfolio.totalReturn >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} size={24} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.15rem' }}>Total P/L</p>
              <h2 style={{ 
                margin: 0, 
                fontSize: 'clamp(1.2rem, 2.4vw, 1.6rem)', 
                color: (portfolio.totalReturn >= 0) ? 'var(--accent-green)' : 'var(--accent-red)', 
                textShadow: `0 0 10px ${(portfolio.totalReturn >= 0) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {portfolio.totalReturn !== undefined ? `${portfolio.totalReturn >= 0 ? '+' : ''}₹${portfolio.totalReturn.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '-'}
              </h2>
            </div>
          </div>
        </TiltCard>
      </motion.div>

      {/* Main Grid: Chart + Trade Interface */}
      <motion.div variants={itemVariants} className="dashboard-main-grid">
        {/* Chart Section */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Market Performance</h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                30-day historical pricing for {selectedStock}
              </p>
            </div>
            <select 
              className="input-field" 
              value={selectedStock} 
              onChange={(e) => setSelectedStock(e.target.value)} 
              style={{ minWidth: '130px' }}
            >
              {stocks.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {loading ? (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: 34, height: 34, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-pink)', borderRadius: '50%' }} />
            </div>
          ) : (
            <div style={{ width: '100%', minWidth: 0, overflow: 'hidden', borderRadius: '0.5rem' }}>
              <StockChart data={stockData?.history || []} />
            </div>
          )}
        </div>

        {/* Action Section: Trade Interface */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
          {stockData && (
            <TradeInterface stockData={stockData} onTrade={handleTradeComplete} />
          )}
        </div>
      </motion.div>

      {/* Portfolio and Trade History Tables */}
      <motion.div variants={itemVariants} className="dashboard-tables-grid">
        {/* Portfolio Table */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
          <div style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Portfolio Holdings</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{portfolio.holdings.length} Positions</span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>Stock</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>Qty</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>Avg. Price</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>P/L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '1.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No active holdings. Execute a trade to see your assets!
                    </td>
                  </tr>
                ) : (
                  portfolio.holdings.map((h, i) => {
                    const pl = (h.currentValue || 0) - (h.investedAmount || 0);
                    const plColor = pl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600, color: 'var(--accent-pink)' }}>{h.symbol}</td>
                        <td style={{ padding: '0.65rem 0.5rem' }}>{h.quantity}</td>
                        <td style={{ padding: '0.65rem 0.5rem' }}>₹{h.averagePurchasePrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || h.averagePurchasePrice}</td>
                        <td style={{ padding: '0.65rem 0.5rem', color: plColor, fontWeight: 500 }}>
                          {pl >= 0 ? '+' : ''}₹{pl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Trades Table */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
          <div style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Trades</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{tradeHistory.length} Recorded</span>
          </div>
          <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>Date</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>Stock</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>Action</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>Qty</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>Price</th>
                  <th style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem' }}>P/L</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '1.75rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No trades executed yet.
                    </td>
                  </tr>
                ) : (
                  tradeHistory.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.65rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(t.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600, color: 'var(--accent-pink)' }}>
                        {t.symbol}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', color: t.action === 'BUY' ? 'var(--accent-green)' : (t.action === 'SELL' ? 'var(--accent-red)' : 'var(--text-secondary)'), fontWeight: 'bold' }}>
                        {t.action}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>{t.quantity}</td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>₹{t.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || t.price}</td>
                      <td style={{ padding: '0.65rem 0.5rem', color: t.action === 'SELL' && t.profitLoss != null ? (t.profitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-primary)' }}>
                        {t.action === 'SELL' && t.profitLoss != null ? `${t.profitLoss >= 0 ? '+' : ''}₹${t.profitLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Educational Disclaimer */}
      <motion.div variants={itemVariants} style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.8 }}>
        <p><strong>Educational Trading Simulation:</strong> Real-time and simulated analytics. No actual capital is risked.</p>
      </motion.div>

      {showExplain && <ExplainItPanel onClose={() => setShowExplain(false)} />}
    </motion.div>
  );
};

export default Dashboard;
