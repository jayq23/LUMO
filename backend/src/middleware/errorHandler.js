export const errorHandler = (err, req, res) => {
  console.error('Error:', err);

  if (err.code === '23505') {
    // Unique constraint violation
    return res.status(400).json({ error: 'Duplicate entry' });
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    return res.status(400).json({ error: 'Invalid reference' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
};

export default errorHandler;
