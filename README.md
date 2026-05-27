# 💰 Expense Tracker

A full-stack expense tracking application with advanced features including budgeting, analytics, AI insights, and multi-provider authentication.

## ✨ Features

### Authentication
- Email/Password registration & login
- Google OAuth 2.0
- Facebook OAuth 2.0
- JWT-based session management

### Core Features
- 📊 **Dashboard** - Quick overview of your finances
- 💸 **Transactions** - Track income and expenses with categories
- 💼 **Budgets** - Set and monitor budget limits
- 📈 **Reports** - Analytics and spending insights
- ⚙️ **Settings** - Profile management and preferences
- 🌙 **Dark Mode** - Eye-friendly dark theme
- 🌍 **Multi-language** - Support for multiple languages

### AI Features
- 🤖 AI Assistant powered by Groq
- Smart expense categorization
- Spending insights and recommendations

---

## 🚀 Deployment

Your app is **production-ready** and configured for:
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** PostgreSQL (Render)
- **Authentication:** Firebase

### Quick Deploy

1. **Read:** [PRODUCTION_READY.md](PRODUCTION_READY.md) - Overview of what's prepared
2. **Follow:** [VERCEL_RENDER_SETUP.md](VERCEL_RENDER_SETUP.md) - Step-by-step deployment guide
3. **Reference:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed checklist

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Frontend Setup
```bash
# Install dependencies
npm install

# Create .env file (use .env.example as template)
cp .env.example .env

# Update .env with your Firebase credentials
# VITE_API_URL=http://localhost:5000/api
# VITE_FIREBASE_API_KEY=...

# Start development server
npm run dev
# Opens at http://localhost:5173
```

### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file (use .env.example as template)
cp .env.example .env

# Update .env with database credentials
# DATABASE_URL=postgresql://postgres:password@localhost:5432/expensetracker
# JWT_SECRET=your_secret_key_here

# Start PostgreSQL
# (on Mac: brew services start postgresql)

# Initialize database
node migrate.js

# Start backend server
npm run dev
# Runs on http://localhost:5000
```

### Test Everything
```bash
# Test backend API
curl http://localhost:5000/api/health

# Test frontend (should load at localhost:5173)
# Click "Continue with Google" or "Continue with Facebook"
```

---

## 📁 Project Structure

```
.
├── frontend (Vite + React)
│   ├── src/
│   │   ├── auth/               # Authentication
│   │   ├── frontend/           # Page components
│   │   ├── api/                # API client
│   │   ├── styles/             # CSS files
│   │   └── utils/              # Helper functions
│   ├── .env.example            # Environment template
│   └── vercel.json             # Vercel config
│
├── backend (Express + PostgreSQL)
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API routes
│   │   ├── models/             # Database models
│   │   ├── middleware/         # Express middleware
│   │   └── db/                 # Database scripts
│   ├── .env.example            # Environment template
│   ├── render.yaml             # Render config
│   ├── migrate.js              # Database migration
│   └── seed.js                 # Sample data
│
└── Documentation
    ├── PRODUCTION_READY.md     # Production checklist
    ├── VERCEL_RENDER_SETUP.md  # Deployment guide
    ├── DEPLOYMENT_GUIDE.md     # Detailed checklist
    └── OAUTH_IMPLEMENTATION_COMPLETE.md
```

---

## 🔐 Authentication

### OAuth Setup
Your app supports Google and Facebook login. To enable:

1. **Google:**
   - Firebase Console → Authentication → Sign-in method → Enable Google
   - Add localhost to authorized domains (for local dev)

2. **Facebook:**
   - Firebase Console → Authentication → Sign-in method → Enable Facebook
   - Create Facebook App (if not already done)
   - Add localhost to authorized domains

3. **Production:**
   - Update Firebase authorized domains with your Vercel URL
   - Update CORS_ORIGIN in backend with your Vercel URL

---

## 📊 API Documentation

See [backend/API.md](backend/API.md) for full API documentation including:
- Authentication endpoints
- Transaction CRUD operations
- Budget management
- Reports and analytics

---

## 🗄️ Database

### Schema
- **users** - User accounts (email, name, OAuth info)
- **transactions** - Income/expense records
- **budgets** - Budget limits and tracking

### Migrations
All migrations are automated. Run once on fresh database:
```bash
node backend/migrate.js
```

### Seed Data
Add sample data for testing:
```bash
cd backend
npm run seed
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
```

### Frontend Tests
```bash
npm run test
```

### API Health Check
```bash
curl http://localhost:5000/api/health
# Returns: {"status":"OK"}
```

---

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_GROQ_API_KEY=...
```

**Backend (.env)**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=development
PORT=5000
```

See `.env.example` files for complete templates.

---

## 🚢 Deployment

### Option 1: Vercel + Render (Recommended)
- ✅ **Frontend:** Vercel (free tier)
- ✅ **Backend:** Render (free tier)
- ✅ **Database:** Render PostgreSQL (free tier)

Follow: [VERCEL_RENDER_SETUP.md](VERCEL_RENDER_SETUP.md)

### Option 2: Other Platforms
- **Frontend:** Any static host (Netlify, GitHub Pages, etc.)
- **Backend:** Any Node.js host (Railway, Heroku, AWS, etc.)
- **Database:** Any PostgreSQL host (Supabase, AWS RDS, etc.)

---

## 📦 Dependencies

### Frontend
- React 19.2.4
- React Router 7.14.1
- Firebase 12.13.0
- Vite 8.0.4
- Lucide React 1.8.0

### Backend
- Express 4.19.2
- PostgreSQL (pg)
- JWT for auth
- bcryptjs for passwords
- Firebase Admin SDK
- Helmet for security
- CORS middleware

---

## 🔐 Security Features

- ✅ JWT token authentication
- ✅ Password hashing (bcryptjs)
- ✅ SQL injection prevention
- ✅ CORS protection
- ✅ Security headers (Helmet)
- ✅ Rate limiting
- ✅ Environment variable protection

---

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 🆘 Troubleshooting

### Issues?
1. Check [VERCEL_RENDER_SETUP.md](VERCEL_RENDER_SETUP.md) troubleshooting section
2. Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for common issues
3. Check logs in Render/Vercel dashboards
4. Check Firebase Console for auth errors

---

## 📞 Support

- 📖 Read: [PRODUCTION_READY.md](PRODUCTION_READY.md)
- 🚀 Deploy: [VERCEL_RENDER_SETUP.md](VERCEL_RENDER_SETUP.md)
- 📋 Reference: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- 🔌 OAuth: [OAUTH_IMPLEMENTATION_COMPLETE.md](OAUTH_IMPLEMENTATION_COMPLETE.md)

---

## 🎉 Ready to Deploy?

Your app is production-ready! Follow the deployment guide and you'll be live in minutes.

**Next Step:** Read [PRODUCTION_READY.md](PRODUCTION_READY.md) → [VERCEL_RENDER_SETUP.md](VERCEL_RENDER_SETUP.md)

Happy expense tracking! 💰
