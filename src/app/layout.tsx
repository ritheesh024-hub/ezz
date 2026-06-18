'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { BrandIntro } from '@/components/BrandIntro';
import { SmartPermissionModal } from '@/components/SmartPermissionModal';
import { useSmartPermissions } from '@/hooks/use-smart-permissions';
import Script from 'next/script';
import React, { useEffect } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { useNotifications } from '@/hooks/use-notifications';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

function AnalyticsInitializer() {
  const { trackAppOpen } = useAnalytics();
  
  useEffect(() => {
    trackAppOpen();
  }, [trackAppOpen]);
  
  return null;
}

function NotificationInitializer() {
  const { notifications } = useNotifications();
  
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      const isNew = latest.createdAt?.toDate && (Date.now() - latest.createdAt.toDate().getTime()) < 10000;
      
      if (isNew && !latest.read) {
        toast({
          title: latest.title,
          description: latest.body,
        });
      }
    }
  }, [notifications]);

  return null;
}

function PermissionController() {
  const { activeRequest, closeRequest, confirmRequest, requestSmartly } = useSmartPermissions();
  const { user } = useUser();

  // Smart Trigger: 30 seconds after app usage
  useEffect(() => {
    const timer = setTimeout(() => {
      requestSmartly('notifications');
    }, 30000);
    return () => clearTimeout(timer);
  }, [requestSmartly]);

  // Smart Trigger: On sign in
  useEffect(() => {
    if (user) {
      requestSmartly('notifications');
    }
  }, [user, requestSmartly]);

  return (
    <SmartPermissionModal 
      type={activeRequest} 
      onClose={closeRequest} 
      onConfirm={confirmRequest} 
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background">
        <FirebaseClientProvider>
          <AnalyticsInitializer />
          <NotificationInitializer />
          <PermissionController />
          <BrandIntro />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
