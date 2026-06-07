
'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/app/lib/store';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<{
    app: FirebaseApp | null;
    db: Firestore | null;
    auth: Auth | null;
  } | null>(null);

  const { isDarkMode } = useStore();

  useEffect(() => {
    const initialized = initializeFirebase();
    setServices(initialized);
  }, []);

  // Sync dark mode class on mount and when state changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  // Show a clean loading state if services aren't initialized yet
  if (!services) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If app failed to initialize due to config issues, we still provide the context
  // but components using useFirestore/useAuth will need to handle nulls
  return (
    <FirebaseProvider 
      app={services.app as FirebaseApp} 
      db={services.db as Firestore} 
      auth={services.auth as Auth}
    >
      {children}
    </FirebaseProvider>
  );
}
