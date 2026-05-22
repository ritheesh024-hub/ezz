import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services safely.
 * Returns null for services if the config is invalid to prevent runtime crashes.
 */
export function initializeFirebase(): { app: FirebaseApp | null; db: Firestore | null; auth: Auth | null } {
  // Strict check for the API Key
  const isConfigValid = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== '' && 
    firebaseConfig.apiKey !== 'undefined' &&
    !firebaseConfig.apiKey.includes('your_');

  if (!isConfigValid) {
    console.warn('Firebase configuration is missing or incomplete. Please check your .env file.');
    return { app: null, db: null, auth: null };
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const auth = getAuth(app);

    return { app, db, auth };
  } catch (error) {
    console.error('Failed to initialize Firebase services:', error);
    return { app: null, db: null, auth: null };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './error-emitter';
export * from './errors';
