import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('auto');
  const [settings, setSettings] = useState(null);
  const [modelsInfo, setModelsInfo] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch initial settings & models
  const refreshSettings = async () => {
    try {
      const [resSettings, resModels] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/models')
      ]);
      if (resSettings.ok) {
        const data = await resSettings.json();
        setSettings(data);
      }
      if (resModels.ok) {
        const data = await resModels.json();
        setModelsInfo(data);
      }
    } catch (e) {
      console.error('Error fetching settings/models:', e);
    }
  };

  // Fetch session list
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    }
  };

  // Load single session messages & artifacts
  const loadSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Extract all artifacts
        const allArts = [];
        (data.messages || []).forEach(m => {
          if (m.artifacts && m.artifacts.length > 0) {
            allArts.push(...m.artifacts);
          }
        });
        setArtifacts(allArts);
      }
    } catch (e) {
      console.error('Error loading session details:', e);
    }
  };

  useEffect(() => {
    refreshSettings();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadSession(activeSessionId);
    }
  }, [activeSessionId]);

  // Create new chat session
  const createNewSession = async () => {
    try {
      const provider = settings?.active_provider || 'ollama';
      const model = provider === 'openrouter' 
        ? settings?.openrouter?.default_model 
        : settings?.ollama?.default_model;

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Conversation',
          model_provider: provider,
          model_name: model
        })
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages([]);
        setArtifacts([]);
        setActiveArtifact(null);
      }
    } catch (e) {
      console.error('Error creating new session:', e);
    }
  };

  // Delete chat session
  const deleteSession = async (sessionId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          const remaining = sessions.filter(s => s.id !== sessionId);
          setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (e) {
      console.error('Error deleting session:', e);
    }
  };

  // Send message stream
  const sendMessage = async (text) => {
    if (!text.trim() || isStreaming) return;
    
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      await createNewSession();
      // wait a tiny tick for state updates
      await new Promise(r => setTimeout(r, 200));
    }

    // Optimistic User Message
    const tempUserMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    // Optimistic Assistant Message placeholder
    const tempAssistantMsg = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: '',
      skill_used: selectedSkill === 'auto' ? null : selectedSkill,
      artifacts: [],
      citations: [],
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId || activeSessionId,
          message: text,
          skill: selectedSkill === 'auto' ? null : selectedSkill
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.token) {
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: updated[lastIdx].content + data.token
                    };
                  }
                  return updated;
                });
              } else if (data.event === 'meta' || data.citations) {
                if (data.citations) {
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0) {
                      updated[lastIdx].citations = data.citations;
                      updated[lastIdx].skill_used = data.skill || updated[lastIdx].skill_used;
                    }
                    return updated;
                  });
                }
              } else if (data.type && data.content) {
                // Artifact event received
                const newArt = {
                  id: data.id || `art-${Date.now()}`,
                  type: data.type,
                  title: data.title,
                  content: data.content
                };
                setArtifacts(prev => [...prev, newArt]);
                setActiveArtifact(newArt);
              }
            } catch (err) {
              // Non-JSON line parsing
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
    } finally {
      setIsStreaming(false);
      fetchSessions();
    }
  };

  return (
    <ChatContext.Provider
      value={{
        sessions,
        activeSessionId,
        setActiveSessionId,
        messages,
        artifacts,
        activeArtifact,
        setActiveArtifact,
        isStreaming,
        selectedSkill,
        setSelectedSkill,
        settings,
        modelsInfo,
        isSettingsOpen,
        setIsSettingsOpen,
        createNewSession,
        deleteSession,
        sendMessage,
        refreshSettings
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
