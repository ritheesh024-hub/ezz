"use client"
import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ChevronRight, Clock, Loader2, PackageX, History, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AuthModal } from '@/components/AuthModal';

export default function OrdersHistoryPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();

  const ordersQuery = useMemo(() => {
    if (!db) return null;
    
    // Authenticated User Search
    if (user) {
      return query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        limit(50)
      );
    }
    
    // Guest Phone Search
    if (searchTriggered && phoneNumber.length === 10) {
      return query(
        collection(db, 'orders'),
        where('customerPhone', '==', phoneNumber),
        limit(50)
      );
    }
    
    return null;
  }, [db, user, phoneNumber, searchTriggered]);

  const { data: rawOrders, loading: ordersLoading, error } = useCollection<any>(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    });
  }, [rawOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length === 10) {
      setSearchTriggered(true);
    }
  };

  const loading = userLoading || ordersLoading;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 pb-10">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-16 md:pt-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <History className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-headline tracking-tighter">My <span className="text-primary italic">Orders</span></h1>
            <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-widest opacity-60">
              {user ? `History node: ${user.displayName?.split(' ')[0] || 'Member'}` : 'Track your delicious history.'}
            </p>
          </div>

          {!user && !searchTriggered && (
            <Card className="rounded-2xl border-none shadow-xl p-6 md:p-10 bg-white dark:bg-zinc-900 animate-in zoom-in-95">
              <div className="space-y-6">
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full h-12 rounded-xl font-black text-base bg-orange-gradient gap-3 shadow-lg"
                >
                  <User className="w-4 h-4" /> Sign In for History
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-dashed opacity-20" /></div>
                  <div className="relative flex justify-center text-[8px] uppercase tracking-[0.2em]"><span className="bg-white dark:bg-zinc-900 px-4 font-black opacity-30">Or search guest orders</span></div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 border-r pr-3 border-muted/50">
                      <span className="text-[10px] font-black">+91</span>
                    </div>
                    <Input 
                      type="tel"
                      value={phoneNumber} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhoneNumber(val);
                        setSearchTriggered(false);
                      }} 
                      className="h-12 pl-16 rounded-xl font-black text-base bg-secondary/50 border-none" 
                      placeholder="00000 00000"
                    />
                  </div>
                  <Button type="submit" disabled={phoneNumber.length < 10} className="h-12 rounded-xl px-8 font-black text-base bg-primary text-white">
                    Track
                  </Button>
                </form>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto opacity-30" />
                <p className="font-black text-[8px] uppercase tracking-widest text-muted-foreground opacity-40">Fetching ledger...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center space-y-4 bg-destructive/5 rounded-3xl border-2 border-dashed border-destructive/10 p-8">
                <AlertCircle className="w-12 h-12 text-destructive opacity-30 mx-auto" />
                <h3 className="text-xl font-black text-destructive uppercase tracking-tighter">Sync Interrupted</h3>
                <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">Check connection and retry.</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl h-10 px-8 font-black uppercase text-[8px] border-2">Retry Sync</Button>
              </div>
            ) : (user || searchTriggered) ? (
              orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <Link key={order.id} href={`/orders/${order.orderId}`}>
                    <Card className="rounded-2xl border-none shadow-sm hover:shadow-lg transition-all group bg-white dark:bg-zinc-900 overflow-hidden active:scale-[0.98]">
                      <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-black text-base tracking-tight">#{order.orderId}</h4>
                              <Badge className={cn(
                                "text-[7px] uppercase font-black px-1.5 py-0.5 rounded-[4px] border-none",
                                order.status === 'delivered' ? 'bg-emerald-500 text-white' : 
                                order.status === 'Cancelled' ? 'bg-rose-500 text-white' : 
                                'bg-orange-500 text-white'
                              )}>
                                {order.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-tight">
                              <Clock className="w-3 h-3 opacity-40" /> 
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Syncing...'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8 pt-3 sm:pt-0 border-t sm:border-none border-zinc-50 dark:border-zinc-800">
                          <div className="text-left sm:text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-0.5">Total</p>
                            <p className="text-xl font-black text-primary italic leading-none">₹{order.total}</p>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-secondary dark:bg-zinc-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center space-y-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border">
                  <div className="w-16 h-16 bg-secondary dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto opacity-20">
                    <PackageX className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black mb-1 uppercase tracking-tighter">Your tray is <span className="text-primary italic">Empty</span></h3>
                    <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-40">No orders recorded yet.</p>
                  </div>
                  <Link href="/menu">
                    <Button className="rounded-xl h-12 px-10 font-black uppercase text-[9px] tracking-widest bg-orange-gradient">Start Selection</Button>
                  </Link>
                </div>
              )
            ) : null}
          </div>
        </div>
      </main>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
