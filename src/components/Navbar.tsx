'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X, User, LogOut, History, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { AuthModal } from './AuthModal';
import { CartDrawer } from './CartDrawer';
import { useStore } from '@/app/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const { cart } = useStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
    }
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
      scrolled ? "py-2" : "py-4 md:py-6"
    )}>
      <div className="container mx-auto px-4">
        <div className={cn(
          "h-14 md:h-16 flex items-center justify-between px-4 md:px-6 transition-all duration-500",
          scrolled 
            ? "glass rounded-full shadow-2xl shadow-black/5" 
            : "bg-transparent"
        )}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-lg shadow-primary/20">
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            <span className={cn(
              "text-lg md:text-2xl font-headline font-black tracking-tight transition-colors",
              !scrolled ? "text-white" : "text-foreground"
            )}>
              Ezzy<span className="text-primary">Bites</span>
            </span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            
            <Link href="/orders">
              <Button variant="ghost" size="sm" className={cn(
                "rounded-full gap-2 px-5 font-black uppercase text-[10px] tracking-widest transition-colors",
                !scrolled ? "text-white hover:bg-white/10" : "text-foreground"
              )}>
                <History className="w-4 h-4" />
                Track History
              </Button>
            </Link>

            <CartDrawer>
              <Button variant="ghost" size="icon" className={cn(
                "rounded-full w-10 h-10 transition-colors relative",
                !scrolled ? "text-white hover:bg-white/10" : "text-foreground"
              )}>
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center animate-in zoom-in">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </Button>
            </CartDrawer>

            {!userLoading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="outline-none focus:ring-2 focus:ring-primary/20 rounded-full transition-transform active:scale-95">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                        <AvatarFallback className="bg-primary text-white font-black text-xs">
                          {user.displayName?.slice(0, 2).toUpperCase() || 'EB'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-none shadow-3xl bg-white dark:bg-zinc-900">
                    <DropdownMenuLabel className="px-3 py-2">
                      <p className="text-xs font-black uppercase tracking-tight truncate">{user.displayName}</p>
                      <p className="text-[10px] font-medium opacity-50 truncate">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-xl py-2.5 font-bold cursor-pointer">
                      <Link href="/orders" className="flex items-center gap-3">
                        <History className="w-4 h-4 text-primary" /> My History
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="rounded-xl py-2.5 font-bold text-destructive cursor-pointer flex items-center gap-3">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  variant="ghost" 
                  size="sm"
                  className={cn(
                    "rounded-full px-6 h-11 font-black uppercase text-[10px] tracking-widest transition-all",
                    !scrolled ? "text-white border-white/20 hover:bg-white/10" : "text-foreground border"
                  )}
                >
                  <User className="w-3.5 h-3.5 mr-2" /> Sign In
                </Button>
              )
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <CartDrawer>
              <Button variant="ghost" size="icon" className={cn(
                "rounded-full w-10 h-10 transition-colors relative",
                !scrolled ? "text-white" : "text-foreground"
              )}>
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-primary text-white text-[7px] font-black rounded-full flex items-center justify-center">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </Button>
            </CartDrawer>
            <Button variant="ghost" size="icon" className={cn(
              "rounded-full w-10 h-10 transition-colors",
              !scrolled ? "text-white" : "text-foreground"
            )} onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass border-t border-white/10 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-6 gap-2">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors">Home</Link>
            <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors">Order History</Link>
            {!user ? (
              <button 
                onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }} 
                className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-primary text-left"
              >
                Sign In / Join
              </button>
            ) : (
              <button 
                onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
                className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-destructive text-left"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  );
};