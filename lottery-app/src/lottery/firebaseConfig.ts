/**
 * Firebase Client SDK Initialization
 * 
 * Safely initializes Firebase App, Auth, Firestore, and Storage.
 * Connects to Firebase Emulator Suite in development/test mode if specified.
 * Defaults to live project 'carrom-df56a' with zero duplication.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import 'firebase/auth';
import {
  getAuth,
  Auth,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  connectStorageEmulator,
} from 'firebase/storage';
import {
  getFunctions,
  Functions,
  connectFunctionsEmulator,
} from 'firebase/functions';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseConfigDiagnostics {
  configured: boolean;
  isEmulator: boolean;
  projectId: string;
  authDomain: string;
  missingKeys: string[];
  invalidKeys: string[];
  diagnosticMessage: string;
}

const DEFAULT_PROJECT_ID = 'carrom-df56a';
const DEFAULT_AUTH_DOMAIN = 'carrom-df56a.firebaseapp.com';
const DEFAULT_STORAGE_BUCKET = 'carrom-df56a.firebasestorage.app';
const DEFAULT_MESSAGING_SENDER_ID = '1036558671064';
const DEFAULT_APP_ID = '1:1036558671064:web:2f0b406418fd960cc94bad';

const cleanEnvVal = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^['"]|['"]$/g, '').trim();
};

const isPlaceholderApiKey = (apiKey: string): boolean => {
  const lower = apiKey.toLowerCase();
  return (
    !apiKey ||
    lower.includes('your_firebase_api_key') ||
    lower.includes('placeholder') ||
    lower.includes('replace_with') ||
    lower === 'changeme'
  );
};

export const getFirebaseEnvConfig = (): FirebaseClientConfig => {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  let localSaved: Partial<FirebaseClientConfig> = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem('CARROM_FIREBASE_CONFIG');
      if (raw) localSaved = JSON.parse(raw);
    } catch {}
  }

  const isEmulator =
    cleanEnvVal(metaEnv.VITE_USE_FIREBASE_EMULATOR) === 'true' ||
    cleanEnvVal(procEnv.VITE_USE_FIREBASE_EMULATOR) === 'true';

  const envApiKey =
    cleanEnvVal(metaEnv.VITE_FIREBASE_API_KEY) ||
    cleanEnvVal(procEnv.VITE_FIREBASE_API_KEY) ||
    cleanEnvVal(localSaved.apiKey);

  const envAuthDomain =
    cleanEnvVal(metaEnv.VITE_FIREBASE_AUTH_DOMAIN) ||
    cleanEnvVal(procEnv.VITE_FIREBASE_AUTH_DOMAIN) ||
    cleanEnvVal(localSaved.authDomain);

  const envProjectId =
    cleanEnvVal(metaEnv.VITE_FIREBASE_PROJECT_ID) ||
    cleanEnvVal(procEnv.VITE_FIREBASE_PROJECT_ID) ||
    cleanEnvVal(localSaved.projectId);

  const envStorageBucket =
    cleanEnvVal(metaEnv.VITE_FIREBASE_STORAGE_BUCKET) ||
    cleanEnvVal(procEnv.VITE_FIREBASE_STORAGE_BUCKET) ||
    cleanEnvVal(localSaved.storageBucket);

  const envMessagingSenderId =
    cleanEnvVal(metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    cleanEnvVal(procEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    cleanEnvVal(localSaved.messagingSenderId);

  const envAppId =
    cleanEnvVal(metaEnv.VITE_FIREBASE_APP_ID) ||
    cleanEnvVal(procEnv.VITE_FIREBASE_APP_ID) ||
    cleanEnvVal(localSaved.appId);

  return {
    apiKey: envApiKey || (isEmulator ? 'fake-emulator-api-key' : ''),
    authDomain:
      envAuthDomain ||
      (isEmulator ? 'demo-carrom-lottery.firebaseapp.com' : DEFAULT_AUTH_DOMAIN),
    projectId:
      envProjectId ||
      (isEmulator ? 'demo-carrom-lottery' : DEFAULT_PROJECT_ID),
    storageBucket:
      envStorageBucket ||
      (isEmulator ? 'demo-carrom-lottery.appspot.com' : DEFAULT_STORAGE_BUCKET),
    messagingSenderId: envMessagingSenderId || DEFAULT_MESSAGING_SENDER_ID,
    appId: envAppId || DEFAULT_APP_ID,
  };
};

export const isEmulatorMode = (): boolean => {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  return (
    cleanEnvVal(metaEnv.VITE_USE_FIREBASE_EMULATOR) === 'true' ||
    cleanEnvVal(procEnv.VITE_USE_FIREBASE_EMULATOR) === 'true'
  );
};

export const getOtpAppsScriptUrl = (): string => {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  let localSavedUrl = '';
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localSavedUrl = localStorage.getItem('CARROM_OTP_APPS_SCRIPT_URL') || '';
    } catch {}
  }
  return cleanEnvVal(
    metaEnv.VITE_OTP_APPS_SCRIPT_URL ||
      procEnv.VITE_OTP_APPS_SCRIPT_URL ||
      localSavedUrl ||
      ''
  );
};

export const isStorageConfigured = (): boolean => {
  if (isEmulatorMode()) return true;
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  return (
    cleanEnvVal(metaEnv.VITE_FIREBASE_STORAGE_ENABLED) === 'true' ||
    cleanEnvVal(procEnv.VITE_FIREBASE_STORAGE_ENABLED) === 'true'
  );
};

export const getFirebaseConfigDiagnostics = (): FirebaseConfigDiagnostics => {
  const config = getFirebaseEnvConfig();
  const isEmulator = isEmulatorMode();
  const missingKeys: string[] = [];
  const invalidKeys: string[] = [];

  if (isEmulator) {
    return {
      configured: true,
      isEmulator: true,
      projectId: config.projectId,
      authDomain: config.authDomain,
      missingKeys: [],
      invalidKeys: [],
      diagnosticMessage: '',
    };
  }

  if (!config.apiKey) {
    missingKeys.push('VITE_FIREBASE_API_KEY');
  } else if (isPlaceholderApiKey(config.apiKey)) {
    invalidKeys.push('VITE_FIREBASE_API_KEY (contains placeholder value)');
  }

  if (!config.projectId) {
    missingKeys.push('VITE_FIREBASE_PROJECT_ID');
  } else if (config.projectId !== DEFAULT_PROJECT_ID) {
    invalidKeys.push(`VITE_FIREBASE_PROJECT_ID (expected "${DEFAULT_PROJECT_ID}", got "${config.projectId}")`);
  }

  if (!config.authDomain) {
    missingKeys.push('VITE_FIREBASE_AUTH_DOMAIN');
  }

  if (!config.messagingSenderId) {
    missingKeys.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
  }

  if (!config.appId) {
    missingKeys.push('VITE_FIREBASE_APP_ID');
  }

  const configured = missingKeys.length === 0 && invalidKeys.length === 0;
  let diagnosticMessage = '';

  if (!configured) {
    const parts: string[] = [];
    if (missingKeys.length > 0) {
      parts.push(`Missing environment variable(s): ${missingKeys.join(', ')}`);
    }
    if (invalidKeys.length > 0) {
      parts.push(`Invalid configuration: ${invalidKeys.join(', ')}`);
    }
    diagnosticMessage = `Firebase Authentication is not configured (${parts.join('; ')}). Set these in .env.local (for project "${DEFAULT_PROJECT_ID}") and restart the Vite server.`;
  }

  return {
    configured,
    isEmulator: false,
    projectId: config.projectId,
    authDomain: config.authDomain,
    missingKeys,
    invalidKeys,
    diagnosticMessage,
  };
};

export const isFirebaseConfigured = (): boolean => {
  return getFirebaseConfigDiagnostics().configured;
};

// Singleton references
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let functionsInstance: Functions | null = null;
let lastInitError: string = '';

export const resetFirebaseInstances = () => {
  app = null;
  db = null;
  auth = null;
  storage = null;
  functionsInstance = null;
  lastInitError = '';
};

export const initFirebase = (): {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  functions: Functions | null;
  configured: boolean;
  error?: string;
} => {
  if (app && auth) {
    return { app, db, auth, storage, functions: functionsInstance, configured: true };
  }

  const config = getFirebaseEnvConfig();
  const diagnostics = getFirebaseConfigDiagnostics();

  if (!diagnostics.configured) {
    lastInitError = diagnostics.diagnosticMessage;
    console.error('[Firebase] Configuration check failed:', diagnostics.diagnosticMessage);
    return {
      app: null,
      db: null,
      auth: null,
      storage: null,
      functions: null,
      configured: false,
      error: diagnostics.diagnosticMessage,
    };
  }

  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    auth = getAuth(app);
  } catch (error: any) {
    lastInitError = `Firebase Auth initialization failed: ${error?.message || String(error)}`;
    console.error('[Firebase] Auth initialization error:', error);
    return {
      app: null,
      db: null,
      auth: null,
      storage: null,
      functions: null,
      configured: false,
      error: lastInitError,
    };
  }

  // Initialize non-Auth services in isolated blocks so they cannot disable Firebase Auth
  try {
    db = getFirestore(app);
  } catch (error) {
    console.error('[Firebase] Firestore initialization error:', error);
  }

  try {
    storage = isStorageConfigured() ? getStorage(app) : null;
  } catch (error) {
    console.error('[Firebase] Storage initialization error:', error);
  }

  try {
    functionsInstance = getFunctions(app);
  } catch (error) {
    console.error('[Firebase] Functions initialization error:', error);
  }

  if (isEmulatorMode()) {
    try {
      if (db) connectFirestoreEmulator(db, '127.0.0.1', 8080);
      if (auth) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      if (storage) connectStorageEmulator(storage, '127.0.0.1', 9199);
      if (functionsInstance) connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5001);
      console.info('[Firebase] Connected to Local Firebase Emulator Suite');
    } catch {
      // Emulator already connected
    }
  }

  lastInitError = '';
  return { app, db, auth, storage, functions: functionsInstance, configured: true };
};
