import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import pool from '../db/pool.js';
import { getLanguageCode } from '../utils/languageHelper.js';
import { getCurrencySymbol } from '../utils/currencyHelper.js';

const router = express.Router();
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
// ─── Tool definitions ─────────────────────────────────────────────────────────
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_financial_summary',
      description: 'Get the user financial summary — income, expenses, balance, category breakdown, and budget status',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: 'Add a new transaction (expense or income) for the user',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['food', 'transport', 'shopping', 'subscriptions', 'health', 'utilities', 'other', 'salary', 'freelance', 'investments', 'gifts'],
          },
          amount: { type: 'number', description: 'Amount in the user currency' },
          description: { type: 'string', description: 'Short description of the transaction' },
          type: { type: 'string', enum: ['expense', 'income'] },
          transaction_date: { type: 'string', description: 'Date in YYYY-MM-DD format, default to today' }
        },
        required: ['category', 'amount', 'type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_budget',
      description: 'Create a new budget limit for a specific category',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['food', 'transport', 'shopping', 'subscriptions', 'health', 'utilities', 'other']
          },
          limit_amount: { type: 'number', description: 'Budget limit amount' },
          month: { type: 'number', description: 'Month number (1-12)' },
          year: { type: 'number', description: 'Year e.g. 2026' }
        },
        required: ['category', 'limit_amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_transactions',
      description: 'Get list of transactions, optionally filtered by type or category',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['expense', 'income', 'all'] },
          category: { type: 'string', description: 'Filter by category (optional)' },
          limit: { type: 'number', description: 'Max number of transactions to return, default 10' }
        }
      }
    }
  }
];

// ─── Tool executor ─────────────────────────────────────────────────────────────
async function executeTool(toolName, args, userId) {
  if (toolName === 'get_financial_summary') {
    const txResult = await pool.query(
      'SELECT category, amount, type, description, transaction_date FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC',
      [userId]
    );
    const transactions = txResult.rows;

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

    const categoryBreakdown = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + parseFloat(t.amount);
    });

    let budgets = [];
    try {
      const budgetResult = await pool.query(
        'SELECT category, limit_amount, COALESCE(spent_amount, 0) as spent_amount FROM budgets WHERE user_id = $1',
        [userId]
      );
      budgets = budgetResult.rows.map(b => ({
        category: b.category,
        limit: parseFloat(b.limit_amount),
        spent: parseFloat(b.spent_amount),
        remaining: parseFloat(b.limit_amount) - parseFloat(b.spent_amount),
        percentUsed: ((parseFloat(b.spent_amount) / parseFloat(b.limit_amount)) * 100).toFixed(0) + '%'
      }));
    } catch { budgets = []; }

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      categoryBreakdown,
      budgets
    };
  }

  if (toolName === 'add_transaction') {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      'INSERT INTO transactions (user_id, category, amount, type, description, transaction_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, args.category, args.amount, args.type, args.description || '', args.transaction_date || today]
    );
    return { success: true, transaction: result.rows[0] };
  }

  if (toolName === 'create_budget') {
    const now = new Date();
    const result = await pool.query(
      'INSERT INTO budgets (user_id, category, limit_amount, month, year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, args.category, args.limit_amount, args.month || (now.getMonth() + 1), args.year || now.getFullYear()]
    );
    return { success: true, budget: result.rows[0] };
  }

  if (toolName === 'list_transactions') {
    let query = 'SELECT category, amount, type, description, transaction_date FROM transactions WHERE user_id = $1';
    const params = [userId];

    if (args.type && args.type !== 'all') {
      params.push(args.type);
      query += ` AND type = $${params.length}`;
    }
    if (args.category) {
      params.push(args.category);
      query += ` AND category = $${params.length}`;
    }

    query += ` ORDER BY transaction_date DESC LIMIT $${params.length + 1}`;
    params.push(args.limit || 10);

    const result = await pool.query(query, params);
    return result.rows;
  }

  return { error: 'Unknown tool' };
}

// ─── POST /api/ai/ask — Full agentic loop ─────────────────────────────────────
router.post('/ask', aiLimiter, authMiddleware, async (req, res) => {
  try {
    const { question, currency: rawCurrency, language: rawLanguage } = req.body;
    const userId = req.user.id;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }
    if (question.length > 500) {
      return res.status(400).json({ error: 'Question too long (max 500 characters)' });
    }
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
    }

    // currency/language live in localStorage on the frontend (no DB column
    // for these yet), so they come from the request body — default safely
    // if missing/malformed instead of trusting the client blindly
    const currency = rawCurrency || 'PHP';
    const language = rawLanguage || 'English';
    const currencySymbol = getCurrencySymbol(currency);

    // Creator check
    const creatorKeywords = ['who created', 'who made', 'who built', 'creator', 'developer', 'made by', 'created by'];
    if (creatorKeywords.some(k => question.toLowerCase().includes(k))) {
      return res.json({ success: true, response: 'This expense tracker was created by Jay Sorreda.' });
    }

    // Finance topic guard — hard filter, doesn't rely on the model's discretion
    const financeKeywords = [
      'budget', 'expense', 'income', 'transaction', 'spend', 'spent', 'save', 'saving',
      'money', 'finance', 'financial', 'salary', 'cost', 'price', 'balance', 'pay',
      'debt', 'invest', 'investment', 'allowance', 'freelance', 'gift', 'category',
      'summary', 'report', 'how much', 'total', 'food', 'transport', 'shopping',
      'subscription', 'utilities', 'health'
    ];
    const isFinanceRelated = financeKeywords.some(k => question.toLowerCase().includes(k));

    if (!isFinanceRelated) {
      return res.json({
        success: true,
        response: 'I can only help with finance and budgeting questions! Ask me about your expenses, budget, or financial goals instead.'
      });
    }

    // Agentic loop
    const messages = [
      {
        role: 'system',
        content: `You are Lumo AI, a finance assistant. You ONLY discuss personal finance, budgeting, expenses, income, savings, and money management.

    CRITICAL RULE: If the user's question is NOT about finance, budgeting, or their transactions (examples of off-topic: love, relationships, general trivia, coding, philosophy, etc), you MUST NOT answer it at all. Instead respond with EXACTLY this sentence and nothing else: "I can only help with finance and budgeting questions! Ask me about your expenses, budget, or financial goals instead."

    Do not explain the off-topic concept first before declining. Do not be polite-but-still-answer. Refuse immediately and completely.

    For finance-related questions only:
    - You can answer questions AND take actions (add transactions, create budgets, check summaries).
    - Always respond in ${language}.
    - The user's currency is ${currency} (symbol: ${currencySymbol}). Always show monetary amounts using this symbol, never assume a different currency.
    - Be concise and professional.
    - No markdown symbols or bullet points.`
      },
      { role: 'user', content: question }
    ];

    let finalResponse = '';
    const MAX_ITERATIONS = 5; // guardrail — prevent infinite loop
    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const groqResponse = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          tools,
          tool_choice: 'auto',
          max_tokens: 500,
        }),
      });

      if (!groqResponse.ok) {
        const err = await groqResponse.json();
        throw new Error(err.error?.message || 'Groq request failed');
      }

      const data = await groqResponse.json();
      const msg = data.choices[0].message;
      messages.push(msg);

      // No tool calls — AI is done, this is the final answer
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        finalResponse = msg.content;
        break;
      }

      // Execute all tool calls AI requested
      for (const toolCall of msg.tool_calls) {
        let args;
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = {};
        }
        console.log(`AI calling tool: ${toolCall.function.name}`, args);

        const result = await executeTool(toolCall.function.name, args, userId);

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }
      // Loop continues — AI will decide kung kailangan pa ng another tool or final na
    }

    res.json({ success: true, response: finalResponse });

  } catch (error) {
    console.error('AI ask error:', error.message);
    res.status(500).json({ error: 'Failed to process AI request', details: error.message });
  }
});

// ─── POST /api/ai/categorize (existing, unchanged) ────────────────────────────
router.post('/categorize', aiLimiter, authMiddleware, async (req, res) => {
  try {
    const { description, type } = req.body;

    if (!description || description.trim().length < 3) {
      return res.status(400).json({ error: 'Description required (min 3 chars)' });
    }
    if (type === 'income') {
      return res.status(400).json({ error: 'Categorization only for expenses' });
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: `Categorize this expense: "${description.trim()}"` }],
        tools: [{
          type: 'function',
          function: {
            name: 'categorize_transaction',
            description: 'Assign category to expense',
            parameters: {
              type: 'object',
              properties: {
                category: { type: 'string', enum: ['food', 'transport', 'shopping', 'subscriptions', 'health', 'utilities', 'other'] },
                confidence: { type: 'number' }
              },
              required: ['category', 'confidence']
            }
          }
        }],
        tool_choice: 'auto',
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) return res.json({ success: false });

    const args = JSON.parse(toolCall.function.arguments);
    res.json({ success: true, category: args.category, confidence: args.confidence });

  } catch (error) {
    res.status(500).json({ error: 'Failed to categorize', details: error.message });
  }
});

export default router;