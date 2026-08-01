import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { X, Save, Key, Cpu, Cloud, Check } from 'lucide-react';

export const SettingsModal = () => {
  const { isSettingsOpen, setIsSettingsOpen, settings, modelsInfo, refreshSettings } = useChat();

  const [provider, setProvider] = useState('ollama');
  const [apiKey, setApiKey] = useState('');
  const [cloudModel, setCloudModel] = useState('anthropic/claude-3.5-sonnet');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3:latest');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setProvider(settings.active_provider || 'ollama');
      setApiKey(settings.openrouter?.api_key || '');
      setCloudModel(settings.openrouter?.default_model || 'anthropic/claude-3.5-sonnet');
      setOllamaUrl(settings.ollama?.base_url || 'http://localhost:11434');
      setOllamaModel(settings.ollama?.default_model || 'llama3:latest');
    }
  }, [settings]);

  if (!isSettingsOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_provider: provider,
          openrouter_api_key: apiKey,
          openrouter_default_model: cloudModel,
          ollama_base_url: ollamaUrl,
          ollama_default_model: ollamaModel
        })
      });
      if (res.ok) {
        await refreshSettings();
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          setIsSettingsOpen(false);
        }, 1200);
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  const cloudModelsList = modelsInfo?.openrouter?.available_models || [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.3-70b-instruct'
  ];

  const ollamaModelsList = modelsInfo?.ollama?.available_models || ['llama3:latest'];

  return (
    <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Engine & System Settings</span>
          </h3>
          <button className="icon-button" onClick={() => setIsSettingsOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Provider Selector */}
          <div className="form-group">
            <label className="form-label">Active LLM Engine Provider</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className={`skill-pill ${provider === 'ollama' ? 'active' : ''}`}
                style={{ padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}
                onClick={() => setProvider('ollama')}
              >
                <Cpu size={16} />
                <span>Ollama (Local)</span>
              </button>
              <button
                type="button"
                className={`skill-pill ${provider === 'openrouter' ? 'active' : ''}`}
                style={{ padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}
                onClick={() => setProvider('openrouter')}
              >
                <Cloud size={16} />
                <span>OpenRouter (Cloud)</span>
              </button>
            </div>
          </div>

          {/* OpenRouter Config */}
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={14} />
              <span>OpenRouter Cloud Configuration</span>
            </div>

            <div className="form-group">
              <label className="form-label">OpenRouter API Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cloud Model</label>
              <select
                className="form-select"
                value={cloudModel}
                onChange={(e) => setCloudModel(e.target.value)}
              >
                {cloudModelsList.map(m => (
                  <option key={m} value={m} style={{ background: '#121622' }}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ollama Config */}
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} />
              <span>Local Ollama Configuration</span>
            </div>

            <div className="form-group">
              <label className="form-label">Ollama Base URL</label>
              <input
                type="text"
                className="form-input"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Local Ollama Model</label>
              <select
                className="form-select"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
              >
                {ollamaModelsList.map(m => (
                  <option key={m} value={m} style={{ background: '#121622' }}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="save-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {savedSuccess ? <Check size={16} /> : <Save size={16} />}
            <span>{savedSuccess ? 'Settings Saved!' : 'Save Configuration'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
