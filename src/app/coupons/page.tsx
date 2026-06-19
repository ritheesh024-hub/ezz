'use client';

import React, { useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { TicketPercent, Copy, Check, Info, Sparkles, Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CouponsPage() {
  const db = useFirestore();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const couponsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'coupons'), where('isActive', '==', true));
  }, [db]);

  const { data: coupons, loading } = useCollection<any>(couponsQuery);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Code Copied!", description: "Apply this at checkout for the bounty." });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-1">
             <div className="flex items-center gap-3 bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20 mb-2">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black uppercase tracking-widest text-primary">Exclusive Bounties</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black font-headline uppercase tracking-tighter">Available <span className="text-primary italic">Offers.</span></h1>
             <p className="text-muted-foreground text-sm font-medium">Claim your rewards and save on your next feast.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-[2.5rem]" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-32 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed shadow-3xl">
             <TicketPercent className="w-20 h-20 text-muted-foreground opacity-10 mx-auto mb-6" />
             <h3 className="text-2xl font-black uppercase tracking-tighter">No Active Bounties</h3>
             <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">Check back soon for new seasonal offers and flash sales.</p>
             <Link href="/menu" className="inline-block mt-8">
               <Button className="rounded-full px-10 h-14 font-black uppercase text-[10px] tracking-widest bg-primary shadow-xl shadow-primary/20">Browse Menu</Button>
             </Link>
          </div>
        ) : (
          <div className="grid gap-8">
            {coupons.map((coupon) => (
              <Card key={coupon.code} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white dark:bg-zinc-900 group">
                <div className="flex flex-col md:flex-row">
                  {/* LEFT: Branding/Amount */}
                  <div className="md:w-1/3 bg-orange-gradient p-8 text-white flex flex-col justify-center items-center text-center relative overflow-hidden shrink-0">
                     <div className="absolute inset-0 bg-black/5" />
                     <div className="relative z-10 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Up To</p>
                        <h2 className="text-6xl font-black font-headline italic leading-none">{coupon.discount}{coupon.type === 'percent' ? '%' : '₹'}</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest">OFFER</p>
                     </div>
                     <div className="absolute -left-4 -bottom-4 opacity-10 rotate-12"><TicketPercent className="w-32 h-32" /></div>
                  </div>

                  {/* RIGHT: Details */}
                  <div className="flex-1 p-8 md:p-10 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                       <div className="flex justify-between items-start">
                          <h3 className="text-2xl font-black uppercase tracking-tighter">{coupon.code}</h3>
                          {coupon.expiryDate && (
                            <Badge variant="outline" className="rounded-full border-muted text-[8px] font-black uppercase px-3 py-1 flex items-center gap-2">
                               <Clock className="w-3 h-3 text-primary" /> Exp: {coupon.expiryDate}
                            </Badge>
                          )}
                       </div>
                       <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                         "{coupon.description || 'Special limited time offer for the elite community.'}"
                       </p>
                       <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border">
                             <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                             <span className="text-[9px] font-black uppercase">Min Order: ₹{coupon.minOrderValue || 0}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-xl border">
                             <AlertCircle className="w-3.5 h-3.5 text-primary" />
                             <span className="text-[9px] font-black uppercase">Single Use</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <Button 
                         onClick={() => handleCopy(coupon.code)}
                         className={cn(
                           "flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 transition-all",
                           copiedCode === coupon.code ? "bg-emerald-600 hover:bg-emerald-600" : "bg-zinc-950 hover:bg-primary"
                         )}
                       >
                         {copiedCode === coupon.code ? (
                           <><Check className="w-4 h-4" /> Copied!</>
                         ) : (
                           <><Copy className="w-4 h-4" /> Copy Code</>
                         )}
                       </Button>
                       <Link href="/menu" className="flex-1">
                         <Button variant="outline" className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 hover:bg-primary/5">
                           Order Now
                         </Button>
                       </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-16 p-8 bg-primary/5 rounded-[2.5rem] border border-dashed border-primary/20 flex flex-col md:flex-row items-center gap-8">
           <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-3xl flex items-center justify-center text-primary shadow-xl shrink-0">
             <Info className="w-8 h-8" />
           </div>
           <div className="space-y-1 text-center md:text-left">
              <h4 className="font-black uppercase text-xs">Policy Intelligence</h4>
              <p className="text-[11px] font-medium leading-relaxed text-muted-foreground max-w-xl italic">
                Only one coupon can be applied per checkout node. Bounties cannot be combined with referral credits. Referral coins however are independent and stack with your coin balance.
              </p>
           </div>
        </div>
      </main>
    </div>
  );
}
