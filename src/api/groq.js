// Groq AI Service — routes through secure backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const creatorKeywords = ['who created', 'who made', 'who built', 'who developed', 'creator', 'developer', 'author', 'made by', 'created by'];

export const groq = {
  isAvailable: () => true,

  //default language is English, default currency is USD
  // history: array of { role: 'user' | 'assistant', content: string } — prior
  // turns in the conversation, oldest first, NOT including the new `question`.
  askAboutExpenses: async (question, currency = 'USD', language = 'English', history = []) => {
    // Creator check — no need to hit backend
    if (creatorKeywords.some(k => question.toLowerCase().includes(k))) {
      return { success: true, response: 'This expense tracker was created by Jay Sorreda.' };
    }

    try {
      const token = localStorage.getItem('authToken'); // same key as client.js

      const response = await fetch(`${API_URL}/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ question, currency, language, history })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');

      return { success: true, response: data.response };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

export default groq;