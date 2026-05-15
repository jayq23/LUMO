import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      message: 'API is running',
      timestamp: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed' 
    });
  }
});

export default router;
