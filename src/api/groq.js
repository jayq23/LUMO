// Groq AI Service for expense insights
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const groq = {
  // Check if API key is configured
  isAvailable: () => {
    return !!GROQ_API_KEY;
  },

  // Get AI response for expense questions
  askAboutExpenses: async (question, transactions = [], summary = {}) => {
    if (!GROQ_API_KEY) {
      return {
        success: false,
        error: 'Groq API key not configured. Add VITE_GROQ_API_KEY to .env',
      };
    }

    // Check if user is asking about the creator
    const creatorKeywords = ['who created', 'who made', 'who built', 'who developed', 'creator', 'developer', 'author', 'made by', 'created by'];
    const questionLower = question.toLowerCase();
    if (creatorKeywords.some(keyword => questionLower.includes(keyword))) {
      return {
        success: true,
        response: 'This expense tracker was created by Jay Sorreda.',
      };
    }

    try {
      // Build comprehensive context from transactions and summary
      let context = 'User Financial Summary:\n';
      
      if (summary && Object.keys(summary).length > 0) {
        context += `- Total Income: $${summary.totalIncome?.toFixed(2) || 0}\n`;
        context += `- Total Expenses: $${summary.totalExpenses?.toFixed(2) || 0}\n`;
        context += `- Net Balance: $${summary.netBalance?.toFixed(2) || 0}\n`;
        context += `- Total Transactions: ${summary.transactionCount || 0}\n`;
        
        if (summary.categoryBreakdown && Object.keys(summary.categoryBreakdown).length > 0) {
          context += '\nExpense by Category:\n';
          Object.entries(summary.categoryBreakdown).forEach(([category, amount]) => {
            context += `- ${category}: $${parseFloat(amount).toFixed(2)}\n`;
          });
        }
      }

      context += '\nRecent Transactions:\n';
      transactions.slice(0, 20).forEach(t => {
        context += `- ${t.category}: $${parseFloat(t.amount).toFixed(2)} (${t.type}) - ${t.date}\n`;
      });

      const prompt = `${context}\nQuestion: ${question}\n\nRespond in 1-2 sentences. Use perfect grammar. No markdown symbols, bullet points, or asterisks. Be direct and straight to the point. Keep it brief.`;

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get response from Groq');
      }

      const data = await response.json();
      return {
        success: true,
        response: data.choices[0].message.content.trim(),
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }
  },
};

export default groq;
