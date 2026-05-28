import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import pool from '../db/pool.js';

const router = express.Router();

// POST /api/ai/ask - Ask AI a question about expenses with full system context
router.post('/ask', aiLimiter, authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.id;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (question.length > 500) {
      return res.status(400).json({ error: 'Question too long (max 500 characters)' });
    }

    console.log('DEBUG AI endpoint: Processing question for userId:', userId);

    // Get comprehensive data from the system
    
    // 1. User profile
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    
    if (!user) {
      console.error('DEBUG: User not found for userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. All transactions
    const transactionsResult = await pool.query(
      'SELECT id, category, amount, type, description, transaction_date FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC',
      [userId]
    );
    const transactions = transactionsResult.rows || [];

    // 3. All budgets
    let budgets = [];
    try {
      const budgetsResult = await pool.query(
        `SELECT id, category, limit_amount, 
                COALESCE(spent_amount, 0) as spent_amount, 
                month, year FROM budgets WHERE user_id = $1 ORDER BY year DESC, month DESC`,
        [userId]
      );
      budgets = budgetsResult.rows || [];
    } catch (budgetErr) {
      // If spent_amount column doesn't exist, try without it
      console.warn('⚠️  Budget query failed, trying alternate schema:', budgetErr.message);
      try {
        const budgetsResult = await pool.query(
          'SELECT id, category, limit_amount, 0 as spent_amount, month, year FROM budgets WHERE user_id = $1 ORDER BY year DESC, month DESC',
          [userId]
        );
        budgets = budgetsResult.rows || [];
      } catch (err2) {
        console.warn('⚠️  Budgets table not accessible:', err2.message);
        budgets = [];
      }
    }

    // 4. Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const netBalance = totalIncome - totalExpenses;

    // 5. Calculate category breakdown
    const categoryBreakdown = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + parseFloat(t.amount);
      });

    // 6. Budget status
    const budgetStatus = budgets.map(b => ({
      category: b.category,
      limit: parseFloat(b.limit_amount),
      spent: parseFloat(b.spent_amount),
      remaining: parseFloat(b.limit_amount) - parseFloat(b.spent_amount),
      percentUsed: ((parseFloat(b.spent_amount) / parseFloat(b.limit_amount)) * 100).toFixed(2)
    }));

    console.log('DEBUG AI endpoint: Retrieved data for user', {
      transactionCount: transactions.length,
      budgetCount: budgets.length,
      totalExpenses
    });

    // Return comprehensive system data for AI context
    res.json({
      success: true,
      systemData: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        transactions,
        budgets: budgetStatus,
        summary: {
          totalIncome,
          totalExpenses,
          netBalance,
          transactionCount: transactions.length,
          categoryBreakdown,
          activeBudgets: budgets.length
        }
      },
      message: 'System data retrieved for AI analysis'
    });
  } catch (error) {
    console.error('AI endpoint error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to process AI request', details: error.message });
  }
});

export default router;
