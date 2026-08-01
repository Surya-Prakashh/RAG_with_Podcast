import React, { useState, useEffect } from 'react';
import { X, Brain, Trash2, RefreshCw, Check, Sparkles } from 'lucide-react';

export const MemoriesModal = ({ isOpen, onClose }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cleared, setCleared] = useState(false);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (e) {
      console.error('Error fetching Mem0 memories:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      const res = await fetch('/api/memories', { method: 'DELETE' });
      if (res.ok) {
        setMemories([]);
        setCleared(true);
        setTimeout(() => setCleared(false), 2000);
      }
    } catch (e) {
      console.error('Error clearing memories:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '600px', maxWidth: '92vw' }}
      >
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={18} style={{ color: '#ec4899' }} />
            <span>Mem0 Long-Term User Memories</span>
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="icon-button" onClick={fetchMemories} title="Refresh Memories">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
            {memories.length > 0 && (
              <button className="icon-button" onClick={handleClear} title="Clear All Memories" style={{ color: '#f87171' }}>
                {cleared ? <Check size={14} /> : <Trash2 size={14} />}
              </button>
            )}
            <button className="icon-button" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Mem0 extracts user profile facts, preferences, and background information automatically across past sessions and injects them into system prompts.
          </p>

          {memories.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              <Brain size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <div>No memories extracted yet. Tell the assistant who you are (e.g. <em>"I am a PM at a B2B SaaS startup"</em>) to see Mem0 in action!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
              {memories.map((m) => (
                <div 
                  key={m.id} 
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(236, 72, 153, 0.08)',
                    border: '1px solid rgba(236, 72, 153, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} style={{ color: '#ec4899' }} />
                    <span style={{ color: '#f472b6', fontWeight: 600, fontSize: '0.78rem' }}>[{m.category}]</span>
                    <span style={{ color: 'var(--text-main)' }}>{m.fact}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
