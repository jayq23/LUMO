# 🚀 RENDER DEPLOYMENT FIX - Critical Steps

## ✅ What I Fixed

1. **✅ Hardcoded URL** - Changed login.jsx to use `VITE_API_URL` env var instead of hardcoded Render URL
2. **✅ Trust Proxy** - Added `app.set('trust proxy', 1)` to backend/src/server.js to fix rate limiter errors

## 🔴 Remaining Issue: Database Schema

**Your Render logs show:** `column "spent_amount" does not exist`

This means the database hasn't been initialized with the correct schema yet.

---

## 📋 IMMEDIATE STEPS TO FIX

### Step 1: Run Database Migrations on Render

1. Go to: https://dashboard.render.com
2. Click your web service: **expensetracker** (or whatever it's called)
3. Click the **Shell** tab at the top
4. Run this command:

```bash
cd backend && node migrate.js
```

Expected output:
```
Migration 001-add-oauth-support.sql completed successfully
```

---

### Step 2: Initialize Database Tables

Still in the Shell, run:

```bash
cd backend && node -e "
  const pool = require('./src/db/pool.js');
  const fs = require('fs');
  const sql = fs.readFileSync('./src/db/init.sql', 'utf8');
  
  pool.query(sql, (err, res) => {
    if (err) {
      console.error('Error initializing database:', err.message);
      process.exit(1);
    }
    console.log('✅ Database tables initialized successfully');
    process.exit(0);
  });
"
```

---

### Step 3: Verify Database Schema

```bash
# Check if budgets table has spent_amount column
cd backend && node -e "
  const pool = require('./src/db/pool.js');
  pool.query(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'budgets'\", (err, res) => {
    if (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
    console.log('Budgets table columns:');
    res.rows.forEach(row => console.log('  -', row.column_name));
    process.exit(0);
  });
"
```

You should see:
```
Budgets table columns:
  - id
  - user_id
  - category
  - limit_amount
  - spent_amount
  - month
  - year
  - created_at
  - updated_at
```

---

### Step 4: Restart Backend Service

After running migrations:

1. Go back to your Render dashboard
2. Click the **Manual Deploy** button or just wait for GitHub auto-deploy
3. Or click the **three dots (⋯)** → **Restart service**

---

## 🧪 Testing After Fixes

### Test 1: Backend Health Check

```bash
curl https://lumo-5f41.onrender.com/api/health
```

Expected:
```json
{"status":"ok","timestamp":"2026-05-28T15:30:00Z"}
```

---

### Test 2: Test Login (create user first)

```bash
# Register a new user
curl -X POST https://lumo-5f41.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://lumo-funds.vercel.app" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Then login
curl -X POST https://lumo-5f41.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://lumo-funds.vercel.app" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

### Test 3: Verify Vercel Frontend Deployment

1. Go to: https://lumo-funds.vercel.app
2. Try to login with the test account you created
3. Open **DevTools (F12)** → **Console** tab
4. Look for any red errors

---

## 📝 Render Environment Variables Checklist

Go to your Render service → **Settings** tab → **Environment**

Verify these are set:

```
✓ NODE_ENV = production
✓ PORT = 3000 (or auto)
✓ DATABASE_URL = your-postgresql-url
✓ JWT_SECRET = your-secret
✓ CORS_ORIGIN = https://lumo-funds.vercel.app
✓ VITE_API_URL = https://lumo-5f41.onrender.com/api (this goes on Vercel, not Render!)
✓ FIREBASE_PROJECT_ID = your-project-id
✓ FIREBASE_SERVICE_ACCOUNT_KEY = your-firebase-key-json
```

**Important:** `VITE_API_URL` should be set on **Vercel**, not Render!

---

## 📝 Vercel Environment Variables Checklist

Go to: https://vercel.com/dashboard → **expensetracker** → **Settings** → **Environment Variables**

```
✓ VITE_API_URL = https://lumo-5f41.onrender.com/api
```

---

## 🔍 Debugging Tips

If login still fails:

1. **Check Render logs:** Go to Render service → **Logs** tab, look for red error messages
2. **Check browser network:** F12 → Network tab → click failed request → Response tab
3. **Check CORS:** If you see CORS error, verify `CORS_ORIGIN` matches your Vercel URL exactly
4. **Check database:** Run the schema verification command above

---

## ✨ Commands Summary

```bash
# From Render Shell tab:

# 1. Run migrations
cd backend && node migrate.js

# 2. Initialize tables
cd backend && node src/db/init.sql

# 3. Check columns
cd backend && psql "$DATABASE_URL" -c "\d budgets"

# 4. Restart (or use Manual Deploy button)
# Service will restart automatically after code changes
```

---

## 📞 If You Still Get Errors

Please share:
1. **Error message** from browser console (F12)
2. **Error message** from Render logs (Dashboard → Logs tab)
3. **Network request details** (F12 → Network → failed request → Response)

