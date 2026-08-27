import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, BarChart2, Briefcase, Wallet, Home, Info, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CompareStocks from './pages/CompareStocks';
import Login from './pages/Login';
import Register from './pages/Register';
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
  if (!user) return <div className="app-container grid-bg" style={{ minHeight: '100vh', width: '100vw' }}>{children}</div>;

  return (
    <div className="app-container grid-bg" style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      <motion.div 
        initial={{ x: -250, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="sidebar glass-panel"
        style={{ width: '250px', margin: '1rem', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem', zIndex: 10, position: 'sticky', top: '1rem', height: 'calc(100vh - 2rem)' }}
      >
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>PaperPulse</h2>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.5rem', color: 'var(--text-primary)', transition: 'background 0.2s' }} className="nav-link">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/compare" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.5rem', color: 'var(--text-primary)', transition: 'background 0.2s' }} className="nav-link">
            <BarChart2 size={20} /> Compare Stocks
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.div whileHover={{ scale: 1.02 }} style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{user.name}</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.email}</p>
          </motion.div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={logout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Logout
          </motion.button>
        </div>
      </motion.div>

      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', zIndex: 1 }}>
        {children}
      </div>
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
