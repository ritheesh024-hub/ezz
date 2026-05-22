
'use client';

import { useState, useEffect, useCallback } from 'react';

// Premium, lightweight UI sound URLs
const SOUNDS = {
  pop: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Add to cart
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Order success
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Button tap
  error: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3', // Error/Warning
  update: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3', // Quantity update
};

export type SoundType = keyof typeof SOUNDS;

export function useSound() {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ezzy-bites-muted');
    if (saved !== null) {
      setIsMuted(saved === 'true');
    }
  }, []);

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    localStorage.setItem('ezzy-bites-muted', String(newState));
  };

  const playSound = useCallback((type: SoundType) => {
    if (typeof window === 'undefined' || isMuted) return;

    try {
      const audio = new Audio(SOUNDS[type]);
      audio.volume = 0.4; // Soft premium volume
      audio.play().catch(() => {
        // Handle autoplay restrictions gracefully
      });
    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  }, [isMuted]);

  return { playSound, isMuted, toggleMute };
}
