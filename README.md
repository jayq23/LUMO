🐿️ Lumo - Personal Finance Tracker

A full-stack personal finance PWA with expense and tracking, budget management, and an agentic AI assistant that reasons and acts on your finances.

Live Demo: lumo-funds.vercel.app

Features

Dashboard with spending overview
Transaction management with AI auto-categorization
Budget tracking with overspend alerts and spending outlooks
Monthly reports and category breakdown
Agentic AI Financial Assistant (Groq + Llama 3.3 70B) with multi-step tool-calling
AI can summarize finances, add transactions, create budgets, and list recent activity
Multi-language support (2 languages)
Multi-currency support
PWA — installable on mobile
Offline support with background sync
Export transactions (CSV + Monthly Summary)
Google + Facebook OAuth login


Tech Stack:

Frontend: React, Vite, Tailwind CSS, CSS
Backend: Node.js, Express.js
Database: PostgreSQL, Supabase

Security:

JWT Authentication
OAuth 2.0 (Google + Facebook Login)
Rate Limiting
Helmet.js HTTP Headers
SQL Injection Prevention (Parameterized Queries)

## Backend Notes

The backend auto-initializes the database schema on startup. Existing databases can still be upgraded manually with `node backend/migrate.js` if needed.


## Getting Started

```bash
# Clone the repo
git clone https://github.com/jayq23/LUMO

# Install frontend dependencies (root level)
npm install

# Install backend dependencies
cd backend && npm install

# Run frontend
npm run dev

# Run backend (separate terminal)
cd backend && npm start
```
# Trigger
# Update Settings
