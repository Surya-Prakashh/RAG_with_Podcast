import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Settings, Sparkles, Cpu, Cloud, Radio, Terminal, Brain, Server } from 'lucide-react';
import { LogsModal } from './LogsModal';
import { MemoriesModal } from './MemoriesModal';
import { ApiDashboardModal } from './ApiDashboardModal';

export const Navbar = () => {
  const { settings, modelsInfo, setIsSettingsOpen } = useChat();
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [isApiDashboardOpen, setIsApiDashboardOpen] = useState(false);

  const provider = settings?.active_provider || 'ollama';
  const isOllama = provider === 'ollama';
  
  const activeModel = isOllama 
    ? (settings?.ollama?.default_model || 'llama3:latest')
    : (settings?.openrouter?.default_model || 'claude-3.5-sonnet');

  const ollamaOnline = modelsInfo?.ollama?.online;

  return (
    <>
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-logo">
            <Sparkles size={18} />
          </div>
          <span className="brand-title">The Lenny Growth Assistant</span>
          <span className="brand-badge">Lenny's Podcast RAG</span>
        </div>

        <div className="navbar-controls">
          <div className="status-pill">
            {isOllama ? <Cpu size={14} /> : <Cloud size={14} />}
            <span>{isOllama ? 'Local Ollama' : 'OpenRouter Cloud'}</span>
            <span className={`status-dot ${isOllama ? (ollamaOnline ? 'online' : '') : 'cloud'}`}></span>
          </div>

          <div className="status-pill" style={{ fontSize: '0.78rem', color: '#a5b4fc' }}>
            <Radio size={13} />
            <span>{activeModel}</span>
          </div>

          <button 
            className="icon-button" 
            onClick={() => setIsApiDashboardOpen(true)}
            title="Interactive REST & SSE API Swagger Dashboard"
            style={{ color: '#818cf8' }}
          >
            <Server size={18} />
          </button>

          <button 
            className="icon-button" 
            onClick={() => setIsMemoriesOpen(true)}
            title="Mem0 User Long-Term Memory"
            style={{ color: '#f472b6' }}
          >
            <Brain size={18} />
          </button>

          <button 
            className="icon-button" 
            onClick={() => setIsLogsOpen(true)}
            title="System Activity Logs"
          >
            <Terminal size={18} />
          </button>

          <button 
            className="icon-button" 
            onClick={() => setIsSettingsOpen(true)}
            title="Open Settings Drawer"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <ApiDashboardModal isOpen={isApiDashboardOpen} onClose={() => setIsApiDashboardOpen(false)} />
      <LogsModal isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />
      <MemoriesModal isOpen={isMemoriesOpen} onClose={() => setIsMemoriesOpen(false)} />
    </>
  );
};

