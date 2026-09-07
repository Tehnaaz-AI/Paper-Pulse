import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

const Register = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-bg auth-page-container">
      {/* Branding Section */}
      <div className="auth-branding-section">
        <motion.img 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          src="/logo.png" 
          alt="PaperPulse Logo" 
          style={{ width: 'clamp(64px, 10vw, 100px)', height: 'clamp(64px, 10vw, 100px)', marginBottom: '1.25rem', borderRadius: '50%', boxShadow: '0 0 35px rgba(236, 72, 153, 0.45)' }} 
        />
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 700, margin: '0 0 0.75rem 0', background: 'linear-gradient(45deg, var(--accent-pink), var(--accent-green))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
          PaperPulse
        </h1>
        <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.6 }}>
          Start your risk-free trading journey today. Sign up and experience the power of AI-assisted market analysis.
        </p>
      </div>

      {/* Auth Form Section */}
      <div className="auth-form-section">
        <motion.div 
          className="glass-panel auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          <div>
            <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.8rem', textAlign: 'center', fontWeight: 700 }}>Create an Account</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0, fontSize: '0.9rem' }}>Join PaperPulse and start simulated trading</p>
          </div>
          
          {error && (
            <div style={{ color: 'var(--accent-red)', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '0.65rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <User size={14} /> Full Name
              </label>
              <input 
                type="text" 
                className="input-field" 
                style={{ width: '100%' }}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Mail size={14} /> Email
              </label>
              <input 
                type="email" 
                className="input-field" 
                style={{ width: '100%' }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Lock size={14} /> Password
              </label>
              <input 
                type="password" 
                className="input-field" 
                style={{ width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ marginTop: '0.5rem', width: '100%', height: '44px' }}
            >
              <UserPlus size={16} />
              {loading ? 'Creating Account...' : 'Register'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-pink)', fontWeight: 600 }}>Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
