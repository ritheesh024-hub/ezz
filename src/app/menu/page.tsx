
"use client"
import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { FoodCard } from '@/components/FoodCard';
import { MENU_ITEMS, CATEGORIES } from '@/app/lib/menu-data';
import { Search, Filter, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-black mb-4">Our <span className="text-primary">Delicious</span> Menu</h1>
          <p className="text-muted-foreground max-w-2xl">
            From our signature Maggie recipes to authentic Hyderabadi Biryani, explore our chef-crafted menu.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search dishes..." 
              className="h-14 pl-12 rounded-2xl border-muted bg-secondary/50 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`rounded-full px-8 h-12 font-bold transition-all ${selectedCategory === cat ? 'shadow-lg shadow-primary/20' : 'hover:border-primary hover:text-primary'}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom duration-500">
                <FoodCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground opacity-30" />
            </div>
            <h3 className="text-2xl font-headline font-bold mb-2">No dishes found</h3>
            <p className="text-muted-foreground">Try searching for something else or explore a different category.</p>
            <Button 
              variant="link" 
              onClick={() => {setSelectedCategory('All'); setSearchQuery('');}}
              className="mt-4 text-primary font-bold"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
