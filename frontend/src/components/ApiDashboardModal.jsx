import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, RefreshCw, Send, Server, CheckCircle2, 
  AlertCircle, Code2, Database, ShieldCheck, Terminal, Cpu
} from 'lucide-react';

const API_ENDPOINTS = [
  {
    category: "Chat & Streaming",
    method: "POST",
    path: "/api/chat/stream",
    summary: "Server-Sent Events (SSE) Chat Stream",
    description: "Streams LLM response tokens, RAG citations, and live artifacts in real time.",
    requestBody: JSON.stringify({
      session_id: "SESSION_UUID_HERE",
      message: "What is Shreyas Doshi's LNO framework?",
      skill: "qa"
    }, null, 2),
    sampleResponse: `event: meta
data: {"session_id":"...", "skill":"qa", "citations":[{"guest":"Shreyas Doshi"}]}

event: token
data: {"token":"The LNO framework classifies tasks..."}

event: done
data: {"status":"completed"}`
  },
  {
    category: "Session Management",
    method: "GET",
    path: "/api/sessions",
    summary: "List All Chat Sessions",
    description: "Retrieves a list of all active chat sessions sorted by last updated timestamp.",
    requestBody: null,
    sampleResponse: JSON.stringify([
      {
        id: "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
        title: "Product Growth Strategy",
        model_provider: "openrouter",
        model_name: "anthropic/claude-3.5-sonnet",
        created_at: "2026-08-02T10:00:00Z"
      }
    ], null, 2)
  },
  {
    category: "Session Management",
    method: "POST",
    path: "/api/sessions",
    summary: "Create New Session",
    description: "Creates a new chat session with specified provider and model.",
    requestBody: JSON.stringify({
      title: "New Conversation",
      model_provider: "ollama",
      model_name: "llama3:latest"
    }, null, 2),
    sampleResponse: JSON.stringify({
      id: "b2c3d4e5-f6a7-8901-bcde-2345678901bc",
      title: "New Conversation",
      model_provider: "ollama",
      model_name: "llama3:latest",
      created_at: "2026-08-02T12:00:00Z"
    }, null, 2)
  },
  {
    category: "Session Management",
    method: "GET",
    path: "/api/sessions/{session_id}",
    summary: "Get Session Details & Messages",
    description: "Fetches full session history including all messages, citations, and artifacts.",
    requestBody: null,
    params: [{ name: "session_id", value: "", placeholder: "Enter Session UUID" }],
    sampleResponse: JSON.stringify({
      id: "session-uuid",
      title: "Product Growth Strategy",
      messages: [
        { id: "msg-1", role: "user", content: "What is PMF?" },
        { id: "msg-2", role: "assistant", content: "Product-market fit..." }
      ]
    }, null, 2)
  },
  {
    category: "Session Management",
    method: "DELETE",
    path: "/api/sessions/{session_id}",
    summary: "Delete Chat Session",
    description: "Deletes a chat session and all associated messages and generated artifacts.",
    requestBody: null,
    params: [{ name: "session_id", value: "", placeholder: "Enter Session UUID" }]
  },
  {
    category: "Settings & System",
    method: "GET",
    path: "/api/health",
    summary: "System Health Check",
    description: "Inspects status of database, local Ollama daemon, and OpenRouter configuration.",
    requestBody: null
  },
  {
    category: "Settings & System",
    method: "GET",
    path: "/api/settings",
    summary: "Read Runtime Settings",
    description: "Returns active provider, OpenRouter model configs, and local Ollama URL.",
    requestBody: null
  },
  {
    category: "Settings & System",
    method: "PUT",
    path: "/api/settings",
    summary: "Update Runtime Settings",
    description: "Dynamically updates provider choices, API keys, or models with zero server restarts.",
    requestBody: JSON.stringify({
      active_provider: "openrouter",
      openrouter_api_key: "sk-or-v1-KEY_HERE",
      openrouter_default_model: "anthropic/claude-3.5-sonnet"
    }, null, 2)
  },
  {
    category: "Settings & System",
    method: "GET",
    path: "/api/models",
    summary: "List Available Models",
    description: "Queries active local Ollama models and lists supported cloud models.",
    requestBody: null
  },
  {
    category: "Mem0 Long-Term Memory",
    method: "GET",
    path: "/api/memories",
    summary: "Get Stored User Memories",
    description: "Retrieves all Mem0 extracted user facts, role, and domain preferences.",
    requestBody: null
  },
  {
    category: "Mem0 Long-Term Memory",
    method: "DELETE",
    path: "/api/memories",
    summary: "Clear User Memories",
    description: "Resets and clears all long-term user memory facts.",
    requestBody: null
  },
  {
    category: "Logs & Ingestion",
    method: "GET",
    path: "/api/logs",
    summary: "Retrieve System Logs",
    description: "Returns the last N lines of system logs from app.log.",
    requestBody: null
  },
  {
    category: "Logs & Ingestion",
    method: "POST",
    path: "/api/ingest",
    summary: "Trigger Transcript Ingestion",
    description: "Triggers transcript indexing and vector embedding generation into ChromaDB.",
    requestBody: null
  }
];

export const ApiDashboardModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer' | 'swagger'
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0]);
  const [requestBodyText, setRequestBodyText] = useState(API_ENDPOINTS[0].requestBody || '');
  const [paramValues, setParamValues] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (selectedEndpoint) {
      setRequestBodyText(selectedEndpoint.requestBody || '');
      setTestResult(null);
      setParamValues({});
    }
  }, [selectedEndpoint]);

  if (!isOpen) return null;

  const handleParamChange = (name, value) => {
    setParamValues(prev => ({ ...prev, [name]: value }));
  };

  const executeApiCall = async () => {
    setIsExecuting(true);
    setTestResult(null);
    const startTime = performance.now();

    try {
      let resolvedPath = selectedEndpoint.path;
      if (selectedEndpoint.params) {
        selectedEndpoint.params.forEach(p => {
          const val = paramValues[p.name] || '';
          resolvedPath = resolvedPath.replace(`{${p.name}}`, val);
        });
      }

      const options = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (selectedEndpoint.method !== 'GET' && requestBodyText.trim()) {
        options.body = requestBodyText;
      }

      const res = await fetch(resolvedPath, options);
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      let data;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setTestResult({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        latency,
        data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
      });
    } catch (err) {
      setTestResult({
        status: 500,
        statusText: 'Client Error',
        ok: false,
        latency: 0,
        data: `Error executing API call: ${err.message}`
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getMethodBadgeStyle = (method) => {
    switch (method) {
      case 'GET': return { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'POST': return { background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' };
      case 'PUT': return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'DELETE': return { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default: return {};
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ width: '92vw', maxWidth: '1200px', height: '88vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
              <Server size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                REST & SSE API Dashboard
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>FastAPI v1.0.0</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Interactive OpenAPI & Swagger API endpoint explorer and live runner
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-subtle)' }}>
              <button
                style={{
                  padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, border: 'none', cursor: 'pointer',
                  background: activeTab === 'explorer' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === 'explorer' ? 'white' : 'var(--text-muted)'
                }}
                onClick={() => setActiveTab('explorer')}
              >
                Interactive Explorer
              </button>
              <button
                style={{
                  padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, border: 'none', cursor: 'pointer',
                  background: activeTab === 'swagger' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === 'swagger' ? 'white' : 'var(--text-muted)'
                }}
                onClick={() => setActiveTab('swagger')}
              >
                Native Swagger UI
              </button>
            </div>

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              title="Open Swagger UI in New Tab"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', width: 'auto' }}
            >
              <ExternalLink size={14} />
              Swagger Docs
            </a>

            <button className="icon-button" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'swagger' ? (
          <iframe 
            src="http://localhost:8000/docs" 
            title="FastAPI Swagger UI"
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
            {/* Sidebar Endpoint List */}
            <div style={{ borderRight: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', overflowY: 'auto', padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                API Endpoints ({API_ENDPOINTS.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {API_ENDPOINTS.map((ep, idx) => {
                  const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedEndpoint(ep)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ ...getMethodBadgeStyle(ep.method), fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                          {ep.method}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                          {ep.path}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ep.summary}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Endpoint Details & Tester */}
            <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px', gap: '20px' }}>
              {/* Endpoint Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ ...getMethodBadgeStyle(selectedEndpoint.method), fontSize: '0.85rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' }}>
                    {selectedEndpoint.method}
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-main)' }}>
                    {selectedEndpoint.path}
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#e0e7ff', marginTop: '4px' }}>
                  {selectedEndpoint.summary}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {selectedEndpoint.description}
                </p>
              </div>

              {/* Path Parameters if present */}
              {selectedEndpoint.params && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)' }}>Path Parameters:</label>
                  {selectedEndpoint.params.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--accent-primary)', minWidth: '100px' }}>{p.name}:</span>
                      <input
                        type="text"
                        placeholder={p.placeholder}
                        value={paramValues[p.name] || ''}
                        onChange={(e) => handleParamChange(p.name, e.target.value)}
                        style={{
                          flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)',
                          borderRadius: '6px', color: 'var(--text-main)', fontSize: '0.85rem', fontFamily: 'monospace'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Request Body Editor */}
              {selectedEndpoint.method !== 'GET' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)' }}>Request Body (JSON):</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>application/json</span>
                  </div>
                  <textarea
                    rows={6}
                    value={requestBodyText}
                    onChange={(e) => setRequestBodyText(e.target.value)}
                    style={{
                      width: '100%', padding: '12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)',
                      borderRadius: '8px', color: '#38bdf8', fontSize: '0.85rem', fontFamily: 'monospace', lineHeight: 1.5
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div>
                <button
                  className="send-btn"
                  onClick={executeApiCall}
                  disabled={isExecuting}
                  style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isExecuting ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
                  Execute Endpoint Request
                </button>
              </div>

              {/* Test Response Output */}
              {testResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', padding: '16px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {testResult.ok ? <CheckCircle2 size={16} style={{ color: '#10b981' }} /> : <AlertCircle size={16} style={{ color: '#f87171' }} />}
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: testResult.ok ? '#10b981' : '#f87171' }}>
                        Response Status: {testResult.status} {testResult.statusText}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Execution Latency: <strong>{testResult.latency} ms</strong>
                    </span>
                  </div>

                  <pre style={{ margin: 0, padding: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', color: '#a5b4fc', fontSize: '0.8rem', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '300px' }}>
                    {testResult.data}
                  </pre>
                </div>
              )}

              {/* Sample Response Schema */}
              {selectedEndpoint.sampleResponse && !testResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)' }}>Sample Response Payload:</label>
                  <pre style={{ margin: 0, padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace', overflowX: 'auto' }}>
                    {selectedEndpoint.sampleResponse}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
