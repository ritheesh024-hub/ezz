'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * HARDENED FIREBASE SINGLETON
 * Prevents "ca9" Unexpected State errors by ensuring exactly one instance 
 * of each service exists globally, surviving Next.js HMR.
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
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null };
  }

  try {
    // 1. Return cached instances if they exist
    if (globalThis.__FIREBASE_INSTANCES__) {
      return globalThis.__FIREBASE_INSTANCES__;
    }

    // 2. Initialize App and Services
    const apps = getApps();
    const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    const instances: FirebaseInstances = { app, db, auth };
    
    // 3. Cache globally to prevent re-initialization during HMR
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
