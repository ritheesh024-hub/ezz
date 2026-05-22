'use client';

/**
 * @fileOverview Firebase configuration using environment variables.
 * IMPORTANT: You must create a file named '.env' in the root directory
 * and add your Firebase project keys there.
 * 
 * Example .env content:
 * NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
 * NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
 * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
 * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 * NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
