import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import errorHandler from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import aiRoutes from './routes/ai.js';
import oauthRoutes from './routes/oauth.js';
import helmet from 'helmet';
import { initializeFirebase } from './controllers/oauthController.js';
import initializeDatabase from './db/auto-migrate.js';

dotenv.config();
initializeFirebase();

const app = express();
const PORT = process.env.PORT || 5000;

// Parse allowed origins from env (comma-separated)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Render health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(helmet());

// Trust proxy - required for Render/Heroku behind reverse proxy
// This allows express-rate-limit to correctly identify client IPs
app.set('trust proxy', 1);

// Temporary debug — remove after fix
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path} | Origin: ${req.headers.origin}`);
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes BEFORE rate limiter
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter); // Rate limiter after CORS/preflight handling

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling (must be last)
app.use(errorHandler);

// Start server with database initialization
async function startServer() {
  try {
    // Initialize database on startup
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
