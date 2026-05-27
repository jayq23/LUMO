# ✅ Google & Facebook Login - Complete Implementation

## What Was Fixed

### 1. **Frontend (src/auth/login.jsx)**
✅ Added missing `onAuthStateChanged` import (removed unused useEffect)
✅ Fixed navigation route: `/mainpage` → `/dashboard`
✅ Updated Google login handler to use backend OAuth endpoint
✅ Updated Facebook login handler to use backend OAuth endpoint
✅ Both handlers now:
   - Get Firebase ID token from authentication result
   - Call backend `/api/oauth/social-login` endpoint
   - Store JWT token from backend in localStorage
   - Store user data in localStorage
   - Redirect to dashboard

### 2. **Frontend API Client (src/api/client.js)**
✅ Added new OAuth endpoint:
```javascript
oauth: {
  socialLogin: (idToken, provider) => 
    POST /api/oauth/social-login
}
```

### 3. **Backend OAuth Controller (src/controllers/oauthController.js)**
✅ Created new OAuth controller with:
   - Firebase Admin SDK initialization
   - ID token verification
   - User creation/lookup in PostgreSQL
   - JWT token generation for backend auth
   - Support for Google & Facebook providers

### 4. **Backend OAuth Routes (src/routes/oauth.js)**
✅ Created POST `/api/oauth/social-login` endpoint

### 5. **Backend Integration (src/server.js)**
✅ Added Firebase Admin SDK initialization
✅ Registered OAuth routes
✅ Imports oauth controller

### 6. **Database Schema (src/db/init.sql)**
✅ Added `oauth_provider` column (VARCHAR 50)
✅ Added `oauth_uid` column (VARCHAR 255)
✅ Made `password_hash` nullable (for OAuth users)

### 7. **Database Migrations**
✅ Created migration script: `backend/migrate.js`
✅ Automatically adds OAuth columns to existing databases
✅ Run: `node backend/migrate.js`

### 8. **User Model (src/models/userModel.js)**
✅ Added `createOAuthUser()` function for OAuth registration

---

## Architecture

```
User clicks "Google/Facebook" button
    ↓
Firebase authenticates user
    ↓
Frontend gets Firebase ID token
    ↓
Frontend sends token to backend /api/oauth/social-login
    ↓
Backend verifies Firebase ID token
    ↓
Backend checks if user exists in PostgreSQL
    ├─ If exists: return backend user + JWT
    └─ If new: create user in PostgreSQL + return JWT
    ↓
Frontend stores JWT token & user in localStorage
    ↓
Frontend redirects to /dashboard
    ↓
✅ User authenticated in both Firebase & PostgreSQL
```

---

## How It Works

### First Time Login
1. User clicks Google/Facebook button
2. Firebase authenticates user
3. Frontend gets Firebase ID token
4. Backend verifies token & finds no user in PostgreSQL
5. Backend creates new user with OAuth info
6. Backend returns JWT token
7. Frontend stores JWT & redirects to dashboard

### Subsequent Logins
1. User clicks Google/Facebook button
2. Firebase authenticates user
3. Frontend gets Firebase ID token
4. Backend verifies token & finds user in PostgreSQL
5. Backend returns JWT token
6. Frontend stores JWT & redirects to dashboard

---

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),              -- NULL for OAuth users
  name VARCHAR(255),
  oauth_provider VARCHAR(50),              -- 'google' or 'facebook'
  oauth_uid VARCHAR(255),                  -- Firebase UID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_uid);
```

---

## Testing

### Test Google Login
1. Start frontend: `npm run dev`
2. Start backend: `npm run backend:dev`
3. Click "Continue with Google" button
4. Authenticate with Google account
5. Should redirect to dashboard
6. Check localStorage: `authToken` should be present

### Test Facebook Login
1. Same as above but click "Continue with Facebook"
2. Authenticate with Facebook account
3. Should redirect to dashboard

### Test API Calls
After login, make authenticated API calls:
```javascript
const response = await api.auth.profile(userId)
// Should work because authToken is sent in headers
```

---

## Environment Variables

Your `.env` already has all Firebase credentials:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Optional: Firebase Service Account (Backend)
For production Firebase Admin SDK verification, add to `backend/.env`:
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

If not provided, basic token validation is used.

---

## Troubleshooting

### "Continue with Google/Facebook" button not responding
- Check browser console for errors
- Verify Firebase credentials in `.env`
- Ensure backend is running on http://localhost:5000

### Login redirects to dashboard but user data not showing
- Check localStorage for `authToken` and `user`
- Verify backend is receiving the request: check console logs
- Ensure migration was run: `node backend/migrate.js`

### Backend 401 errors after social login
- Check that JWT token is being stored in localStorage
- Verify API client is sending Authorization header
- Check that backend is using the correct JWT_SECRET

### New user created but can't login with email/password
- OAuth users don't have passwords
- They must use Google/Facebook to login
- Password-based login is separate

---

## Files Changed

### Frontend
- `src/auth/login.jsx` - Updated social login handlers
- `src/api/client.js` - Added OAuth endpoint

### Backend
- `backend/src/controllers/oauthController.js` - NEW OAuth logic
- `backend/src/routes/oauth.js` - NEW OAuth routes
- `backend/src/server.js` - Added OAuth integration
- `backend/src/models/userModel.js` - Added createOAuthUser()
- `backend/src/db/init.sql` - Updated schema
- `backend/src/db/migrations/001-add-oauth-support.sql` - NEW migration
- `backend/migrate.js` - NEW migration script

### Dependencies
- `firebase` - Already installed
- `firebase-admin` - Installed in backend

---

## Next Steps (Optional Enhancements)

1. [ ] Add logout button that signs out from both Firebase & backend
2. [ ] Handle Firebase token refresh automatically
3. [ ] Add profile picture from Firebase to user profile
4. [ ] Link existing email/password account with OAuth
5. [ ] Add error logging for OAuth failures
6. [ ] Rate limit OAuth endpoint
7. [ ] Add optional 2FA for OAuth users

