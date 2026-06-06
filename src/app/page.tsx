
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PromoBanner } from '@/components/PromoBanner';
import { SavorTool } from '@/components/SavorTool';
import { 
  ArrowRight, History, Utensils, Loader2,
  HelpCircle, Instagram, Twitter, Facebook,
  ShieldCheck, Clock, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FoodCard } from '@/components/FoodCard';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { FoodItem } from '@/app/lib/store';
import { Logo } from '@/components/Logo';

export default function Home() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const db = useFirestore();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const highlightsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      where('isAvailable', '==', true),
      limit(6)
    );
  }, [db]);

  const { data: menuItems, loading: menuLoading } = useCollection<FoodItem>(highlightsQuery);

  const heroBg = "https://picsum.photos/seed/ezzybites-dark-hero/1920/1080";

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1">
        {/* CINEMATIC HERO SECTION */}
        <section className="relative min-h-[90vh] flex items-center pt-24 pb-20 overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <Image 
              src={heroBg}
              alt="Premium Background"
              fill
              className="object-cover opacity-60"
              priority
              data-ai-hint="dark luxury food background"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-10" />
          </div>

          <div className="container mx-auto px-6 relative z-20 max-w-5xl text-center">
            <div className="space-y-12 animate-in fade-in zoom-in duration-1000">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-2xl px-6 py-2.5 rounded-full border border-white/10 shadow-2xl">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/80">Premium Fast Food Redefined</span>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-5xl md:text-[8rem] font-headline font-black leading-[0.85] tracking-tighter text-white uppercase">
                  Flavor that <br />
                  <span className="text-primary italic">Commands</span> <br />
                  Respect.
                </h1>
                <p className="text-base md:text-xl text-white/60 max-w-xl mx-auto leading-relaxed font-medium">
                  Elevate your daily ritual with chef-crafted flavors delivered right to your sanctuary. Fresh ingredients, lightning speed.
                </p>
              </div>

              <div className="flex justify-center pt-4">
                <Link href="/menu">
                  <Button className="rounded-full h-18 md:h-20 px-14 text-xl font-black shadow-3xl bg-primary hover:bg-primary/90 text-white transform transition-all active:scale-95 uppercase tracking-tight gap-4">
                    Start Your Order
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SIGNATURE SELECTION */}
        <section className="py-24 bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
              <div className="space-y-2">
                <Badge variant="outline" className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">Chef's Special</Badge>
                <h2 className="text-5xl md:text-7xl font-black font-headline uppercase tracking-tighter">Signature <span className="text-primary italic">Highlights.</span></h2>
              </div>
              <Link href="/menu">
                <Button variant="ghost" className="font-black text-[12px] uppercase tracking-widest gap-3 text-primary hover:bg-primary/5 h-14 px-8 rounded-2xl border-2 border-primary/10">
                  Full Menu <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {menuLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-[2.5rem]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                {menuItems?.map((item) => (
                  <FoodCard key={item.id} item={item} forceViewMode="small" />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3D OFFERS */}
        <section className="py-16 bg-secondary/10 dark:bg-zinc-900/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-6 mb-12">
               <div className="h-px bg-border flex-1" />
               <h2 className="text-2xl font-black uppercase tracking-tighter whitespace-nowrap">Exclusive <span className="text-primary italic">Bounties</span></h2>
               <div className="h-px bg-border flex-1" />
            </div>
            <PromoBanner />
          </div>
        </section>

        {/* AI INTELLIGENCE */}
        <section className="py-24 container mx-auto px-4">
          <SavorTool />
        </section>

        {/* TRUST SIGNALS */}
        <section className="py-24 bg-white dark:bg-zinc-950 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { icon: Utensils, title: "Master Chefs", desc: "Crafted by professionals who prioritize technique and flavor above all else." },
                { icon: Clock, title: "Hyper-Local", desc: "A strict 25-minute delivery promise for all local sanctuary orders." },
                { icon: ShieldCheck, title: "Gold Standard", desc: "Only A-grade ingredients. No preservatives, just pure, unadulterated taste." }
              ].map((f, i) => (
                <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 p-12 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-border/20 group text-center">
                  <div className="w-20 h-20 bg-orange-gradient rounded-[2rem] flex items-center justify-center mb-8 text-white shadow-2xl mx-auto group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <f.icon className="w-9 h-9" />
                  </div>
                  <h4 className="text-2xl font-black mb-4 uppercase tracking-tight">{f.title}</h4>
                  <p className="text-muted-foreground font-medium text-base leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SUPPORT */}
        <section className="py-24 container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16 space-y-4">
            <HelpCircle className="w-16 h-16 text-primary mx-auto opacity-20" />
            <h2 className="text-5xl font-headline font-black uppercase tracking-tighter">Support Core</h2>
            <p className="text-muted-foreground font-medium">Resolving your inquiries with precision.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {[
              { q: "What is your delivery range?", a: "We serve a 3km radius around Pocharam and Anurag University campus for peak freshness." },
              { q: "Is there a student special?", a: "Yes! Use code STUDENT10 at checkout for 10% OFF on all orders above ₹200." },
              { q: "How do you handle bulk orders?", a: "For event catering, contact our hotline via WhatsApp for a custom logistics plan." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-none bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl px-8 shadow-sm overflow-hidden mb-4">
                <AccordionTrigger className="font-bold text-lg hover:no-underline py-8 text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-8 text-base font-medium leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="bg-white dark:bg-zinc-950 border-t pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <Logo size="lg" />
              <p className="text-muted-foreground leading-relaxed text-base font-medium">Culinary art and lightning-fast logistics. Redefining campus life one bite at a time.</p>
              <div className="flex gap-4">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <Button key={i} variant="outline" size="icon" className="w-12 h-12 rounded-2xl text-muted-foreground hover:text-primary border-2"><Icon className="w-6 h-6" /></Button>
                ))}
              </div>
            </div>
            <div className="lg:col-start-3 space-y-8">
              <h4 className="font-black text-sm uppercase tracking-widest opacity-40">Core Navigation</h4>
              <ul className="space-y-4 text-muted-foreground font-bold text-base">
                <li><Link href="/menu" className="hover:text-primary flex items-center gap-3">Menu selection</Link></li>
                <li><Link href="/orders" className="hover:text-primary flex items-center gap-3">Order history</Link></li>
              </ul>
            </div>
            <div className="space-y-8">
              <h4 className="font-black text-sm uppercase tracking-widest opacity-40">Operational</h4>
              <ul className="space-y-4 text-muted-foreground font-bold text-base">
                <li><Link href="/admin/login" className="hover:text-primary flex items-center gap-3">Staff console</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-12 text-center">
            <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.4em] opacity-40">© {currentYear || 2025} Ezzy Bites Premium Food-Tech</p>
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
