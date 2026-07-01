import admin from 'firebase-admin';
import * as userModel from '../models/userModel.js';
import { generateToken } from '../middleware/authMiddleware.js';

// Initialize Firebase Admin SDK
let firebaseApp;

export const initializeFirebase = () => {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
    const serviceAccount = JSON.parse(raw);
    
    if (!serviceAccount.project_id) {
      console.warn('FIREBASE_SERVICE_ACCOUNT not configured. OAuth social login is disabled until Firebase Admin is configured.');
      return false;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    
    console.log('Firebase Admin SDK initialized');
    return true;
  } catch (err) {
    console.warn('Firebase Admin SDK initialization failed:', err.message);
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

    if (!firebaseApp) {
      return res.status(503).json({ error: 'OAuth service is not configured on the server' });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const { uid, email, name } = decodedToken;

      // Facebook might not return email even if user granted permission
      // Generate fallback email using provider + uid
      const userEmail = email || `${provider}_${uid}@${provider}.local`;

      if (!userEmail) {
        return res.status(400).json({ error: 'Unable to determine user identity from provider' });
      }

      // Check if user already exists
      let user = await userModel.getUserByEmail(userEmail);

      if (!user) {
        // Create new user with OAuth (no password)
        user = await userModel.createOAuthUser(userEmail, name || userEmail.split('@')[0], provider, uid);
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
      return res.status(401).json({ error: 'Invalid or expired ID token' });
    }
  } catch (err) {
    next(err);
  }
};
