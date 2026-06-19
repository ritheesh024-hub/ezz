"use client"
import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { isDarkMode, toggleDarkMode } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("rounded-full w-10 h-10 transition-all opacity-0", className)}
      >
        <Moon className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className={cn("rounded-full w-10 h-10 transition-all", className)}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-zinc-500" />
      )}
    </Button>
  );
};
