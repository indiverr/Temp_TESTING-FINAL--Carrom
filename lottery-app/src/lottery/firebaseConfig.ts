/**
 * Firebase Client SDK Initialization
 * 
 * Safely initializes Firebase App, Auth, Firestore, and Storage.
 * Connects to Firebase Emulator Suite in development/test mode if specified.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getStorage,
  FirebaseStorage,
  connectStorageEmulator,
} from 'firebase/storage';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const getFirebaseEnvConfig = (): FirebaseClientConfig => {
  const metaEnv = (import.meta as any).env || {};
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  const isEmulator = metaEnv.VITE_USE_FIREBASE_EMULATOR === 'true' || procEnv.VITE_USE_FIREBASE_EMULATOR === 'true';

  return {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || procEnv.VITE_FIREBASE_API_KEY || (isEmulator ? 'fake-emulator-api-key' : ''),
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || procEnv.VITE_FIREBASE_AUTH_DOMAIN || 'carrom-lottery-demo.firebaseapp.com',
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || procEnv.VITE_FIREBASE_PROJECT_ID || (isEmulator ? 'carrom-lottery-demo' : ''),
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || procEnv.VITE_FIREBASE_STORAGE_BUCKET || 'carrom-lottery-demo.appspot.com',
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || procEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
    appId: metaEnv.VITE_FIREBASE_APP_ID || procEnv.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
  };
};

export const isFirebaseConfigured = (): boolean => {
  const config = getFirebaseEnvConfig();
  const metaEnv = (import.meta as any).env || {};
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  const isEmulator = metaEnv.VITE_USE_FIREBASE_EMULATOR === 'true' || procEnv.VITE_USE_FIREBASE_EMULATOR === 'true';

  if (isEmulator) return true;

  return Boolean(
    config.apiKey &&
    config.projectId &&
    !config.apiKey.includes('your_firebase_api_key_here')
  );
};

// Singleton references
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

export const initFirebase = (): {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  configured: boolean;
} => {
  if (app && db && auth && storage) {
    return { app, db, auth, storage, configured: true };
  }

  const config = getFirebaseEnvConfig();
  const configured = isFirebaseConfigured();

  if (!configured) {
    return { app: null, db: null, auth: null, storage: null, configured: false };
  }

  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

    // Optional Emulator hook in development
    const metaEnv = (import.meta as any).env || {};
    const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};
    if (metaEnv.VITE_USE_FIREBASE_EMULATOR === 'true' || procEnv.VITE_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectStorageEmulator(storage, '127.0.0.1', 9199);
        console.info('[Firebase] Connected to Local Firebase Emulator Suite');
      } catch {
        // Emulator already connected
      }
    }

    return { app, db, auth, storage, configured: true };
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    return { app: null, db: null, auth: null, storage: null, configured: false };
  }
};
