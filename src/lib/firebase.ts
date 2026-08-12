import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// Silence verbose Firestore internal connection warnings in console when offline or unreachable
try {
  setLogLevel('silent');
} catch {
  // Ignore if unsupported
}

// Safely attempt to load firebase-applet-config.json if present without breaking builds on external servers
let firebaseConfigJson: Record<string, string | undefined> = {};
try {
  const configs: Record<string, any> = (import.meta as any).glob('/firebase-applet-config.json', { eager: true });
  const matched = configs['/firebase-applet-config.json'];
  if (matched) {
    firebaseConfigJson = matched.default || matched;
  }
} catch {
  // Config file not present in build environment; fall back to environment variables or local state
}

const metaEnv = (import.meta as Record<string, any>).env || {};

let app: any = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  const apiKey = metaEnv.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || '';
  const authDomain = metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || '';
  const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || '';
  const storageBucket = metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || '';
  const messagingSenderId = metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '';
  const appId = metaEnv.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '';

  const firebaseConfig = apiKey ? {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  } : {
    apiKey: 'demo-local-api-key',
    authDomain: 'demo-local-app.firebaseapp.com',
    projectId: 'demo-local-app'
  };

  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  if (apiKey) {
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
  }
} catch (err) {
  console.warn('Firebase initialization notice (running in local fallback mode):', err);
}

export { app, auth, db, googleProvider };


