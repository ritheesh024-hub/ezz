"use client"
import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { FoodCard } from '@/components/FoodCard';
import { CATEGORIES } from '@/app/lib/menu-data';
import { Search, Loader2, PackageX, AlertCircle, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { FoodItem } from '@/app/lib/store';
import { cn } from '@/lib/utils';

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const db = useFirestore();

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);

  const { data: menuItems, loading, error } = useCollection<FoodItem>(productsQuery);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 pt-28 md:pt-40">
        <div className="mb-16 space-y-4">
          <Badge variant="outline" className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">The Selection</Badge>
          <h1 className="text-5xl md:text-8xl font-headline font-black leading-none">Fresh <span className="text-primary">Bites</span> Only.</h1>
          <p className="text-muted-foreground max-w-2xl text-lg font-medium">
            From our legendary Maggie variations to premium Hydrabadi specialties, explore our chef-curated menu.
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="sticky top-20 z-40 mb-16 space-y-6">
          <div className="glass p-3 md:p-5 rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row gap-4 items-center border border-white/20">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="What are you craving?" 
                className="h-16 pl-14 rounded-full border-none bg-secondary/40 text-lg font-bold placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex overflow-x-auto gap-3 pb-2 w-full lg:w-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className={cn(
                    "rounded-full px-8 h-14 font-black uppercase text-[10px] tracking-widest transition-all",
                    selectedCategory === cat ? "shadow-xl shadow-primary/20" : "bg-transparent border-muted hover:border-primary hover:text-primary"
                  )}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center gap-6">
             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
             <p className="font-black uppercase tracking-widest text-xs text-muted-foreground">Kitchen is firing up...</p>
          </div>
        ) : error ? (
           <div className="py-40 text-center bg-destructive/5 rounded-[3rem] border-2 border-destructive/20 border-dashed">
             <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-6" />
             <p className="text-destructive font-black text-xl uppercase tracking-tighter">Inventory Sync Failed</p>
             <p className="text-sm text-muted-foreground mt-2 font-medium">Check your connection or refresh the page.</p>
           </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredItems.map((item) => (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom duration-700">
                <FoodCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center space-y-8">
            <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
              <PackageX className="w-12 h-12 text-muted-foreground opacity-30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-headline font-black">No matches found</h3>
              <p className="text-muted-foreground font-medium text-lg">Try a different category or clear your search.</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="rounded-full h-14 px-10 font-black uppercase text-[10px] tracking-widest">
              Show All Dishes
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}