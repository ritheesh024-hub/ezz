'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * IDEMPOTENT FIREBASE INITIALIZATION
 * Uses a global singleton pattern to survive Next.js Fast Refresh
 * and prevent "Unexpected state (ID: ca9)" errors in Firestore.
 */

declare global {
  var __FIREBASE_APP__: FirebaseApp | undefined;
  var __FIREBASE_DB__: Firestore | undefined;
  var __FIREBASE_AUTH__: Auth | undefined;
}

export function initializeFirebase(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null;
} {
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null };
  }

  try {
    // 1. Initialize or retrieve the App
    if (!globalThis.__FIREBASE_APP__) {
      globalThis.__FIREBASE_APP__ = getApps().length === 0 
        ? initializeApp(firebaseConfig) 
        : getApp();
    }

    // 2. Initialize or retrieve Firestore
    if (!globalThis.__FIREBASE_DB__) {
      globalThis.__FIREBASE_DB__ = getFirestore(globalThis.__FIREBASE_APP__);
    }

    // 3. Initialize or retrieve Auth
    if (!globalThis.__FIREBASE_AUTH__) {
      globalThis.__FIREBASE_AUTH__ = getAuth(globalThis.__FIREBASE_APP__);
    }
    
    return { 
      app: globalThis.__FIREBASE_APP__, 
      db: globalThis.__FIREBASE_DB__, 
      auth: globalThis.__FIREBASE_AUTH__
    };
  } catch (error) {
    console.error('Firebase Critical Init Error:', error);
    return { app: null, db: null, auth: null };
  }
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './error-emitter';
export * from './errors';
