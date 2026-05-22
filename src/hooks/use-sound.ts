
'use client';

import { useCallback } from 'react';
import { useStore } from '@/app/lib/store';

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
  const { isMuted, toggleMute } = useStore();

  const playSound = useCallback((type: SoundType) => {
    if (typeof window === 'undefined' || isMuted) return;

    try {
      const audio = new Audio(SOUNDS[type]);
      audio.volume = 0.4; // Soft premium volume
      audio.play().catch((err) => {
        // Log error only in dev mode if needed
        // console.warn('Audio playback blocked by browser policies', err);
      });
    } catch (e) {
      console.warn('Audio initialization failed', e);
    }
  }, [isMuted]);

  return { playSound, isMuted, toggleMute };
}
