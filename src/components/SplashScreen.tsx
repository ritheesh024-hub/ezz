'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

/**
 * CONFIGURATION
 * Set to false to only show the splash screen once per session.
 */
const SHOW_SPLASH_EVERY_TIME = true;

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isRendered, setIsRendered] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // 1. Check if we should show the splash screen
    const hasSeenSplash = sessionStorage.getItem('eb_splash_shown');
    
    // Check if mobile (screen < 768px)
    const isMobile = window.innerWidth < 768;

    if (!isMobile || (hasSeenSplash && !SHOW_SPLASH_EVERY_TIME)) {
      setIsVisible(false);
      return;
    }

    // 2. Prepare for animation
    setIsRendered(true);
    
    // Small delay to ensure browser is ready for CSS transitions
    const startTimer = setTimeout(() => {
      setShouldAnimate(true);
    }, 50);

    // 3. Set total duration (1.8 seconds is the sweet spot)
    const endTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('eb_splash_shown', 'true');
    }, 1800);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, []);

  if (!isRendered || !isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out",
        shouldAnimate ? "opacity-100" : "opacity-0",
        !isVisible && "opacity-0 pointer-events-none"
      )}
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute w-64 h-64 bg-primary/20 rounded-full blur-[100px] transition-all duration-1000 delay-300",
        shouldAnimate ? "opacity-100 scale-125" : "opacity-0 scale-50"
      )} />

      {/* Logo Animation */}
      <div className={cn(
        "relative z-10 transition-all duration-700 ease-out transform",
        shouldAnimate ? "opacity-100 scale-100" : "opacity-0 scale-90"
      )}>
        <Logo size="lg" hideText variant="light" />
      </div>

      {/* Brand Text Animation */}
      <div className={cn(
        "mt-6 relative z-10 transition-all duration-700 delay-500 ease-out transform",
        shouldAnimate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <h1 className="text-4xl font-black font-headline tracking-tighter text-white uppercase">
          Ezzy<span className="text-primary italic">Bites</span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30">
            Premium Fast Food-Tech
          </p>
          <span className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
        </div>
      </div>

      {/* Bottom Loading Bar (Optional app-feel) */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className={cn(
          "h-full bg-primary transition-all duration-[1500ms] ease-out",
          shouldAnimate ? "w-full" : "w-0"
        )} />
      </div>
    </div>
  );
};
