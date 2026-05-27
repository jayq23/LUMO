import admin from 'firebase-admin';
import * as userModel from '../models/userModel.js';
import { generateToken } from '../middleware/authMiddleware.js';

// Initialize Firebase Admin SDK
let firebaseApp;

export const initializeFirebase = () => {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
    console.log('🔍 DEBUG: FIREBASE_SERVICE_ACCOUNT length:', raw.length); // should be > 100
    console.log('🔍 DEBUG: CORS_ORIGIN:', process.env.CORS_ORIGIN);        // should show your domain
    
    const serviceAccount = JSON.parse(raw);
    
    if (!serviceAccount.project_id) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not configured. OAuth will use ID token validation only.');
      return false;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    
    console.log('✅ Firebase Admin SDK initialized');
    return true;
  } catch (err) {
    console.warn('❌ Firebase Admin SDK initialization failed:', err.message);
    return false;
  }
};

export const socialLogin = async (req, res, next) => {
  try {
    const { idToken, provider } = req.body;

    if (!idToken || !provider) {
      return res.status(400).json({ error: 'ID token and provider are required' });
    }

    if (!['google', 'facebook'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    let decodedToken;
    
    // Verify Firebase ID token
    try {
      if (firebaseApp) {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } else {
        // Fallback: basic validation (in production, use proper verification)
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
        decodedToken = payload;
      }
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired ID token' });
    }

    const { uid, email, name } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: 'Email not available from provider' });
    }

    // Check if user already exists
    let user = await userModel.getUserByEmail(email);

    if (!user) {
      // Create new user with OAuth (no password)
      user = await userModel.createOAuthUser(email, name || email.split('@')[0], provider, uid);
    }

    // Generate backend JWT token
    const token = generateToken(user.id);

    const { password_hash: _password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Social login successful',
      user: userWithoutPassword,
      token,
      provider
    });
  } catch (err) {
    next(err);
  }
};
