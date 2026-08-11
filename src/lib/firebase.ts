import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';

// Silence verbose Firestore internal connection warnings in console when offline or unreachable
try {
  setLogLevel('silent');
} catch {
  // Ignore if unsupported
}

const firebaseConfigJson = (rawConfig || {}) as Record<string, string | undefined>;
const metaEnv = (import.meta as Record<string, any>).env || {};

let app: any;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore> | null = null;
let googleProvider: GoogleAuthProvider;

try {
  const firebaseConfig = {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || '',
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || '',
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || '',
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || '',
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '',
    appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || ''
  };

  if (firebaseConfig.apiKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    // Custom database ID support if configured
    const customDbId = (firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)')
      ? firebaseConfigJson.firestoreDatabaseId
      : (metaEnv.VITE_FIREBASE_DATABASE_ID || undefined);

    if (customDbId) {
      try {
        db = getFirestore(app, customDbId);
      } catch {
        db = getFirestore(app);
      }
    } else {
      db = getFirestore(app);
    }
  } else {
    console.warn('Firebase configuration missing API key. Running in local fallback mode.');
  }
} catch (err) {
  console.warn('Firebase initialization notice (falling back to local state if offline):', err);
}

export { app, auth, db, googleProvider };

