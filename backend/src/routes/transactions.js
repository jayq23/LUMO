import express from 'express';
import pool from '../db/pool.js';
import { authMiddleware, verifyOwnership } from '../middleware/authMiddleware.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { dataLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Protect all transaction routes with auth and rate limiting
router.use(authMiddleware);
router.use(dataLimiter);

// Get all transactions for a user
router.get('/user/:userId', verifyOwnership, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT id, category, amount, description, transaction_date, type, created_at
      FROM transactions
      WHERE user_id = $1
      ORDER BY transaction_date DESC
    `;
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Create transaction
router.post('/', validateRequest(schemas.transaction), verifyOwnership, async (req, res, next) => {
  try {
    const { category, amount, description, transactionDate, type } = req.body;
    const userId = req.user.id;

    if (!category || !amount || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO transactions (user_id, category, amount, description, transaction_date, type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, category, amount, description, transactionDate || new Date().toISOString().split('T')[0], type]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update transaction
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, amount, description, type } = req.body;

    const query = `
      UPDATE transactions
      SET category = COALESCE($2, category),
          amount = COALESCE($3, amount),
          description = COALESCE($4, description),
          type = COALESCE($5, type),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $6
      RETURNING *
    `;
    const result = await pool.query(query, [id, category, amount, description, type, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete transaction
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
