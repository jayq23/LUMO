# Deployment Checklist for Vercel + Render

## ✅ Before Deploying

### Backend (Render)

- [ ] Create Render account: https://render.com
- [ ] Create PostgreSQL database on Render:
  - Click "New" → "PostgreSQL"
  - Name: `expensetracker-db`
  - Region: Choose closest to you
  - Note the connection string (you'll need it)

- [ ] Set up environment variables:
  ```
  NODE_ENV=production
  PORT=3000
  DATABASE_URL=postgresql://user:password@host:5432/expensetracker
  JWT_SECRET=<generate a random string>
  CORS_ORIGIN=https://your-app.vercel.app
  ```

- [ ] Create web service:
  - Click "New" → "Web Service"
  - Connect to GitHub repo (expensetracker)
  - Set build command: `npm install`
  - Set start command: `cd backend && npm install && node src/server.js`
  - Add environment variables (see above)
  - Deploy

- [ ] After deployment, run migration:
  - SSH into the Render service
  - Or use Render shell to run: `cd backend && node migrate.js`

- [ ] Test backend health:
  ```bash
  curl https://YOUR_RENDER_URL.onrender.com/api/health
  ```

- [ ] Update Firebase Authorized Domains:
  - Add your Render backend URL (if using Firebase Admin)
  - Add your Vercel frontend URL

### Frontend (Vercel)

- [ ] Create Vercel account: https://vercel.com
- [ ] Import GitHub repo: expensetracker
- [ ] Set environment variables:
  ```
  VITE_API_URL=https://YOUR_RENDER_URL.onrender.com/api
  VITE_GROQ_API_KEY=<your groq key>
  VITE_FIREBASE_API_KEY=<your firebase key>
  VITE_FIREBASE_AUTH_DOMAIN=tracker-app-cc79e.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=tracker-app-cc79e
  VITE_FIREBASE_STORAGE_BUCKET=tracker-app-cc79e.firebasestorage.app
  VITE_FIREBASE_MESSAGING_SENDER_ID=153232780109
  VITE_FIREBASE_APP_ID=1:153232780109:web:6c5cb2a9c37c0d0f76a504
  ```

- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Deploy

### Firebase Console

- [ ] Go to: https://console.firebase.google.com
- [ ] Select project: `tracker-app-cc79e`
- [ ] Go to: Authentication → Settings → Authorized domains
- [ ] Add:
  - `YOUR_VERCEL_APP.vercel.app`
  - Your custom domain (if you have one)
  - Remove `localhost:5173` (if you added it for testing)

- [ ] Make sure Google Sign-In is enabled:
  - Authentication → Sign-in method → Google (should have ✅)

- [ ] Make sure Facebook Sign-In is enabled:
  - Authentication → Sign-in method → Facebook (should have ✅)
  - You may need to add Facebook App ID (if not already configured)

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Production ready: OAuth, backend migration, deployment configs"
git push
```

### Step 2: Deploy Backend (Render)
1. Go to: https://render.com/dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Fill in configuration:
   - Name: `expensetracker-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `cd backend && npm install && node src/server.js`
   - Add all environment variables (see above)
5. Click "Create Web Service"
6. Wait for deployment to complete
7. Copy your backend URL (e.g., `https://expensetracker-backend.onrender.com`)

### Step 3: Run Database Migration on Render
1. In Render, go to your web service
2. Click "Shell" tab
3. Run: `cd backend && node migrate.js`
4. Verify it completes successfully

### Step 4: Deploy Frontend (Vercel)
1. Go to: https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repo
4. Select root directory: `/` (or leave default)
5. Add environment variables:
   - Set `VITE_API_URL` to your Render backend URL
   - Add all Firebase keys
6. Click "Deploy"
7. Wait for deployment to complete
8. Copy your Vercel URL (e.g., `https://expensetracker.vercel.app`)

### Step 5: Update Firebase Authorized Domains
1. Go to: https://console.firebase.google.com
2. Select: `tracker-app-cc79e`
3. Authentication → Settings → Authorized domains
4. Add your Vercel URL
5. Click "Add"

### Step 6: Test
1. Go to your Vercel URL
2. Try Google login - should work! ✅
3. Try Facebook login - should work! ✅
4. Create a transaction - should save to database ✅

---

## ⚠️ Common Issues

### "Google login failed: The string did not match the expected pattern"
- **Cause:** Vercel URL not added to Firebase Authorized domains
- **Fix:** Go to Firebase Console → Settings → Authorized domains → Add your Vercel URL

### "Cannot connect to API"
- **Cause:** `VITE_API_URL` is pointing to wrong backend URL
- **Fix:** Check Render deployment URL and update in Vercel environment variables

### "Database connection failed"
- **Cause:** `DATABASE_URL` is incorrect or Render PostgreSQL is not running
- **Fix:** Check Render dashboard for database status and connection string

### "Render free tier keeps sleeping"
- **Note:** Free tier on Render will put app to sleep after 15 min of inactivity
- **Solution:** Upgrade to paid tier OR accept that it takes ~30 seconds to wake up
- **Test:** Add a health check endpoint (we have `/api/health`)

---

## 📝 Files Updated for Production

- ✅ `.env.example` - Frontend environment template
- ✅ `backend/.env.example` - Backend environment template
- ✅ `vercel.json` - Vercel configuration
- ✅ `backend/render.yaml` - Render deployment config
- ✅ `src/auth/login.jsx` - Google & Facebook OAuth
- ✅ `backend/src/controllers/oauthController.js` - OAuth verification
- ✅ `backend/src/routes/oauth.js` - OAuth endpoint
- ✅ `backend/src/db/migrations/001-add-oauth-support.sql` - Database migration

---

## 🔗 Useful Links

- Render: https://render.com
- Vercel: https://vercel.com
- Firebase Console: https://console.firebase.google.com
- GitHub: https://github.com

---

## 💡 Notes

- Both Render free tier and Vercel free tier are included
- First request to Render may take ~30 seconds (cold start on free tier)
- Database on Render is persistent - no data loss on app restart
- Environment variables on Vercel/Render are kept secret - not exposed to public

Enjoy your deployed app! 🚀
