import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, BarChart2, LogOut, Menu, X, HelpCircle, User } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CompareStocks from './pages/CompareStocks';
import Login from './pages/Login';
import Register from './pages/Register';
import ExplainItPanel from './components/ExplainItPanel';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  if (!user) {
    return <div className="grid-bg" style={{ minHeight: '100vh', width: '100%' }}>{children}</div>;
  }

  const isHome = location.pathname === '/';
  const isCompare = location.pathname === '/compare';

  return (
    <div className="grid-bg app-layout">
      {/* Desktop & Tablet Sidebar */}
      <motion.aside 
        initial={{ x: -250, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="sidebar glass-panel desktop-sidebar"
      >
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem' }}>
          <img src="/logo.png" alt="PaperPulse Logo" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>PaperPulse</h2>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/" className={`nav-link ${isHome ? 'active' : ''}`}>
            <Home size={19} /> Dashboard
          </Link>
          <Link to="/compare" className={`nav-link ${isCompare ? 'active' : ''}`}>
            <BarChart2 size={19} /> Compare Stocks
          </Link>
          <button 
            onClick={() => setShowExplain(true)} 
            className="nav-link" 
            style={{ width: '100%', textAlign: 'left', background: 'none' }}
          >
            <HelpCircle size={19} /> Financial Terms
          </button>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.div whileHover={{ scale: 1.02 }} style={{ padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <User size={15} color="var(--accent-pink)" />
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
          </motion.div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={logout} className="btn-outline" style={{ width: '100%' }}>
            <LogOut size={16} /> Logout
          </motion.button>
        </div>
      </motion.aside>

      {/* Mobile Topbar */}
      <header className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src="/logo.png" alt="PaperPulse Logo" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
          <span style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.3px' }}>PaperPulse</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={() => setShowExplain(true)} 
            aria-label="Explain financial terms"
            style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}
          >
            <HelpCircle size={22} />
          </button>
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            aria-label="Open menu"
            style={{ padding: '0.5rem', color: 'var(--text-primary)' }}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Slide-out Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              className="mobile-drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              className="mobile-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <img src="/logo.png" alt="PaperPulse Logo" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                  <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>PaperPulse</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-secondary)', padding: '0.25rem' }}>
                  <X size={22} />
                </button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Link 
                  to="/" 
                  className={`nav-link ${isHome ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home size={20} /> Dashboard
                </Link>
                <Link 
                  to="/compare" 
                  className={`nav-link ${isCompare ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BarChart2 size={20} /> Compare Stocks
                </Link>
                <button 
                  onClick={() => { setMobileMenuOpen(false); setShowExplain(true); }} 
                  className="nav-link"
                  style={{ width: '100%', textAlign: 'left', background: 'none' }}
                >
                  <HelpCircle size={20} /> Financial Terms
                </button>
              </nav>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{user.name}</p>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{user.email}</p>
                </div>
                <button onClick={logout} className="btn-outline" style={{ width: '100%' }}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Page Area */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className={`mobile-bottom-nav-item ${isHome ? 'active' : ''}`}>
          <Home size={19} />
          <span>Dashboard</span>
        </Link>
        <Link to="/compare" className={`mobile-bottom-nav-item ${isCompare ? 'active' : ''}`}>
          <BarChart2 size={19} />
          <span>Compare</span>
        </Link>
        <button 
          onClick={() => setShowExplain(true)} 
          className="mobile-bottom-nav-item"
          style={{ background: 'none', border: 'none' }}
        >
          <HelpCircle size={19} />
          <span>Learn</span>
        </button>
      </nav>

      {/* Explain It Panel */}
      {showExplain && <ExplainItPanel onClose={() => setShowExplain(false)} />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><CompareStocks /></ProtectedRoute>} />
            </Routes>
          </AnimatePresence>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
