
"use client"
import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ChevronRight, Phone, Clock, Loader2, PackageX, History, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AuthModal } from '@/components/AuthModal';

export default function OrdersHistoryPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();

  // If user is logged in, query by userId. Otherwise, query by customerPhone if triggered.
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    
    if (user) {
      return query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }
    
    if (searchTriggered && phoneNumber.length === 10) {
      return query(
        collection(db, 'orders'),
        where('customerPhone', '==', phoneNumber),
        orderBy('createdAt', 'desc')
      );
    }
    
    return null;
  }, [db, user, phoneNumber, searchTriggered]);

  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length === 10) {
      setSearchTriggered(true);
    }
  };

  const loading = userLoading || ordersLoading;

  return (
    <div className="min-h-screen bg-secondary/10 pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 md:pt-32">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <History className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-headline font-black">My <span className="text-primary italic">Orders</span></h1>
            <p className="text-muted-foreground font-medium">
              {user ? `Welcome back, ${user.displayName?.split(' ')[0]}! Here are your recent bites.` : 'Sign in to see your history or search by number.'}
            </p>
          </div>

          {!user && (
            <Card className="rounded-[32px] border-none shadow-2xl p-6 md:p-10 bg-card">
              <div className="space-y-6">
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full h-14 rounded-2xl font-black text-lg bg-primary gap-3 shadow-xl"
                >
                  <User className="w-5 h-5" /> Sign In for Full History
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-dashed" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-4 font-black opacity-30">Or search guest orders</span></div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-3">
                      <span className="text-xs font-black">+91</span>
                    </div>
                    <Input 
                      type="tel"
                      value={phoneNumber} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhoneNumber(val);
                        setSearchTriggered(false);
                      }} 
                      className="h-14 pl-20 rounded-2xl font-black text-lg focus:ring-primary/20" 
                      placeholder="00000 00000"
                    />
                  </div>
                  <Button type="submit" disabled={phoneNumber.length < 10} variant="outline" className="h-14 rounded-2xl px-10 font-black text-lg border-2">
                    Find Orders
                  </Button>
                </form>
              </div>
            </Card>
          )}

          <div className="space-y-6">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Searching your orders...</p>
              </div>
            ) : (user || searchTriggered) ? (
              orders && orders.length > 0 ? (
                orders.map((order: any) => (
                  <Link key={order.id} href={`/orders/${order.orderId}`}>
                    <Card className="rounded-[2rem] border-none shadow-xl bg-white/90 backdrop-blur overflow-hidden group hover:shadow-2xl transition-all mb-6">
                      <CardContent className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-lg truncate">#{order.orderId}</h4>
                              <Badge variant="outline" className={cn(
                                "text-[8px] uppercase font-black px-2 py-0.5 rounded-full border-none",
                                order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                              )}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" /> 
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recent'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between w-full md:w-auto gap-8">
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Amount</p>
                            <p className="text-2xl font-black text-primary italic">₹{order.total}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
                    <PackageX className="w-10 h-10 text-muted-foreground opacity-20" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-2">No orders found</h3>
                    <p className="text-muted-foreground font-medium">We couldn't find any orders {user ? 'under your account' : 'for this phone number'}.</p>
                  </div>
                  <Link href="/menu">
                    <Button className="rounded-full px-10 h-14 font-black">Browse Menu</Button>
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
