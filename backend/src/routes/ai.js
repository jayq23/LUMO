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
      description: 'Get the user financial summary — income, expenses, balance, category breakdown, and budget status. Can be scoped to a specific month/year, or left blank for all-time totals.',
      parameters: {
        type: 'object',
        properties: {
          month: { 
            type: 'number', 
            description: 'Month number 1-12. MUST be a raw integer number, NOT a string. Omit for all-time summary.' 
        },
          year: { 
            type: 'number', 
            description: 'Year e.g. 2026. MUST be a raw integer number, NOT a string. Required if month is given; omit both for all-time summary.' 
        }
        }
      }
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
      description: 'Get list of transactions, optionally filtered by type, category, or a specific month/year',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['expense', 'income', 'all'] },
          category: { type: 'string', description: 'Filter by category (optional)' },
          month: { type: 'number', description: 'Month number 1-12 (optional)' },
          year: { type: 'number', description: 'Year e.g. 2026 (optional, pair with month)' },
          limit: { type: 'number', description: 'Max number of transactions to return, default 10' }
        }
      }
    }
  }
];

// ─── Tool executor ─────────────────────────────────────────────────────────────
async function executeTool(toolName, args, userId) {
  if (toolName === 'get_financial_summary') {
    const params = [userId];
    let dateFilter = '';

    // Scope to a specific month/year if the AI provided one
    if (args.month && args.year) {
      params.push(args.month, args.year);
      dateFilter = ` AND EXTRACT(MONTH FROM transaction_date) = $${params.length - 1} AND EXTRACT(YEAR FROM transaction_date) = $${params.length}`;
    } else if (args.year) {
      params.push(args.year);
      dateFilter = ` AND EXTRACT(YEAR FROM transaction_date) = $${params.length}`;
    }

    const txResult = await pool.query(
      `SELECT category, amount, type, description, transaction_date
       FROM transactions
       WHERE user_id = $1${dateFilter}
       ORDER BY transaction_date DESC`,
      params
    );
    const transactions = txResult.rows;

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

    const categoryBreakdown = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + parseFloat(t.amount);
    });

    // Budgets are only meaningful for the month/year being asked about.
    // Default to the current month/year if none was specified.
    const now = new Date();
    const budgetMonth = args.month || now.getMonth() + 1;
    const budgetYear = args.year || now.getFullYear();

    let budgets = [];
    try {
      const budgetResult = await pool.query(
        'SELECT category, limit_amount, COALESCE(spent_amount, 0) as spent_amount FROM budgets WHERE user_id = $1 AND month = $2 AND year = $3',
        [userId, budgetMonth, budgetYear]
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
      scope: args.month && args.year ? `${args.month}/${args.year}` : (args.year ? `year ${args.year}` : 'all-time'),
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
    if (args.month && args.year) {
      params.push(args.month);
      query += ` AND EXTRACT(MONTH FROM transaction_date) = $${params.length}`;
      params.push(args.year);
      query += ` AND EXTRACT(YEAR FROM transaction_date) = $${params.length}`;
    } else if (args.year) {
      params.push(args.year);
      query += ` AND EXTRACT(YEAR FROM transaction_date) = $${params.length}`;
    }

    query += ` ORDER BY transaction_date DESC LIMIT $${params.length + 1}`;
    params.push(args.limit || 10);

    const result = await pool.query(query, params);
    return result.rows;
  }

  return { error: 'Unknown tool' };
}

// ─── Formatting safety net ─────────────────────────────────────────────────────
function formatBreakdownText(text) {
  if (!text || typeof text !== 'string' || text.includes('\n')) return text;

  const pairPattern = /([A-Za-z][A-Za-z\s]{0,25}?):\s*([₱$€£¥]?[\d,]+(?:\.\d{1,2})?%?)/g;
  const matches = [...text.matchAll(pairPattern)];

  // Need at least 2 "Label: amount" pairs to treat this as a breakdown
  // worth reformatting — a single colon (e.g. a stray "Note:") isn't enough.
  if (matches.length < 2) return text;

  const headline = text.slice(0, matches[0].index).trim();
  // Safety net: if the model still slips and gives a bare, unlabeled number
  // as the headline (e.g. "2650" with no words), label it instead of
  // showing a naked figure.
  const bareNumberPattern = /^[₱$€£¥]?[\d,]+(?:\.\d{1,2})?$/;
  const labeledHeadline = bareNumberPattern.test(headline) ? `Total: ${headline}` : headline;
  const lines = matches.map(m => `${m[1].trim()}: ${m[2].trim()}`);

  return [labeledHeadline, '', ...lines].filter(Boolean).join('\n');
}

// ─── POST /api/ai/ask — Full agentic loop ─────────────────────────────────────
router.post('/ask', aiLimiter, authMiddleware, async (req, res) => {
  try {
    const { question, currency: rawCurrency, language: rawLanguage, history: rawHistory } = req.body;
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

    // Conversation history from the frontend — only keep plain user/assistant
    // text turns (never trust tool_calls/tool results from the client) and
    // cap it so the payload/context doesn't grow unbounded.
    const MAX_HISTORY_TURNS = 6; // last 6 exchanges (~12 messages)
    let history = [];
    if (Array.isArray(rawHistory)) {
      history = rawHistory
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-MAX_HISTORY_TURNS * 2)
        .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));
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

    // Agentic loop
    const now = new Date();
    const messages = [
      {
        role: 'system',
        content: `You are Lumo AI, a finance assistant. You ONLY discuss personal finance, budgeting, expenses, income, savings, and money management and also you can answer summary questions about their finances.

    The user may ask their question in ANY language (English, Filipino, German, or anything else) — understand it regardless of language.

    CRITICAL RULE: If the user's question is NOT about finance, budgeting, or their transactions (examples of off-topic: love, relationships, general trivia, coding, philosophy, etc), you MUST NOT answer it at all. Instead respond with this message translated into ${language}, and nothing else: "I can only help with finance and budgeting questions! Ask me about your expenses, budget, or financial goals instead."

    Do not explain the off-topic concept first before declining. Do not be polite-but-still-answer. Refuse immediately and completely.

    For finance-related questions only:
    - You can answer questions AND take actions (add transactions, create budgets, check summaries).
    - Today's date is ${now.toISOString().split('T')[0]}. When the user names a specific month (e.g. "June", "last month", "Hunyo", "Juni"), figure out the correct month number and year and pass them to get_financial_summary or list_transactions. If no month is mentioned, omit month/year for an all-time view.
    - Always respond in ${language}, regardless of what language the question was asked in.
    - The user's currency is ${currency} (symbol: ${currencySymbol}). Always show monetary amounts using this symbol, never assume a different currency.
    - Be concise and professional.
    - Format your answer for readability: the first line must be a complete, labeled sentence stating the headline number with its currency symbol — for example "Total spent: ₱2650" or "You spent a total of ₱2650 in June." Never output the headline as a bare number with no label (e.g. just "2650" is wrong). After the headline, add a blank line, then each category or item on its own line like "Food: ₱280". Use a real newline character between each line, not commas in one sentence.
    - Do not use markdown symbols like **, #, -, or * for formatting — use plain line breaks only, since the chat UI renders plain text.`
      },
      ...history,
      { role: 'user', content: question }
    ];

    let finalResponse = '';
    const MAX_ITERATIONS = 5; // guardrail — prevent infinite loop
    let iterations = 0;
    let retriedMalformedCall = false;

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
        const errMessage = err.error?.message || 'Groq request failed';

        // Groq occasionally produces a malformed function call (bad JSON /
        // schema mismatch) — this is model flakiness, not a real failure.
        // Retry once with the same messages before giving up gracefully.
        const isMalformedToolCall = errMessage.toLowerCase().includes('failed to call a function');
        if (isMalformedToolCall && !retriedMalformedCall) {
          retriedMalformedCall = true;
          iterations--; // don't count the retry against MAX_ITERATIONS
          continue;
        }
        if (isMalformedToolCall) {
          // Retry also failed — respond nicely instead of a hard 500.
          finalResponse = 'Sorry, I had trouble understanding that one — could you rephrase your question?';
          break;
        }

        throw new Error(errMessage);
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
        // JSON.parse('null') resolves to null (not an error), and
        // JSON.parse('[]') resolves to an array — neither is a usable args
        // object, so guard against both before executeTool touches args.xxx
        if (!args || typeof args !== 'object' || Array.isArray(args)) {
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

    res.json({ success: true, response: formatBreakdownText(finalResponse) });

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