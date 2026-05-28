# 🔧 Deployment Troubleshooting Guide

## ❌ Common Login Issues & Fixes

### Issue 1: **Hardcoded Render URL** ✅ FIXED
**Problem:** Frontend was using hardcoded URL `https://lumo-5f41.onrender.com` instead of environment variable
**Solution:** Updated login.jsx to use `import.meta.env.VITE_API_URL`
**Status:** FIXED in src/auth/login.jsx

---

## ✅ Deployment Verification Checklist

### 1️⃣ **Render Backend Setup**

Go to [https://dashboard.render.com](https://dashboard.render.com) and verify:

```
Environment Variables should include:
✓ NODE_ENV=production
✓ PORT=3000 (or auto-assigned)
✓ DATABASE_URL=postgresql://user:password@host:5432/db
✓ JWT_SECRET=your-secret-key
✓ CORS_ORIGIN=https://yourfrontend.vercel.app
✓ FIREBASE_PROJECT_ID=your-firebase-project
✓ FIREBASE_SERVICE_ACCOUNT_KEY=your-firebase-key (as JSON)
```

**Get your Render URL:**
```bash
# Open Render dashboard → your web service
# Copy the URL like: https://expensetracker.onrender.com
```

---

### 2️⃣ **Vercel Frontend Setup**

Go to [https://vercel.com/dashboard](https://vercel.com/dashboard) and verify:

**Environment Variables:**
```
✓ VITE_API_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
  Example: https://expensetracker.onrender.com/api
```

**Build & Start Commands:**
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: `dist`

---

### 3️⃣ **Test Backend Health**

Run this in your terminal to check if backend is working:

```bash
# Replace with your actual Render URL
curl https://YOUR_RENDER_URL.onrender.com/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

---

### 4️⃣ **Test Login Endpoint**

```bash
# Replace with your actual URLs
RENDER_URL="https://YOUR_RENDER_URL.onrender.com"

curl -X POST $RENDER_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://yourfrontend.vercel.app" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Expected response if user doesn't exist:
# {"error":"Invalid credentials"}

# Expected response if success:
# {"message":"Login successful","user":{...},"token":"..."}
```

---

### 5️⃣ **Browser Console Debugging**

When you see login errors on Vercel, open **DevTools (F12)** and check:

**Console Tab:**
- Look for red errors about API calls
- Check what URL it's actually hitting
- Copy the error message

**Network Tab:**
- Click on failed API request
- Check "Response" for backend error message
- Check "Request Headers" for `Authorization` header
- Check "Response Headers" for CORS headers

---

## 🔴 Common Errors & Solutions

### Error: `CORS policy: origin is not allowed`
**Cause:** CORS_ORIGIN env var doesn't match your Vercel domain
**Fix:**
1. Get your Vercel URL from vercel.com dashboard
2. On Render → Environment → Edit CORS_ORIGIN
3. Set to: `https://yourapp.vercel.app` (no trailing slash)
4. Deploy Render service again

### Error: `Network error` or `Failed to fetch`
**Cause:** Backend is down, timeout, or wrong URL
**Fix:**
1. Test: `curl https://YOUR_RENDER_URL.onrender.com/api/health`
2. Check Render logs: Dashboard → Service → Logs
3. Verify VITE_API_URL on Vercel

### Error: `Invalid credentials` on first login
**Cause:** User doesn't exist or database not migrated
**Fix:**
1. First register a new account
2. If register fails, check backend logs on Render

### Error: `Cannot read property 'user' of undefined`
**Cause:** Backend not returning expected response format
**Fix:** Check backend response format in authController.js

---

## 🚀 Render Deployment Commands

After pushing to GitHub, run these on Render to verify:

**Via Render Shell (Dashboard → Service → Shell):**
```bash
# Check database connection
node -e "const pool = require('./backend/src/db/pool.js'); pool.query('SELECT NOW()', (err, res) => { console.log(err || res.rows); process.exit(); })"

# Run migrations
cd backend && node migrate.js

# Check env variables
echo $DATABASE_URL
echo $JWT_SECRET
echo $CORS_ORIGIN
```

---

## 📋 Quick Checklist

- [ ] Render CORS_ORIGIN set to Vercel URL
- [ ] Vercel VITE_API_URL set to Render URL
- [ ] Database migrations run on Render
- [ ] Backend `/api/health` responds with 200
- [ ] Login endpoint accessible and responds
- [ ] No CORS errors in browser console
- [ ] Backend logs show API requests (check Render logs)
- [ ] Firebase config loaded (if using social login)

---

## 🆘 If Still Having Issues

Please provide:
1. **Vercel URL:** `https://...vercel.app`
2. **Render URL:** `https://...onrender.com`
3. **Error from browser console** (F12 → Console tab)
4. **Error from Render logs** (Dashboard → Logs)
5. **Network request details** (F12 → Network → failed request → Response)

