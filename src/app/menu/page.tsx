"use client"
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { FoodCard } from '@/components/FoodCard';
import { Search, Loader2, PackageX, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  const [activeCategory, setActiveCategory] = useState('All');
  
  const db = useFirestore();

  useEffect(() => {
    if (urlQuery) setSearchQuery(urlQuery);
  }, [urlQuery]);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);

  const { data: menuItems, loading, error } = useCollection<FoodItem>(productsQuery);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiet = dietFilter === 'all' || 
                        (dietFilter === 'veg' && item.isVeg) || 
                        (dietFilter === 'non-veg' && !item.isVeg);
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      
      return matchesSearch && matchesDiet && matchesCategory;
    });
  }, [menuItems, searchQuery, dietFilter, activeCategory]);

  const filterChips = [
    { label: 'All', value: 'all', type: 'category' },
    { label: 'Veg', value: 'veg', type: 'diet' },
    { label: 'Non Veg', value: 'non-veg', type: 'diet' },
    ...CATEGORIES.filter(c => c !== 'All').map(c => ({ label: c, value: c, type: 'category' }))
  ];

  const handleChipClick = (chip: any) => {
    if (chip.type === 'diet') {
      setDietFilter(dietFilter === chip.value ? 'all' : chip.value);
    } else {
      setActiveCategory(chip.value === 'all' ? 'All' : chip.value);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-8 py-4 pt-20 md:pt-32 max-w-6xl">
        {/* COMPACT SEARCH (Center aligned for premium feel) */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search dishes, burgers, momos..." 
              className="h-14 pl-14 rounded-[2rem] border-none bg-secondary/50 text-base font-bold placeholder:text-muted-foreground/40 shadow-inner focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* STICKY APP-STYLE FILTER CHIPS */}
        <div className="sticky top-[60px] md:top-20 z-40 -mx-4 px-4 py-4 bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide snap-x max-w-6xl mx-auto">
            {filterChips.map((chip, idx) => {
              const isActive = (chip.type === 'diet' && dietFilter === chip.value) || 
                             (chip.type === 'category' && (activeCategory === chip.label || (activeCategory === 'All' && chip.value === 'all')));
              
              return (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className={cn(
                    "rounded-full px-5 h-10 font-black uppercase text-[10px] tracking-widest transition-all shrink-0 border snap-start flex items-center gap-2",
                    isActive 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                      : "bg-white dark:bg-zinc-900 border-muted text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {chip.type === 'diet' && chip.value !== 'all' && (
                    <div className={cn("w-2 h-2 rounded-full", chip.value === 'veg' ? "bg-green-500" : "bg-red-500")} />
                  )}
                  {chip.label}
                </button>
              );
            })}
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
             <Button variant="outline" className="mt-8 rounded-full h-12 px-10 border-destructive/20 text-destructive font-black uppercase text-[10px]" onClick={() => window.location.reload()}>Try Again</Button>
           </div>
        ) : filteredItems.length > 0 ? (
          <div className="py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {filteredItems.map((item) => (
                <FoodCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-32 text-center space-y-8 max-w-xl mx-auto">
            <div className="w-28 h-28 bg-secondary/50 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner">
              <PackageX className="w-14 h-14 text-muted-foreground opacity-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase tracking-tighter">No Matches <span className="text-primary italic">Found.</span></h3>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed px-10">Try refining your search or filter chips.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(''); setDietFilter('all'); setActiveCategory('All'); }} 
              className="rounded-full h-14 px-12 font-black uppercase text-[11px] tracking-widest border-2 shadow-xl"
            >
              Reset Filters
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
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
