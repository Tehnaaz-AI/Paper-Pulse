import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import axios from 'axios';
import { Wallet, Briefcase, TrendingUp } from 'lucide-react';
import StockChart from '../components/StockChart';
import TradeInterface from '../components/TradeInterface';
import ExplainItPanel from '../components/ExplainItPanel';

const API_BASE = 'import.meta.env.VITE_API_URL';

const TiltCard = ({ children, style }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleMouse(event) {
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
        perspective: 1000
      }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div style={{ transform: "translateZ(30px)" }}>
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
              reasoning: mlRes.data.data.reasons.join(' ')
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
        // Backend now returns { holdings, totalValue, totalReturn }
        setPortfolio({
          holdings: res.data.data.holdings || [],
          totalValue: res.data.data.totalValue || 0,
          totalReturn: res.data.data.totalReturn || 0
        });
      })
      .catch(console.error);
    // Fetch trades
    axios.get(`${API_BASE}/trades`)
      .then(res => setTradeHistory(res.data.data))
      .catch(console.error);
  };

  const handleTradeComplete = () => {
    fetchUserData();
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="dashboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ paddingBottom: '2rem' }}
    >
      <motion.div className="header" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, background: 'linear-gradient(90deg, var(--accent-pink), var(--accent-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Trading Command Center
        </h1>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-outline" onClick={() => setShowExplain(true)}>Explain a Term</motion.button>
      </motion.div>

      {/* Infinite Marquee Ticker */}
      {tickerData.length > 0 && (
        <motion.div variants={itemVariants} style={{ marginBottom: '2rem' }}>
          <div className="marquee-container" style={{ padding: '0.5rem 0' }}>
            <div className="marquee-content">
              {/* Duplicate array multiple times to ensure smooth infinite loop */}
              {[...tickerData, ...tickerData, ...tickerData, ...tickerData].map((t, i) => (
                <div 
                  key={i} 
                  className="glass-panel marquee-item" 
                  onClick={() => setSelectedStock(t.symbol)}
                  style={{ 
                    cursor: 'pointer',
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.25rem', 
                    padding: '1rem', 
                    minWidth: '180px', 
                    margin: '0 1rem', 
                    flexShrink: 0, 
                    borderLeft: '4px solid var(--accent-pink)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(236, 72, 153, 0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{t.symbol}</strong>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{t.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Top Stats */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <TiltCard style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.2)', borderRadius: '50%', boxShadow: '0 0 15px rgba(236, 72, 153, 0.3)' }}><Wallet color="var(--accent-pink)" size={28} /></div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Virtual Balance</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>₹{wallet.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
          </div>
        </TiltCard>
        
        <TiltCard style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '50%', boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)' }}><Briefcase color="var(--accent-green)" size={28} /></div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Portfolio Holdings</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{portfolio.holdings.length} Stocks</h2>
          </div>
        </TiltCard>
        
        <TiltCard style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ 
            padding: '1rem', 
            background: portfolio.totalReturn >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)', 
            borderRadius: '50%', 
            boxShadow: portfolio.totalReturn >= 0 ? '0 0 15px rgba(16, 185, 129, 0.3)' : '0 0 15px rgba(244, 63, 94, 0.3)' 
          }}>
            <TrendingUp color={portfolio.totalReturn >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Total P/L</p>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: (portfolio.totalReturn >= 0) ? 'var(--accent-green)' : 'var(--accent-red)', textShadow: `0 0 10px ${(portfolio.totalReturn >= 0) ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}` }}>
              {portfolio.totalReturn !== undefined ? `${portfolio.totalReturn >= 0 ? '+' : ''}₹${portfolio.totalReturn.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '-'}
            </h2>
          </div>
        </TiltCard>
      </motion.div>

      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Chart Section */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Market Chart</h3>
            <select className="input-field" value={selectedStock} onChange={(e) => setSelectedStock(e.target.value)} style={{ minWidth: '150px' }}>
              {stocks.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {loading ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-pink)', borderRadius: '50%' }} />
            </div>
          ) : (
            <div style={{ width: '100%', overflow: 'hidden', borderRadius: '0.5rem' }}>
              <StockChart data={stockData?.history || []} />
            </div>
          )}
        </div>

        {/* Action Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {stockData && (
            <TradeInterface stockData={stockData} onTrade={handleTradeComplete} />
          )}
        </div>
      </motion.div>

      {/* Portfolio and Trade History Tables */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2.5rem' }}>
        
        {/* Portfolio Table */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Portfolio Holdings</h3>
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Stock</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Qty</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Avg. Price</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>P/L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>No holdings yet. Execute a trade to see them here!</td></tr>
                ) : (
                  portfolio.holdings.map((h, i) => {
                    const pl = (h.currentValue || 0) - (h.investedAmount || 0);
                    const plColor = pl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--accent-pink)' }}>{h.symbol}</td>
                        <td style={{ padding: '0.75rem 0' }}>{h.quantity}</td>
                        <td style={{ padding: '0.75rem 0' }}>₹{h.averagePurchasePrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || h.averagePurchasePrice}</td>
                        <td style={{ padding: '0.75rem 0', color: plColor }}>
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
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Recent Trades</h3>
          <div style={{ overflowX: 'auto', flex: 1, maxHeight: '300px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Date</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Stock</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Action</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Qty</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Price</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>P/L</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>No trades executed</td></tr>
                ) : (
                  tradeHistory.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(t.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--accent-pink)' }}>
                        {t.symbol}
                      </td>
                      <td style={{ padding: '0.75rem 0', color: t.action === 'BUY' ? 'var(--accent-green)' : (t.action === 'SELL' ? 'var(--accent-red)' : 'var(--text-secondary)'), fontWeight: 'bold' }}>
                        {t.action}
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>{t.quantity}</td>
                      <td style={{ padding: '0.75rem 0' }}>₹{t.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || t.price}</td>
                      <td style={{ padding: '0.75rem 0', color: t.action === 'SELL' && t.profitLoss != null ? (t.profitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)') : 'var(--text-primary)' }}>
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
      <motion.div variants={itemVariants} style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <p><strong>Educational only - not financial advice. No real money is involved.</strong></p>
      </motion.div>

      {showExplain && <ExplainItPanel onClose={() => setShowExplain(false)} />}
    </motion.div>
  );
};

export default Dashboard;
