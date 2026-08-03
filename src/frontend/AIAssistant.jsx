import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, AlertCircle, Loader } from 'lucide-react';
import groq from '../api/groq.js';
import { useAuth } from '../auth/AuthContext.jsx';
import '../styles/ai-assistant.css';
import { useTranslation } from "../utils/translations.js";
import { getLanguageCode } from "../utils/languageHelper.js";

// How many prior exchanges to send back to the backend as context.
// Keep in sync with MAX_HISTORY_TURNS on the server (backend/src/routes/ai.js).
const MAX_HISTORY_TURNS = 6;

export default function AIAssistant({ embedded = false }) {
  const { user, isInitialized, preferences } = useAuth();
  const currency = preferences.currency;
  const language = preferences.language;
  const langCode = getLanguageCode(language);
  const t = useTranslation(langCode);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`lumo:chat:${user?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setIsAvailable(true);
  }, []);

  // Auto-scroll to bottom whenever messages change or window opens
  useEffect(() => {
    if (!embedded && !isOpen) return;
    const rafId = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [messages, loading, isOpen, embedded]);

  // Save to localStorage per user
  useEffect(() => {
    try {
      if (user?.id) {
        localStorage.setItem(`lumo:chat:${user.id}`, JSON.stringify(messages));
      }
    } catch {
      // storage full or unavailable, ignore
    }
  }, [messages, user?.id]);

  // Load correct chat history when user changes
  useEffect(() => {
    if (!user?.id) return;
    try {
      const saved = localStorage.getItem(`lumo:chat:${user.id}`);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
  }, [user?.id]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`lumo:chat:${user?.id}`);
  };

  const buildHistoryPayload = (msgList) => {
    return msgList
      .filter(m => !m.isError)
      .map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))
      .slice(-MAX_HISTORY_TURNS * 2);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const history = buildHistoryPayload(messages);

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: input }]);
    setInput('');
    setLoading(true);

    try {
      const result = await groq.askAboutExpenses(input, currency, language, history);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: result.success ? result.response : `Error: ${result.error}`,
        isError: !result.success,
      }]);

      if (result.success) {
        window.dispatchEvent(new CustomEvent('lumo:refresh'));
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: `Error: ${error.message}`,
        isError: true,
      }]);
    }

    setLoading(false);
  };

  if (!isInitialized || !user) return null;

  return (
    <div className={`ai-assistant ${embedded ? 'embedded' : ''}`}>
      {!embedded && !disabled && (
        <button className="ai-button" onClick={() => setIsOpen(!isOpen)} title={t('ai.title')}>
          <MessageCircle size={24} />
        </button>
      )}

      {(embedded || isOpen) && !disabled && (
        <div className="ai-window">
          <div className="ai-header">
            <h3>{t('ai.lumotitle')}</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={clearChat} style={{ fontSize: '11px', opacity: 0.6, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                {t('ai.clear')}
              </button>
              {!embedded && (
                <button className="ai-close" onClick={() => setIsOpen(false)}>✕</button>
              )}
            </div>
          </div>

          <div className="ai-messages">
            {/* ⬇️ Greeting rendered LIVE, not stored in state — always fresh */}
            {messages.length === 0 && (
              <div className="ai-message bot">
                <span style={{ whiteSpace: 'pre-line' }}>{t('ai.initialMessage')}</span>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`ai-message ${msg.type} ${msg.isError ? 'error' : ''}`}>
                {msg.isError && <AlertCircle size={16} />}
                <span style={{ whiteSpace: 'pre-line' }}>{msg.text}</span>
              </div>
            ))}
            {loading && (
              <div className="ai-message bot loading">
                <Loader size={16} />
                <span>{t('ai.loading')}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="ai-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder={t('ai.askQuestion')}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!isAvailable || loading}
              className="ai-input"
            />
            <button type="submit" disabled={!isAvailable || loading || !input.trim()} className="ai-send">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}