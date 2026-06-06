'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Menu, X, User, LogOut, History, ShieldCheck, LayoutDashboard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useUser, useAuth, useFirestore, useDoc } from '@/firebase';
import { AuthModal } from './AuthModal';
import { CartDrawer } from './CartDrawer';
import { useStore } from '@/app/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
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
  const [navSearch, setNavSearch] = useState('');
  
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { cart } = useStore();
  const router = useRouter();

  // Role Verification
  const userDocRef = useMemo(() => user && db ? doc(db, 'users', user.uid) : null, [user, db]);
  const adminDocRef = useMemo(() => user && db ? doc(db, 'admins', user.uid) : null, [user, db]);
  
  const { data: customerProfile, loading: customerLoading } = useDoc(userDocRef);
  const { data: adminProfile, loading: adminLoading } = useDoc(adminDocRef);

  const isCustomer = !!customerProfile;
  const isStaff = !!adminProfile;

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      router.push(`/menu?q=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
    }
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 px-4",
      scrolled 
        ? "bg-white/30 dark:bg-black/30 backdrop-blur-2xl border-b border-white/10 py-2 shadow-2xl" 
        : "bg-white/5 dark:bg-black/5 backdrop-blur-sm py-4"
    )}>
      <div className="container mx-auto">
        <div className="h-14 md:h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 bg-orange-gradient rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-lg shadow-primary/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className={cn(
              "text-xl font-headline font-black tracking-tighter hidden sm:inline transition-colors duration-500",
              scrolled ? "text-foreground" : "text-white"
            )}>
              Ezzy<span className="text-primary italic">Bites</span>
            </span>
          </Link>

          {/* Search Bar - iPhone Style */}
          <div className="flex-1 max-w-lg hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <Search className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                scrolled ? "text-muted-foreground" : "text-white/40",
                "group-focus-within:text-primary"
              )} />
              <Input 
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search premium bites..." 
                className={cn(
                  "w-full h-11 pl-11 pr-4 rounded-full border-none transition-all font-medium text-sm focus:ring-2 focus:ring-primary/20",
                  scrolled 
                    ? "bg-secondary/40 focus:bg-white dark:focus:bg-zinc-900" 
                    : "bg-white/10 text-white placeholder:text-white/40 focus:bg-white/20 backdrop-blur-xl"
                )}
              />
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className={cn(
            "hidden xl:flex items-center gap-6 transition-colors duration-500",
            scrolled ? "text-foreground" : "text-white/80"
          )}>
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Home</Link>
            <Link href="/menu" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Menu</Link>
            <Link href="/orders" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Orders</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <CartDrawer>
              <Button variant="ghost" size="icon" className={cn(
                "rounded-full w-10 h-10 transition-all relative",
                scrolled ? "hover:bg-primary/5 text-foreground" : "hover:bg-white/10 text-white"
              )}>
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </Button>
            </CartDrawer>

            {!userLoading && !customerLoading && !adminLoading && (
              user ? (
                isStaff && !isCustomer ? (
                  <Link href="/admin/dashboard">
                    <Button variant="outline" className="rounded-xl h-10 px-4 gap-2 font-black uppercase text-[9px] tracking-widest border-primary/20 bg-primary/5 text-primary">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Dash
                    </Button>
                  </Link>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="outline-none rounded-full ring-offset-background focus:ring-2 focus:ring-primary/20 transition-transform active:scale-95">
                        <Avatar className="h-10 w-10 border border-background shadow-md">
                          <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                          <AvatarFallback className="bg-orange-gradient text-white font-black text-[10px]">
                            {user.displayName?.slice(0, 2).toUpperCase() || 'EB'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-3 border-none shadow-3xl bg-white dark:bg-zinc-900 mt-2">
                      <DropdownMenuLabel className="px-4 py-4">
                        <p className="text-sm font-black uppercase tracking-tight truncate">{user.displayName || user.email?.split('@')[0]}</p>
                        <p className="text-[10px] font-medium opacity-50 truncate">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-2xl py-3 font-bold cursor-pointer hover:bg-primary/5">
                        <Link href="/orders" className="flex items-center gap-3">
                          <History className="w-5 h-5 text-primary" /> My History
                        </Link>
                      </DropdownMenuItem>
                      {isStaff && (
                        <DropdownMenuItem asChild className="rounded-2xl py-3 font-bold cursor-pointer hover:bg-orange-50">
                          <Link href="/admin/dashboard" className="flex items-center gap-3 text-orange-600">
                            <ShieldCheck className="w-5 h-5" /> Staff Console
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="rounded-2xl py-3 font-bold text-destructive cursor-pointer hover:bg-destructive/5 flex items-center gap-3">
                        <LogOut className="w-5 h-5" /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              ) : (
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="rounded-full px-5 h-10 font-black uppercase text-[10px] tracking-widest bg-orange-gradient text-white shadow-lg hidden md:flex"
                >
                  Sign In
                </Button>
              )
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "md:hidden rounded-full w-10 h-10",
                scrolled ? "text-foreground" : "text-white"
              )} 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden mt-2 pb-2">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5",
            scrolled ? "text-muted-foreground" : "text-white/40"
          )} />
          <Input 
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="Search..." 
            className={cn(
              "w-full h-10 pl-10 rounded-full border-none text-xs font-medium",
              scrolled 
                ? "bg-secondary/50 focus:bg-white" 
                : "bg-white/10 text-white placeholder:text-white/40 backdrop-blur-xl"
            )}
          />
        </form>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-zinc-950 border-t border-border animate-in slide-in-from-top duration-300 shadow-2xl">
          <div className="flex flex-col p-6 gap-2">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-primary/5 rounded-2xl">Home</Link>
            <Link href="/menu" onClick={() => setIsMenuOpen(false)} className="px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-primary/5 rounded-2xl">Menu</Link>
            <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="px-6 py-4 font-black uppercase tracking-widest text-[11px] hover:bg-primary/5 rounded-2xl">Orders</Link>
            {!user ? (
              <Button 
                onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }} 
                className="mt-4 h-14 rounded-2xl bg-orange-gradient font-black uppercase text-[11px]"
              >
                Join the Family
              </Button>
            ) : (
              <>
                {isStaff && (
                  <Link href="/admin/dashboard" onClick={() => setIsMenuOpen(false)} className="px-6 py-4 font-black uppercase tracking-widest text-[11px] text-primary flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Staff Console
                  </Link>
                )}
                <button 
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
                  className="px-6 py-4 font-black uppercase tracking-widest text-[11px] text-destructive text-left hover:bg-destructive/5 rounded-2xl"
                >
                  Sign Out
                </button>
              </>
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