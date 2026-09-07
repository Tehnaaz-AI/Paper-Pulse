import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, BookOpen } from 'lucide-react';
import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const ExplainItPanel = ({ onClose }) => {
  const [terms, setTerms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/explanations`)
      .then(res => {
        setTerms(res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredTerms = terms.filter(t => 
    t.term.toLowerCase().includes(search.toLowerCase()) || 
    t.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {/* Backdrop for mobile */}
      <motion.div 
        className="mobile-drawer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div 
        className="glass-panel explain-panel-container"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookOpen size={20} color="var(--accent-pink)" />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Financial Glossary</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search concepts (e.g., P/E, ROE)..." 
              style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.9rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
              Loading financial terms...
            </div>
          ) : filteredTerms.length > 0 ? (
            filteredTerms.map((t, idx) => (
              <motion.div 
                key={t.term}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{ background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}
              >
                <h4 style={{ color: 'var(--accent-pink)', margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 600 }}>{t.term}</h4>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.4rem', lineHeight: '1.5' }}>{t.definition}</p>
                {t.importance && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', lineHeight: '1.4' }}><strong>Why it matters:</strong> {t.importance}</p>}
                {t.example && <p style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>Ex: {t.example}</p>}
              </motion.div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.9rem' }}>
              No terms found matching "{search}".
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExplainItPanel;
