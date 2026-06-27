// Groq AI Service — routes through secure backend
import { getLanguageCode } from '../utils/languageHelper.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const creatorKeywords = ['who created', 'who made', 'who built', 'who developed', 'creator', 'developer', 'author', 'made by', 'created by'];

const languageNames = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ru: 'Russian',
  ar: 'Arabic', pt: 'Portuguese', tl: 'Tagalog',
};

export const groq = {
  isAvailable: () => true,

  askAboutExpenses: async (question, _transactions = [], _summary = {}, _currency = 'PHP', language = 'English') => {
    // Creator check — no need to hit backend
    if (creatorKeywords.some(k => question.toLowerCase().includes(k))) {
      return { success: true, response: 'This expense tracker was created by Jay Sorreda.' };
    }

    try {
      const token = localStorage.getItem('authToken'); // ✅ same key as client.js
      const langCode = getLanguageCode(language);
      const targetLanguage = languageNames[langCode] || 'English';

      const response = await fetch(`${API_URL}/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ question, language: targetLanguage })
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