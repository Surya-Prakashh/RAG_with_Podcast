import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '../context/ChatContext';
import { Sparkles, User, BookOpen, Feather, Layout, Quote, ShieldCheck } from 'lucide-react';

export const MessageItem = ({ message }) => {
  const { setActiveArtifact, artifacts } = useChat();
  const isUser = message.role === 'user';

  // Parse citations from metadata if stringified
  let citations = message.citations || [];
  if (!citations.length && message.metadata_json) {
    try {
      const parsed = JSON.parse(message.metadata_json);
      if (parsed.citations) citations = parsed.citations;
    } catch (e) {}
  }

  // Find associated artifact if exists
  const associatedArtifact = (message.artifacts && message.artifacts.length > 0)
    ? message.artifacts[0]
    : artifacts.find(a => message.content && message.content.includes(a.title));

  const getSkillLabel = (skill) => {
    switch (skill) {
      case 'guardrail':
        return { label: 'Guardrail Intercepted', icon: <ShieldCheck size={12} style={{ color: '#f87171' }} /> };
      case 'ship30for30':
        return { label: 'Ship30for30 Essay', icon: <Feather size={12} /> };
      case 'artifact':
        return { label: 'Artifact Generated', icon: <Layout size={12} /> };
      case 'qa':
        return { label: 'Podcast Q&A Citation', icon: <BookOpen size={12} /> };
      default:
        return null;
    }
  };

  const skillInfo = getSkillLabel(message.skill_used);

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className={`avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>

      <div className="message-content-wrapper">
        {!isUser && skillInfo && (
          <div className="skill-badge" style={message.skill_used === 'guardrail' ? { background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' } : {}}>
            {skillInfo.icon}
            <span>{skillInfo.label}</span>
          </div>
        )}

        <div className="message-card">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Citations section */}
        {!isUser && citations.length > 0 && (
          <div className="citation-container">
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', width: '100%', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Quote size={11} /> podcast groundings:
            </span>
            {citations.map((c, idx) => (
              <div key={idx} className="citation-chip">
                <BookOpen size={11} style={{ color: 'var(--accent-primary)' }} />
                <span>{c.guest || 'Lenny Guest'} — <em>{c.episode || 'Lenny\'s Podcast'}</em></span>
              </div>
            ))}
          </div>
        )}

        {/* Artifact Trigger Button */}
        {associatedArtifact && (
          <button
            className="artifact-trigger-btn"
            onClick={() => setActiveArtifact(associatedArtifact)}
          >
            <Layout size={14} />
            <span>Open Artifact ({associatedArtifact.type.toUpperCase()}) — {associatedArtifact.title}</span>
          </button>
        )}
      </div>
    </div>
  );
};
