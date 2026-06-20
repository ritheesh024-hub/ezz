'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * IDEMPOTENT FIREBASE INITIALIZATION (HARDENED SINGLETON)
 * Uses a global registry to survive Next.js module re-evaluations during HMR.
 */

interface FirebaseInstances {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

declare global {
  var __FIREBASE_INSTANCES__: FirebaseInstances | undefined;
}

export function initializeFirebase(): { 
  app: FirebaseApp | null; 
  db: Firestore | null; 
  auth: Auth | null;
} {
  // 1. Strict browser check
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null };
  }

  try {
    // 2. Check global cache first to prevent "Unexpected state (ID: ca9)" errors during HMR
    if (globalThis.__FIREBASE_INSTANCES__) {
      return globalThis.__FIREBASE_INSTANCES__;
    }

    // 3. Initialize or retrieve the App Registry
    const apps = getApps();
    const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];

    // 4. Retrieve Services (Singletons for this app instance)
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    const instances: FirebaseInstances = { app, db, auth };
    
    // 5. Cache globally to survive Next.js module re-evaluations
    globalThis.__FIREBASE_INSTANCES__ = instances;
    
    return instances;
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
