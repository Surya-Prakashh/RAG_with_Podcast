import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Terminal, Download, Check, Copy } from 'lucide-react';

export const LogsModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState('Loading system logs...');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs?lines=200');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || 'No logs available.');
      } else {
        setLogs('Failed to fetch backend logs.');
      }
    } catch (e) {
      setLogs(`Error connecting to backend logs API: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lenny_assistant_system_${Date.now()}.log`;
    a.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ width: '800px', maxWidth: '92vw', height: '80vh' }}
      >
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>System Activity Logs</span>
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="icon-button" onClick={fetchLogs} title="Refresh Logs">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
            <button className="icon-button" onClick={handleCopy} title="Copy Logs">
              {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
            </button>
            <button className="icon-button" onClick={handleDownload} title="Download Log File">
              <Download size={14} />
            </button>
            <button className="icon-button" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
            Log File Location: <code style={{ color: '#a5b4fc' }}>backend/logs/app.log</code>
          </div>
          <pre
            style={{
              flex: 1,
              background: '#0a0d14',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '14px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              lineHeight: 1.5,
              color: '#38bdf8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            {logs}
          </pre>
        </div>
      </div>
    </div>
  );
};
