# Expense Tracker Backend

Node.js/Express API with PostgreSQL database for the Expense Tracker application.

## Setup

### 1. Start PostgreSQL.app

Make sure PostgreSQL.app is running (check Applications > PostgreSQL).

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` (already done):

```bash
cp .env.example .env
```

Your `.env` should have:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expensetracker
DB_USER=postgres
DB_PASSWORD=sorreda123
NODE_ENV=development
```

### 4. Setup Database

Run the setup script:

```bash
chmod +x setup-db.sh
./setup-db.sh
```

Or manually:

```bash
createdb expensetracker
psql expensetracker < src/db/init.sql
```

### 5. Run the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The server will run on `http://localhost:5000`

## Testing

Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/ai/ask` - Agentic finance assistant
- `POST /api/ai/categorize` - Expense categorization helper

## Startup Behavior

The backend now initializes the database schema automatically on startup and applies the OAuth support migration when needed. For an older database, you can still run `node migrate.js` manually.

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── pool.js       # Database connection pool
│   │   └── init.sql      # Database schema
│   ├── routes/           # API routes
│   ├── controllers/      # Route handlers
│   ├── models/           # Database models/queries
│   ├── middleware/       # Express middleware
│   └── server.js         # Main server file
├── .env.example          # Environment variables template
├── package.json
└── README.md
```

## Next Steps

1. Create authentication endpoints (register, login)
2. Create transaction endpoints (CRUD)
3. Create budget endpoints (CRUD)
4. Add input validation
5. Add JWT authentication
