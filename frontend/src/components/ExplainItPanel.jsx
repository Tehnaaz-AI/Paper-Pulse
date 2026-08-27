import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'import.meta.env.VITE_API_URL';

const ExplainItPanel = ({ onClose }) => {
  const [terms, setTerms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/explanations`)
      .then(res => {
        setTerms(res.data.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const filteredTerms = terms.filter(t => t.term.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatePresence>
      <motion.div 
        className="glass-panel"
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          bottom: '2rem',
          width: '400px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Explain It</h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X /></button>
        </div>
        
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search financial terms..." 
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading ? (
            <p>Loading terms...</p>
          ) : filteredTerms.length > 0 ? (
            filteredTerms.map((t, idx) => (
              <motion.div 
                key={t.term}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}
              >
                <h4 style={{ color: 'var(--accent-pink)', margin: '0 0 0.5rem 0' }}>{t.term}</h4>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', lineHeight: '1.5' }}>{t.definition}</p>
                {t.importance && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}><strong>Why it matters:</strong> {t.importance}</p>}
                {t.example && <p style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontStyle: 'italic', margin: 0 }}>Ex: {t.example}</p>}
              </motion.div>
            ))
          ) : (
            <p>No terms found.</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExplainItPanel;
