
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { AdminSection } from '@/components/AdminSection';
import { Button } from '@/components/ui/button';
import { ShoppingBag, LogOut, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

const ADMIN_EMAIL = 'sunnyritheesh@gmail.com';

export default function AdminDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (user.email !== ADMIN_EMAIL) {
        // Force logout if logged in with wrong account
        if (auth) {
          auth.signOut().then(() => {
            toast({
              variant: "destructive",
              title: "Access Restricted",
              description: `Only ${ADMIN_EMAIL} is authorized to access the operational console.`,
            });
            router.push('/admin/login');
          });
        } else {
          router.push('/admin/login');
        }
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, userLoading, router, auth]);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      toast({ title: "Logged out successfully" });
      router.push('/admin/login');
    }
  };

  if (userLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Establishing Secure Connection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-white sticky top-0 z-[60]">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-lg shadow-primary/20">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-headline font-black tracking-tight">
              Ezzy<span className="text-primary">Bites</span> <span className="text-muted-foreground font-black text-[9px] ml-2 tracking-[0.2em] uppercase opacity-50">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end mr-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40 leading-none mb-1">Session Authorized</span>
              <span className="text-xs font-bold text-foreground">{user?.email}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-12 px-6 gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-destructive hover:text-white hover:border-destructive transition-all border-2" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <AdminSection />
      </main>
    </div>
  );
}
