import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import * as userModel from '../models/userModel.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Create user
    const user = await userModel.createUser(email, passwordHash, name);
    
    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user
    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user (without password)
    const { password_hash: _password_hash, ...userWithoutPassword } = user;
    const token = generateToken(user.id);
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken (by another user)
    if (email !== user.email) {
      const existingUser = await userModel.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await userModel.updateUser(userId, { name, email });
    const { password_hash: _password_hash, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await userModel.getUserByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(newPassword, salt);

    const updatedUser = await userModel.updateUser(userId, { password_hash: passwordHash });
    const { password_hash: _password_hash, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Password changed successfully',
      user: userWithoutPassword
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userModel.deleteUser(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Password reset ──────────────────────────────────────────────────────────

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await userModel.getUserByEmail(email);

    if (!user) {
      return res.json({
        message: 'If an account exists for that email, a reset link has been sent.'
      });
    }

    // Generate a random raw token — this is what gets emailed to the user
    // and put in the URL. We never store this raw value in the database.
    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await userModel.setResetToken(user.id, tokenHash, expiry);

    try {
      await sendPasswordResetEmail(user.email, rawToken);
    } catch (emailErr) {

      console.error('Failed to send password reset email:', emailErr.message);
    }

    res.json({
      message: 'If an account exists for that email, a reset link has been sent.'
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userModel.getUserByResetTokenHash(tokenHash);

    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(newPassword, salt);

    await userModel.updateUser(user.id, { password_hash: passwordHash });
    await userModel.clearResetToken(user.id);

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    next(err);
  }
};