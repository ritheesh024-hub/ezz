'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, terminate } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

// Module-level singletons to maintain state across HMR and navigation
let firebaseApp: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let firebaseAuth: Auth | undefined;

/**
 * Initializes Firebase services safely on the client side only.
 * Uses a defensive singleton pattern to prevent multiple initializations.
 */
export function initializeFirebase(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null;
} {
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null };
  }

  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('AIza')) {
    // Basic validation passed
  } else {
    return { app: null, db: null, auth: null };
  }

  try {
    // 1. App Singleton
    if (!firebaseApp) {
      firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    }

    // 2. Service Singletons: Ensure we don't recreate if already present
    // Re-using existing instances is critical to prevent "Unexpected state" errors
    if (!firestore) {
      firestore = getFirestore(firebaseApp);
    }

    if (!firebaseAuth) {
      firebaseAuth = getAuth(firebaseApp);
    }
    
    return { 
      app: firebaseApp, 
      db: firestore, 
      auth: firebaseAuth
    };
  } catch (error) {
    console.error('Firebase Init Error:', error);
    return { app: null, db: null, auth: null };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './error-emitter';
export * from './errors';
