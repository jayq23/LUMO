import express from 'express';
import pool from '../db/pool.js';
import { authMiddleware, verifyOwnership } from '../middleware/authMiddleware.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { dataLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Protect all budget routes with auth and rate limiting
router.use(authMiddleware);
router.use(dataLimiter);

// Get all budgets for a user
router.get('/user/:userId', verifyOwnership, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Try with spent_amount column first
    try {
      const query = `
        SELECT id, category, limit_amount, COALESCE(spent_amount, 0) as spent_amount, month, year, created_at
        FROM budgets
        WHERE user_id = $1
        ORDER BY year DESC, month DESC
      `;
      const result = await pool.query(query, [req.user.id]);
      return res.json(result.rows);
    } catch (innerErr) {
      // If spent_amount column doesn't exist, use 0 as default
      if (innerErr.message.includes('spent_amount')) {
        console.warn(' Using fallback query without spent_amount column');
        const query = `
          SELECT id, category, limit_amount, 0 as spent_amount, month, year, created_at
          FROM budgets
          WHERE user_id = $1
          ORDER BY year DESC, month DESC
        `;
        const result = await pool.query(query, [req.user.id]);
        return res.json(result.rows);
      }
      throw innerErr;
    }
  } catch (err) {
    next(err);
  }
});

// Create budget
router.post('/', validateRequest(schemas.budget), verifyOwnership, async (req, res, next) => {
  try {
    const { category, limitAmount, month, year } = req.body;
    const userId = req.user.id;

    if (!category || !limitAmount || !month || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO budgets (user_id, category, limit_amount, month, year)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, category, limitAmount, month, year]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update budget
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limitAmount } = req.body;

    const query = `
      UPDATE budgets
      SET limit_amount = COALESCE($2, limit_amount),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [id, limitAmount, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete budget
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
