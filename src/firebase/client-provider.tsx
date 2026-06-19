'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { useStore } from '@/app/lib/store';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState<{
    app: any;
    db: any;
    auth: any;
  }>({ app: null, db: null, auth: null });

  const { isDarkMode } = useStore();
  const initRef = useRef(false);

  // 1. Initialize Firebase strictly ONCE after browser mount
  // This avoids initializing during SSR and prevents Fast Refresh double-init
  useEffect(() => {
    if (initRef.current) return;
    
    setMounted(true);
    const initialized = initializeFirebase();
    setServices(initialized);
    initRef.current = true;
  }, []);

  // 2. Handle theme syncing independently of Firebase state
  // Using document.documentElement ensures the dark class is applied early
  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode, mounted]);

  // Avoid rendering children that might use Firebase hooks until services are ready
  // This prevents hooks from being called with null instances initially
  return (
    <FirebaseProvider 
      app={services.app} 
      db={services.db} 
      auth={services.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
