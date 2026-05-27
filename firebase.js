import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const missingFirebaseEnv = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingFirebaseEnv.length > 0) {
  throw new Error(
    `Missing Firebase env vars: ${missingFirebaseEnv.join(', ')}. Check react/.env and Vercel environment variables.`
  )
}

// Debug: Log Firebase config (without sensitive data)
console.log('🔥 Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId ? firebaseConfig.appId.substring(0, 10) + '...' : 'MISSING'
})

let app
try {
  app = initializeApp(firebaseConfig)
  console.log('✅ Firebase initialized successfully')
} catch (err) {
  console.error('❌ Firebase initialization error:', err.message)
  throw err
}

const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }