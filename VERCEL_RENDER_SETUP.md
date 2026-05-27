# 🚀 Vercel + Render Deployment Guide

Your Expense Tracker app is ready for production! Here's the complete step-by-step guide.

## Quick Setup (5 minutes)

### ✅ Prerequisites
- GitHub account (push your code)
- Vercel account (deploy frontend)
- Render account (deploy backend)
- Firebase project configured

---

## Step 1: Prepare Your Code

### 1. Update Environment Files
Already done! ✅

### 2. Push to GitHub
```bash
git add .
git commit -m "Production ready: OAuth, migrations, deployment configs"
git push
```

---

## Step 2: Deploy Backend on Render

### 1. Create Render Account
- Go to: https://render.com
- Sign up with GitHub (easier)

### 2. Create PostgreSQL Database
1. Click **"New"** → **"PostgreSQL"**
2. Fill in:
   - Name: `expensetracker-db`
   - Database: `expensetracker`
   - User: `postgres`
   - Region: Choose closest to your users
   - Plan: **Free** (sufficient for testing)
3. Click **"Create Database"**
4. **Copy the connection string** (looks like: `postgresql://user:password@host:5432/db`)
   - You'll need this in the next step

### 3. Create Web Service
1. Click **"New"** → **"Web Service"**
2. Connect GitHub → Select your **expensetracker** repo
3. Fill in:
   - **Name:** `expensetracker-api`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node src/server.js`
   - **Region:** Same as database (or closest)
   - **Plan:** **Free**

### 4. Add Environment Variables
1. In Render service, go to **Environment**
2. Add these variables:
   ```
   NODE_ENV = production
   PORT = 3000
   DATABASE_URL = [PASTE YOUR PostgreSQL CONNECTION STRING HERE]
   JWT_SECRET = [GENERATE RANDOM STRING - at least 32 chars]
   CORS_ORIGIN = https://your-vercel-app.vercel.app
   ```
3. Click **"Save"**

### 5. Deploy
1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Once complete, you'll see a green "Live" status
4. **Copy your backend URL** (e.g., `https://expensetracker-api.onrender.com`)

### 6. Run Database Migration
1. In your local terminal, run:
   ```bash
   DATABASE_URL="postgresql://user:pass@host:5432/db" node backend/migrate.js
   ```
   (Replace with your actual PostgreSQL connection string)

2. Or run it on Render:
   - SSH into Render (if available on paid plan)
   - Or check database was created with correct schema

### 7. Test Backend
```bash
curl https://your-backend-url.onrender.com/api/health
# Should return: {"status":"OK"}
```

---

## Step 3: Update Firebase

### 1. Add Frontend Domain to Authorized Domains
1. Go to: https://console.firebase.google.com
2. Select project: **tracker-app-cc79e**
3. Go to: **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Enter: `your-app.vercel.app` (you'll get this after deploying to Vercel)
6. Click **"Add"**

### 2. Verify OAuth Providers
- Go to: **Authentication** → **Sign-in method**
- Make sure **Google** has ✅ enabled
- Make sure **Facebook** has ✅ enabled

---

## Step 4: Deploy Frontend on Vercel

### 1. Create Vercel Account
- Go to: https://vercel.com
- Sign up with GitHub (easier)

### 2. Import Project
1. Click **"Add New"** → **"Project"**
2. Select your **expensetracker** GitHub repo
3. Click **"Import"**

### 3. Configure Build Settings
1. **Project Name:** `expensetracker` (or your preference)
2. **Framework Preset:** `Vite` (should auto-detect)
3. **Root Directory:** `./` (or leave as default)
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. Click **"Environment Variables"**

### 4. Add Environment Variables
Add these variables:
```
VITE_API_URL = https://your-backend-url.onrender.com/api
VITE_GROQ_API_KEY = your_groq_key_here
VITE_FIREBASE_API_KEY = AIzaSyC7QlHp_h_YLAgwGCSwaJTu-Vrba4MYyhU
VITE_FIREBASE_AUTH_DOMAIN = tracker-app-cc79e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = tracker-app-cc79e
VITE_FIREBASE_STORAGE_BUCKET = tracker-app-cc79e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 153232780109
VITE_FIREBASE_APP_ID = 1:153232780109:web:6c5cb2a9c37c0d0f76a504
```

### 5. Deploy
1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Once complete, you'll see the deployment URL
4. **Copy your frontend URL** (e.g., `https://expensetracker.vercel.app`)

### 6. Update Firebase Authorized Domains (if not done yet)
1. Go to Firebase Console
2. Add your Vercel URL to Authorized domains

---

## Step 5: Test Everything

### 1. Open Your App
- Go to: `https://your-app.vercel.app`

### 2. Test Google Login
1. Click **"Continue with Google"**
2. Authenticate with your Google account
3. Should redirect to dashboard ✅

### 3. Test Facebook Login
1. Click **"Continue with Facebook"**
2. Authenticate with your Facebook account
3. Should redirect to dashboard ✅

### 4. Test API
1. Create a transaction
2. Should save to Render PostgreSQL ✅
3. Create a budget
4. Should work without errors ✅

### 5. Test Logout
1. Go to Settings
2. Click "Logout"
3. Should redirect to login ✅

---

## 🎉 Success! Your App is Live!

Your production app is now running:
- **Frontend:** https://your-app.vercel.app
- **Backend API:** https://your-backend-url.onrender.com/api
- **Database:** Render PostgreSQL

---

## ⚠️ Important Notes

### Free Tier Limitations
- **Render free tier:** Apps go to sleep after 15 minutes of inactivity
- **Vercel free tier:** No limitations
- **First request may take ~30 seconds** after sleep (cold start)

### To Avoid Cold Starts
- Upgrade Render to paid tier (~$7/month)
- Or add a health check that pings your API every 10 minutes

### Database Backups
- Render PostgreSQL has automatic backups
- Check Render dashboard for backup options

---

## 🔧 Troubleshooting

### "Google login failed: domain not authorized"
- **Solution:** Add your Vercel URL to Firebase Authorized domains
- **Check:** https://console.firebase.google.com → Settings → Authorized domains

### "Cannot connect to API"
- **Check:** Your `VITE_API_URL` matches your Render backend URL
- **Test:** `curl https://your-backend.onrender.com/api/health`
- **Fix:** Update environment variable in Vercel and redeploy

### "Database connection error"
- **Check:** Your `DATABASE_URL` is correct in Render
- **Check:** Render PostgreSQL is "Available" in dashboard
- **Fix:** Run migration again: `node backend/migrate.js`

### "Render app keeps restarting"
- **Check:** Render logs for errors
- **Common cause:** Missing environment variables
- **Fix:** Double-check all env vars in Render dashboard

### "Build fails on Vercel"
- **Check:** All dependencies installed: `npm install`
- **Check:** Build command is correct: `npm run build`
- **Check:** No TypeScript errors (if using TS)

---

## 📊 Monitoring

### Render Dashboard
- Check app status: https://dashboard.render.com
- View logs: Click service → **Logs**
- Monitor database: Click database → **Dashboard**

### Vercel Dashboard
- Check deployment status: https://vercel.com/dashboard
- View logs: Click project → **Deployments** → **Logs**
- Monitor performance: Click project → **Analytics**

---

## 🔐 Security Checklist

- ✅ Environment variables are not committed to Git
- ✅ JWT secret is strong and random
- ✅ Database URL is not public
- ✅ API keys are stored as environment variables
- ✅ CORS is restricted to your frontend domain
- ✅ Rate limiting is enabled

---

## 📝 Next Steps (Optional)

1. **Add custom domain**
   - Vercel: Project Settings → Domains
   - Render: Custom Domain (paid tier only)

2. **Enable HTTPS** (automatic on Vercel & Render)

3. **Set up CI/CD** (automatic with GitHub integration)

4. **Monitor logs** (check both Vercel and Render dashboards)

5. **Add email notifications** (Vercel/Render settings)

---

## 🆘 Need Help?

- **Render Support:** https://render.com/docs
- **Vercel Support:** https://vercel.com/support
- **Firebase Support:** https://firebase.google.com/support
- **Your Code Issues:** Check logs on Render/Vercel dashboards

---

## 📱 Share Your App!

Your app is now live and ready to share! 🎉

```
Frontend: https://your-app.vercel.app
```

Enjoy your deployed Expense Tracker! 🚀
