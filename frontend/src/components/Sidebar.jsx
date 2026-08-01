import React from 'react';
import { useChat } from '../context/ChatContext';
import { Plus, MessageSquare, Trash2, Zap } from 'lucide-react';

export const Sidebar = () => {
  const { 
    sessions, 
    activeSessionId, 
    setActiveSessionId, 
    createNewSession, 
    deleteSession 
  } = useChat();

  return (
    <aside className="sidebar">
      <button className="new-chat-btn" onClick={createNewSession}>
        <Plus size={18} />
        <span>New Chat</span>
      </button>

      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginTop: '6px', letterSpacing: '0.05em' }}>
        RECENT CONVERSATIONS
      </div>

      <div className="session-list">
        {sessions.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', padding: '10px 4px' }}>
            No prior sessions. Click "New Chat" to begin!
          </div>
        ) : (
          sessions.map(s => (
            <div
              key={s.id}
              className={`session-item ${activeSessionId === s.id ? 'active' : ''}`}
              onClick={() => setActiveSessionId(s.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <MessageSquare size={14} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.title || 'New Conversation'}
                </span>
              </div>
              <Trash2
                size={14}
                className="delete-session-icon"
                onClick={(e) => deleteSession(s.id, e)}
                style={{ color: '#ef4444' }}
              />
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Zap size={13} style={{ color: 'var(--accent-primary)' }} />
        <span>Lenny Growth Engine v1.0</span>
      </div>
    </aside>
  );
};
