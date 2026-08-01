import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { MessageItem } from './MessageItem';
import { Send, Sparkles, BookOpen, Feather, Layout, Zap, Compass } from 'lucide-react';

export const ChatWindow = () => {
  const { 
    messages, 
    sendMessage, 
    isStreaming, 
    selectedSkill, 
    setSelectedSkill 
  } = useChat();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const samplePrompts = [
    {
      title: "What is Shreyas Doshi's LNO framework?",
      desc: "Q&A with exact guest citation from Lenny's Podcast.",
      skill: "qa"
    },
    {
      title: "Write a Ship30for30 essay on Product-Market Fit",
      desc: "Synthesize insights into a ~1250-word atomic essay.",
      skill: "ship30for30"
    },
    {
      title: "Generate an interactive HTML landing page component",
      desc: "Renders live side-by-side in Artifact Viewer.",
      skill: "artifact"
    },
    {
      title: "What does Brian Balfour say about growth loops?",
      desc: "Deep dive into viral & content growth mechanics.",
      skill: "qa"
    }
  ];

  return (
    <main className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '40px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--gradient-primary)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 24px rgba(99, 102, 241, 0.4)' }}>
              <Sparkles size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>The Lenny Growth Assistant</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Ingesting insights from <em>Lenny's Podcast</em>. Ask product Q&A questions, generate <strong>Ship30for30</strong> atomic essays, or build interactive HTML code artifacts.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              {samplePrompts.map((p, idx) => (
                <div
                  key={idx}
                  className="message-card"
                  style={{ cursor: 'pointer', textAlign: 'left', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', transition: 'all 0.2s ease' }}
                  onClick={() => {
                    setSelectedSkill(p.skill);
                    sendMessage(p.title);
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={14} style={{ color: 'var(--accent-primary)' }} />
                    {p.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageItem key={m.id} message={m} />)
        )}

        {isStreaming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
            <Zap size={14} className="spin" style={{ color: 'var(--accent-primary)' }} />
            <span>Lenny Assistant is reasoning and streaming response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls */}
      <div className="chat-input-wrapper">
        <div className="chat-input-box">
          <textarea
            className="chat-input-field"
            placeholder="Ask a growth question, request a Ship30for30 essay, or generate an HTML artifact..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />

          <div className="input-controls">
            <div className="skill-selector-pills">
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginRight: '4px' }}>Skill Mode:</span>
              <button
                className={`skill-pill ${selectedSkill === 'auto' ? 'active' : ''}`}
                onClick={() => setSelectedSkill('auto')}
              >
                Auto Router
              </button>
              <button
                className={`skill-pill ${selectedSkill === 'qa' ? 'active' : ''}`}
                onClick={() => setSelectedSkill('qa')}
              >
                <BookOpen size={11} style={{ display: 'inline', marginRight: '3px' }} />
                Podcast Q&A
              </button>
              <button
                className={`skill-pill ${selectedSkill === 'ship30for30' ? 'active' : ''}`}
                onClick={() => setSelectedSkill('ship30for30')}
              >
                <Feather size={11} style={{ display: 'inline', marginRight: '3px' }} />
                Ship30for30
              </button>
              <button
                className={`skill-pill ${selectedSkill === 'artifact' ? 'active' : ''}`}
                onClick={() => setSelectedSkill('artifact')}
              >
                <Layout size={11} style={{ display: 'inline', marginRight: '3px' }} />
                Artifact Code
              </button>
            </div>

            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              title="Send Message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
