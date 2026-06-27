'use client';

import React from 'react';
import { useOffline } from '@/hooks/use-offline';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineBanner = () => {
  const isOffline = useOffline();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-zinc-950 text-white shadow-2xl"
        >
          <div className="container mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-rose-600 rounded-lg flex items-center justify-center animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">
                Offline Mode <span className="opacity-40 ml-2">• Showing Saved Content</span>
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-md">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Local Cache Active</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
