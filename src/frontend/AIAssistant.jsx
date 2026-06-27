import { useState, useEffect } from 'react';
import { MessageCircle, Send, AlertCircle, Loader } from 'lucide-react';
import groq from '../api/groq.js';
import { useAuth } from '../auth/AuthContext.jsx';
import '../styles/ai-assistant.css';

const INITIAL_MESSAGE = {
  id: 1,
  type: 'bot',
  text: 'Hello! I can help you understand your expenses. Ask me anything.',
};

export default function AIAssistant({ transactions = [] }) {
  const { user, isInitialized, preferences } = useAuth();
  const currency = preferences.currency;
  const language = preferences.language;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`lumo:chat:${user?.id}`);
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setIsAvailable(true);
  }, []);

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
      setMessages(saved ? JSON.parse(saved) : [INITIAL_MESSAGE]);
    } catch {
      setMessages([INITIAL_MESSAGE]);
    }
  }, [user?.id]);

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem(`lumo:chat:${user?.id}`);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: input }]);
    setInput('');
    setLoading(true);

    try {
      const result = await groq.askAboutExpenses(input, [], {}, currency, language);
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
    <div className="ai-assistant">
      {/* Floating Button */}
      {!disabled && (
        <button
          className="ai-button"
          onClick={() => setIsOpen(!isOpen)}
          title="AI Assistant"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && !disabled && (
        <div className="ai-window">
          <div className="ai-header">
            <h3>LUMO Assistant</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={clearChat}
                style={{ fontSize: '11px', opacity: 0.6, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                Clear
              </button>
              <button className="ai-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          <div className="ai-messages">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`ai-message ${msg.type} ${msg.isError ? 'error' : ''}`}
              >
                {msg.isError && <AlertCircle size={16} />}
                <span>{msg.text}</span>
              </div>
            ))}
            {loading && (
              <div className="ai-message bot loading">
                <Loader size={16} />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          <form className="ai-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Ask about your expenses..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!isAvailable || loading}
              className="ai-input"
            />
            <button
              type="submit"
              disabled={!isAvailable || loading || !input.trim()}
              className="ai-send"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}