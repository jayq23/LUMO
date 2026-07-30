import pool from '../db/pool.js';
export const createUser = async (email, passwordHash, name) => {
  const query = `
    INSERT INTO users (email, password_hash, name)
    VALUES ($1, $2, $3)
    RETURNING id, email, name, created_at
  `;
  const result = await pool.query(query, [email, passwordHash, name]);
  return result.rows[0];
};
export const createOAuthUser = async (email, name, provider, providerUid) => {
  const query = `
    INSERT INTO users (email, name, oauth_provider, oauth_uid)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, name, created_at
  `;
  const result = await pool.query(query, [email, name, provider, providerUid]);
  return result.rows[0];
};
export const getUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
};
export const getUserById = async (id) => {
  const query = 'SELECT id, email, name, created_at FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};
export const getUserByIdWithPassword = async (id) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};
export const updateUser = async (id, updates) => {
  const { name, email, password_hash } = updates;
  
  if (password_hash) {
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, name, created_at
    `;
    const result = await pool.query(query, [password_hash, id]);
    return result.rows[0];
  }
  
  if (name && email) {
    const query = `
      UPDATE users 
      SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, name, created_at
    `;
    const result = await pool.query(query, [name, email, id]);
    return result.rows[0];
  }
  
  if (name) {
    const query = `
      UPDATE users 
      SET name = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, name, created_at
    `;
    const result = await pool.query(query, [name, id]);
    return result.rows[0];
  }
  
  if (email) {
    const query = `
      UPDATE users 
      SET email = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, name, created_at
    `;
    const result = await pool.query(query, [email, id]);
    return result.rows[0];
  }
  return await getUserById(id);
};
export const deleteUser = async (id) => {
  const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// ── Password reset ──────────────────────────────────────────────────────────
export const setResetToken = async (userId, tokenHash, expiry) => {
  const result = await pool.query(query, [tokenHash, expiry, userId]);
  return result.rows[0];
};

// Look up a user by their hashed reset token, only if it hasn't expired yet.
export const getUserByResetTokenHash = async (tokenHash) => {
  const query = `
    SELECT * FROM users
    WHERE reset_token = $1 AND reset_token_expiry > NOW()
  `;
  const result = await pool.query(query, [tokenHash]);
  return result.rows[0];
};

// Clear the reset token after it's been used (or to invalidate it early).
export const clearResetToken = async (userId) => {
  const query = `
    UPDATE users
    SET reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `;
  await pool.query(query, [userId]);
};