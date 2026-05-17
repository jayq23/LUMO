import { useState, useEffect } from 'react';
import { MessageCircle, Send, AlertCircle, Loader } from 'lucide-react';
import groq from '../api/groq.js';
import { apiClient } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import '../styles/ai-assistant.css';

export default function AIAssistant({ transactions = [] }) {
  const { user, isInitialized } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hello! I can help you understand your expenses. Ask me anything.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // Check if Groq API key is available on mount
  useEffect(() => {
    const available = groq.isAvailable();
    setIsAvailable(available);
    if (!available) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: '⚠️ Groq API key not configured. Add VITE_GROQ_API_KEY to your .env file. Get a free key from https://console.groq.com',
        isError: true,
      }]);
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isAvailable) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Debug: Check if token exists
      const token = localStorage.getItem('authToken');
      console.log('DEBUG: Token in storage?', !!token, 'Token:', token?.substring(0, 20) + '...');
      
      // First, get comprehensive system data from backend
      const systemDataResponse = await apiClient('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ question: input })
      });

      if (!systemDataResponse.success) {
        throw new Error(systemDataResponse.error || 'Failed to fetch system data');
      }

      // Get comprehensive data with all system info
      const { systemData } = systemDataResponse;

      // Get AI response with full context
      const result = await groq.askAboutExpenses(input, systemData.transactions, systemData.summary);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: result.success ? result.response : `Error: ${result.error}`,
        isError: !result.success,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: `Error: ${error.message}`,
        isError: true,
      };
      setMessages(prev => [...prev, botMessage]);
    }
    setLoading(false);
  };

  // Only show assistant when user is authenticated and auth is initialized
  if (!isInitialized || !user) {
    return null;
  }

  return (
    <div className="ai-assistant">
      {/* Floating Button - Hidden if disabled */}
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
            <button
              className="ai-close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
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

          {!isAvailable && (
            <div className="ai-footer">
              <div className="ai-warning">
                Gemini API key not configured - add VITE_GEMINI_API_KEY to .env file
              </div>
              <button
                className="ai-skip-btn"
                onClick={() => setDisabled(true)}
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
