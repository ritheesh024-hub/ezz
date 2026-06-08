"use client"
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { FoodCard } from '@/components/FoodCard';
import { Search, Loader2, PackageX, AlertCircle, Sparkles, ChevronRight, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { FoodItem } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/app/lib/menu-data';

function MenuContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  
  const db = useFirestore();

  useEffect(() => {
    if (urlQuery) setSearchQuery(urlQuery);
  }, [urlQuery]);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);

  const { data: menuItems, loading, error } = useCollection<FoodItem>(productsQuery);

  const categorizedItems = useMemo(() => {
    if (!menuItems) return {};
    
    const items = menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiet = dietFilter === 'all' || 
                        (dietFilter === 'veg' && item.isVeg) || 
                        (dietFilter === 'non-veg' && !item.isVeg);
      return matchesSearch && matchesDiet;
    });

    const groups: Record<string, FoodItem[]> = {};
    
    // Add "BestSellers" section if any exist
    const popular = items.filter(i => i.isBestSeller || i.isFeatured);
    if (popular.length > 0) groups['🔥 Popular Picks'] = popular;

    // Group by standard categories
    CATEGORIES.forEach(cat => {
      if (cat === 'All') return;
      const catItems = items.filter(i => i.category === cat);
      if (catItems.length > 0) groups[cat] = catItems;
    });

    return groups;
  }, [menuItems, searchQuery, dietFilter]);

  const hasGroups = Object.keys(categorizedItems).length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32 max-w-7xl">
        {/* APP HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter uppercase leading-none">
              Premium <span className="text-primary italic">Menu.</span>
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium tracking-wide">Handpicked ingredients for an elite experience.</p>
          </div>
          
          <div className="flex gap-2">
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDietFilter(dietFilter === 'veg' ? 'all' : 'veg')}
                className={cn(
                  "h-10 rounded-full px-6 gap-2 font-black uppercase text-[10px] tracking-widest border-2 transition-all",
                  dietFilter === 'veg' ? "border-green-500 bg-green-50 text-green-700 shadow-md" : "border-muted text-muted-foreground"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", dietFilter === 'veg' ? "bg-green-500" : "bg-zinc-300")} />
                Veg Only
              </Button>
          </div>
        </div>

        {/* STICKY SEARCH & CATEGORY TABS */}
        <div className="sticky top-20 z-40 mb-12 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-2xl border-y border-border/40 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-center max-w-7xl mx-auto">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Find a dish, cuisine or ingredient..." 
                className="h-12 pl-12 rounded-2xl border-none bg-secondary/40 text-sm font-bold placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto scrollbar-hide pb-1 lg:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    const el = document.getElementById(`section-${cat}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="rounded-full px-6 h-10 font-black uppercase text-[9px] tracking-widest transition-all shrink-0 border bg-white dark:bg-zinc-900 border-muted hover:border-primary/40 hover:text-primary shadow-sm hover:shadow-md"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center gap-6">
             <div className="relative">
                <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center animate-pulse" />
                <Loader2 className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
             </div>
             <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground animate-pulse">Synchronizing Kitchen...</p>
          </div>
        ) : error ? (
           <div className="py-24 text-center bg-destructive/5 rounded-[3rem] border-2 border-destructive/10 border-dashed max-w-2xl mx-auto">
             <AlertCircle className="w-16 h-16 text-destructive/30 mx-auto mb-6" />
             <h3 className="text-2xl font-black text-destructive uppercase tracking-tighter">Sync Interrupted</h3>
             <p className="text-sm text-muted-foreground mt-2 font-medium">Check your connection or try reloading the menu.</p>
             <Button variant="outline" className="mt-8 rounded-full h-12 px-10 border-destructive/20 text-destructive hover:bg-destructive/5 font-black uppercase text-[10px]" onClick={() => window.location.reload()}>Try Again</Button>
           </div>
        ) : hasGroups ? (
          <div className="space-y-16 md:space-y-24 pb-20">
            {Object.entries(categorizedItems).map(([category, items]) => (
              <section key={category} id={`section-${category}`} className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="flex items-center justify-between mb-8 md:mb-12">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/5 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-primary shadow-inner">
                      {category.includes('Popular') ? <Sparkles className="w-6 h-6 md:w-8 md:h-8" /> : <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />}
                    </div>
                    <div className="space-y-0.5">
                       <h2 className="text-2xl md:text-4xl font-black font-headline uppercase tracking-tighter">{category}</h2>
                       <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">{items.length} Curated Options</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                  {items.map((item) => (
                    <FoodCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center space-y-8 max-w-xl mx-auto">
            <div className="w-28 h-28 bg-secondary/50 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner relative">
              <PackageX className="w-14 h-14 text-muted-foreground opacity-10" />
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-lg border-2 border-muted flex items-center justify-center"><Filter className="w-5 h-5 opacity-20" /></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase tracking-tighter">No Matches <span className="text-primary italic">Found.</span></h3>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed px-10">We couldn't find any dishes matching your current filters. Try refining your search or dietary choices.</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setDietFilter('all'); }} className="rounded-full h-14 px-12 font-black uppercase text-[11px] tracking-widest border-2 shadow-xl shadow-primary/5 active:scale-95 transition-all">
              Reset All Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="font-black uppercase tracking-[0.3em] text-[9px] text-muted-foreground animate-pulse">Initializing Interface...</p>
        </div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
