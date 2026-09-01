/**
 * Firebase Client
 * Initializes the Firebase app and exports the Auth instance.
 * All other data services (products, orders, profiles, etc.) continue to use Supabase.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const getEnv = (viteKey: string | undefined, processKey: string): string => {
  if (viteKey) return viteKey;
  if (typeof process !== 'undefined' && process.env && process.env[processKey]) {
    return process.env[processKey] as string;
  }
  return '';
};

const firebaseConfig = {
  apiKey:            getEnv(import.meta.env.VITE_FIREBASE_API_KEY, 'VITE_FIREBASE_API_KEY'),
  authDomain:        getEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         getEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID, 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     getEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             getEnv(import.meta.env.VITE_FIREBASE_APP_ID, 'VITE_FIREBASE_APP_ID'),
};

// Avoid re-initializing if HMR reloads this module
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
