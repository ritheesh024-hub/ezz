"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Plus, Minus, Sparkles } from 'lucide-react';
import { FoodItem, useStore, BeverageOptions } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BeverageCustomizer } from './BeverageCustomizer';

interface FoodCardProps {
  item: FoodItem;
}

export const FoodCard = ({ item }: FoodCardProps) => {
  const { cart, addToCart, updateQuantity } = useStore();
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  const cartItemCount = cart.filter(i => i.id === item.id).reduce((acc, i) => acc + i.quantity, 0);

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item.isBeverage || item.isCustomizable) {
      setIsCustomizing(true);
    } else {
      addToCart(item);
      toast({ title: "Added to Tray", description: `${item.name} ready.` });
    }
  };

  const handleCustomizationConfirm = (options: BeverageOptions) => {
    addToCart(item, options);
    setIsCustomizing(false);
    toast({ title: "Custom Order Added", description: `${item.name} (${options.size}) added.` });
  };

  const handleQtyChange = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    const targetItem = cart.find(i => i.id === item.id);
    if (targetItem) {
      updateQuantity(targetItem.cartId, delta);
    } else if (delta > 0) {
      handleAddClick(e);
    }
  };

  return (
    <>
      <div className="group relative flex bg-white dark:bg-zinc-900 rounded-[2rem] border border-border/40 hover:shadow-xl transition-all duration-300 overflow-hidden p-3 md:p-5 gap-4 md:gap-6 items-center">
        {/* IMAGE SECTION */}
        <div className="relative w-28 h-28 md:w-40 md:h-40 shrink-0 rounded-2xl md:rounded-3xl overflow-hidden bg-secondary/30 shadow-inner">
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            className="object-cover group-hover:scale-110 transition-transform duration-700" 
            unoptimized 
          />
          
          {/* VEG/NON-VEG ICON */}
          <div className="absolute top-2 left-2 z-10">
             <div className={cn(
               "w-5 h-5 bg-white/90 dark:bg-black/90 backdrop-blur rounded border flex items-center justify-center shadow-sm",
               item.isVeg ? "border-green-500" : "border-red-500"
             )}>
              <div className={cn("w-2 h-2 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
            </div>
          </div>

          {item.isFeatured && (
            <div className="absolute bottom-0 left-0 right-0 bg-primary/90 py-1 text-[8px] font-black text-white text-center uppercase tracking-widest">
              Bestseller
            </div>
          )}
        </div>

        {/* CONTENT SECTION */}
        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
          <div className="space-y-1 md:space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[7px] md:text-[9px] font-black uppercase border-muted text-muted-foreground tracking-tighter">
                {item.category}
              </Badge>
              <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-none font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[8px] md:text-[10px]">
                <Star className="w-2.5 h-2.5 fill-current" />
                {item.rating || '4.5'}
              </Badge>
            </div>
            
            <h3 className="text-sm md:text-xl font-black uppercase tracking-tight leading-tight line-clamp-1 md:line-clamp-2">
              {item.name}
            </h3>
            
            <p className="text-[10px] md:text-sm text-muted-foreground line-clamp-1 md:line-clamp-2 leading-relaxed opacity-60 font-medium">
              {item.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 md:mt-4">
            <div className="flex flex-col">
              <span className="text-lg md:text-2xl font-black text-primary italic">₹{item.price}</span>
              {item.discountPrice! > 0 && (
                <span className="text-[10px] md:text-xs line-through opacity-30 font-bold">₹{item.discountPrice}</span>
              )}
            </div>

            <div className="relative">
              {cartItemCount > 0 ? (
                <div className="flex items-center gap-2 md:gap-3 bg-orange-gradient text-white rounded-xl md:rounded-2xl h-10 md:h-12 px-2 md:px-3 shadow-lg">
                  <button onClick={(e) => handleQtyChange(-1, e)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Minus className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                  <span className="text-xs md:text-sm font-black w-4 md:w-6 text-center">{cartItemCount}</span>
                  <button onClick={(e) => handleQtyChange(1, e)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                </div>
              ) : (
                <Button 
                  onClick={handleAddClick} 
                  className="rounded-xl md:rounded-2xl h-10 md:h-12 px-4 md:px-8 font-black uppercase tracking-widest text-[9px] md:text-[11px] bg-white dark:bg-zinc-800 text-primary border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  ADD <Plus className="ml-1 w-3 h-3 md:w-4 md:h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {(item.isBeverage || item.isCustomizable) && (
        <BeverageCustomizer item={item} isOpen={isCustomizing} onClose={() => setIsCustomizing(false)} onConfirm={handleCustomizationConfirm} />
      )}
    </>
  );
};
