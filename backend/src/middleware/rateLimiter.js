import rateLimit from 'express-rate-limit';

// Global limiter - applied to all routes
// Allows 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Login limiter - prevents brute force attacks
// Only 5 attempts per 15 minutes, skips successful logins
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Register limiter - prevents spam account creation
// Only 3 registrations per hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many accounts created from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Data limiter - for transaction/budget routes
// 30 requests per minute per IP
export const dataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// AI limiter - prevents abuse of AI/Groq API calls
// 20 requests per 15 minutes per IP
// NOTE: No custom keyGenerator here - caused IPv6 validation error
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});