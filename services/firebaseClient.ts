/**
 * Firebase Client
 * Initializes the Firebase app and exports the Auth instance.
 * All other data services (products, orders, profiles, etc.) continue to use Supabase.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key] as string;
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  return '';
};

const firebaseConfig = {
  apiKey:            getEnv('VITE_FIREBASE_API_KEY'),
  authDomain:        getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             getEnv('VITE_FIREBASE_APP_ID'),
};

// Avoid re-initializing if HMR reloads this module
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
