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
  useEffect(() => {
    // Survives re-renders within the same module instance
    if (initRef.current) return;
    initRef.current = true;
    
    const initialized = initializeFirebase();
    if (initialized.app) {
      setServices(initialized);
      setMounted(true);
    }
  }, []);

  // 2. Handle theme syncing independently
  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode, mounted]);

  // CRITICAL: Block rendering of all children until services are ready
  // This prevents listeners from being created before the SDK is in a stable state.
  if (!mounted || !services.app) {
    return null;
  }

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
