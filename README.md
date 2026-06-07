🐿️ Lumo - Personal Finance Tracker

A full-stack personal finance PWA that helps you track expenses, manage budgets, and get AI-powered financial insights.

🔗 Live Demo: lumo-funds.vercel.app

✨ Features

📊 Dashboard with spending overview
💳 Transaction management with AI auto-categorization
📦 Budget tracking with overspend alerts
📈 Monthly reports and category breakdown
🤖 AI Financial Assistant (Groq + Llama 3.3 70B)
🌍 Multi-language support (11 languages)
💱 Multi-currency support
📱 PWA — installable on mobile
🔌 Offline support with background sync
📤 Export transactions (CSV + Monthly Summary)


🛠️ Tech Stack
FrontendBackendDatabaseReact, ViteNode.js, Express.jsPostgreSQLTailwind CSSJWT, OAuth 2.0SQLite

🔒 Security

JWT Authentication
OAuth 2.0 (Facebook Login)
Rate Limiting
Helmet.js HTTP Headers
SQL Injection Prevention (Parameterized Queries)


🚀 Getting Started
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
