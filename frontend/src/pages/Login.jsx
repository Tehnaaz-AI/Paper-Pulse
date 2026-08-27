import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';


const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      {/* Left Branding Sidebar */}
      <div style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(16,185,129,0.05))', 
        padding: '4rem', textAlign: 'center', borderRight: '1px solid var(--glass-border)',
        backdropFilter: 'blur(10px)'
      }}>
        <img src="/logo.png" alt="PaperPulse Logo" style={{ width: 120, height: 120, marginBottom: '2rem', borderRadius: '50%', boxShadow: '0 0 40px rgba(236, 72, 153, 0.5)' }} />
        <h1 style={{ fontSize: '4rem', fontWeight: 700, margin: '0 0 1rem 0', background: 'linear-gradient(45deg, var(--accent-pink), var(--accent-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>PaperPulse</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '450px', lineHeight: 1.6 }}>
          Master the markets with zero risk. Trade, analyze, and learn with our premium AI-powered trading simulator.
        </p>
      </div>

      {/* Right Auth Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div 
          className="glass-panel"
          style={{ 
            padding: '3.5rem', width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '1.5rem', 
            boxShadow: 'var(--glow-shadow)'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          whileHover={{ boxShadow: '0 0 30px rgba(236, 72, 153, 0.6)' }}
        >
          <motion.h2 style={{ margin: 0, fontSize: '2rem', textAlign: 'center' }}>Welcome Back</motion.h2>
          <motion.p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 1rem 0' }}>Sign in to continue your journey</motion.p>
          
          {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</label>
              <input 
                type="email" 
                className="input-field" 
                style={{ width: '100%', padding: '1rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Password</label>
              <input 
                type="password" 
                className="input-field" 
                style={{ width: '100%', padding: '1rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>Log In</motion.button>
          </form>

          <motion.p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--accent-pink)', fontWeight: 'bold' }}>Register</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
