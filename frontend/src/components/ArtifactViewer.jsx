import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { X, Copy, Download, Code, Eye, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ArtifactViewer = () => {
  const { activeArtifact, setActiveArtifact } = useChat();
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState(false);

  if (!activeArtifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeArtifact.type === 'html' ? 'html' : (activeArtifact.type === 'markdown' ? 'md' : 'txt');
    const blob = new Blob([activeArtifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArtifact.title.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
    a.click();
  };

  return (
    <div className="artifact-panel">
      <div className="artifact-header">
        <div className="artifact-title-group">
          <span className="skill-badge" style={{ textTransform: 'uppercase' }}>
            {activeArtifact.type}
          </span>
          <span className="artifact-title">{activeArtifact.title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="artifact-tabs">
            <button
              className={`artifact-tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Preview
            </button>
            <button
              className={`artifact-tab ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              <Code size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Code
            </button>
          </div>

          <button className="icon-button" onClick={handleCopy} title="Copy Content">
            {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
          </button>

          <button className="icon-button" onClick={handleDownload} title="Download File">
            <Download size={14} />
          </button>

          <button className="icon-button" onClick={() => setActiveArtifact(null)} title="Close Panel">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="artifact-body">
        {activeTab === 'preview' ? (
          activeArtifact.type === 'html' ? (
            <iframe
              title={activeArtifact.title}
              className="artifact-iframe"
              srcDoc={activeArtifact.content}
              sandbox="allow-scripts allow-modals"
            />
          ) : (
            <div className="artifact-code-editor" style={{ background: '#0d1117', color: '#f3f4f6' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeArtifact.content}
              </ReactMarkdown>
            </div>
          )
        ) : (
          <pre className="artifact-code-editor">
            <code>{activeArtifact.content}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
