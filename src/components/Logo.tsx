
'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
  size?: 'sm' | 'md' | 'lg';
  hideText?: boolean;
}

export const Logo = ({ className, variant = 'color', size = 'md', hideText = false }: LogoProps) => {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', iconContainer: 'w-8 h-8 rounded-lg' },
    md: { icon: 'w-8 h-8', text: 'text-2xl', iconContainer: 'w-11 h-11 rounded-xl' },
    lg: { icon: 'w-12 h-12', text: 'text-4xl', iconContainer: 'w-16 h-16 rounded-2xl' }
  };

  const colors = {
    light: 'text-white',
    dark: 'text-foreground',
    color: 'text-foreground'
  };

  return (
    <div className={cn("flex items-center gap-2 md:gap-3 group select-none", className)}>
      <div className={cn(
        "flex items-center justify-center bg-orange-gradient transform group-hover:rotate-12 transition-all duration-500 shadow-xl shadow-primary/20",
        sizes[size].iconContainer
      )}>
        <ShoppingBag className={cn("text-white", sizes[size].icon)} />
      </div>
      {!hideText && (
        <span className={cn(
          "font-headline font-black tracking-tighter leading-none transition-colors duration-500",
          colors[variant],
          sizes[size].text
        )}>
          Ezzy<span className="text-primary italic">Bites</span>
        </span>
      )}
    </div>
  );
};
