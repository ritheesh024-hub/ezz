"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Plus, Minus, Clock, Sparkles } from 'lucide-react';
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
    if (item.isBeverage || item.isCustomizable) {
       if (delta > 0) setIsCustomizing(true);
       else toast({ title: "Manage in Tray", description: "Use the tray drawer to adjust." });
       return;
    }
    
    const targetItem = cart.find(i => i.id === item.id);
    if (targetItem) {
      updateQuantity(targetItem.cartId, delta);
    }
  };

  return (
    <>
      {/* ADAPTIVE MOBILE CARD (List for very small, Grid for others) */}
      <div className="flex md:hidden flex-col h-full bg-white dark:bg-zinc-900 rounded-[18px] border border-border/40 shadow-sm overflow-hidden relative group active:scale-[0.98] transition-all">
        {/* Top-Left Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          <Badge className="bg-white/90 dark:bg-black/90 backdrop-blur text-foreground border-none font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[8px] shadow-sm">
            <Star className="w-2.5 h-2.5 fill-primary text-primary" />
            {item.rating || '4.5'}
          </Badge>
          <div className={cn(
            "w-3.5 h-3.5 bg-white/90 dark:bg-black/90 rounded border flex items-center justify-center shadow-sm",
            item.isVeg ? "border-green-500" : "border-red-500"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
          </div>
        </div>

        {/* Image Area */}
        <div className="relative aspect-square w-full overflow-hidden bg-secondary/10">
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
          {item.isFeatured && (
            <div className="absolute bottom-0 left-0 right-0 bg-primary/90 py-0.5 text-[8px] font-black text-white text-center uppercase tracking-widest">
              Bestseller
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-3 flex flex-col flex-1 justify-between gap-2">
          <div className="space-y-1">
            <h4 className="font-black text-[11px] leading-tight uppercase line-clamp-2 min-h-[1.5rem]">{item.name}</h4>
            <div className="flex items-center gap-2">
              <span className="text-primary font-black italic text-sm">₹{item.price}</span>
              {item.discountPrice! > 0 && <span className="text-[8px] line-through opacity-30 font-bold">₹{item.discountPrice}</span>}
            </div>
          </div>

          <div className="flex justify-end">
            <div className="relative h-8 min-w-[60px]">
              {cartItemCount > 0 ? (
                <div className="flex items-center justify-between w-full h-full bg-orange-gradient text-white rounded-lg px-1 shadow-lg">
                  <button onClick={(e) => handleQtyChange(-1, e)} className="p-1"><Minus className="w-3 h-3" /></button>
                  <span className="text-[10px] font-black">{cartItemCount}</span>
                  <button onClick={(e) => handleQtyChange(1, e)} className="p-1"><Plus className="w-3 h-3" /></button>
                </div>
              ) : (
                <Button 
                  onClick={handleAddClick}
                  variant="outline"
                  className="w-full h-full rounded-lg font-black text-[9px] uppercase border-primary/20 text-primary bg-primary/5 p-0"
                >
                  ADD <Plus className="ml-1 w-2.5 h-2.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP/TABLET GRID CARD */}
      <div className="hidden md:flex flex-col h-full group bg-white dark:bg-zinc-900 rounded-[2rem] border border-border/40 hover:shadow-2xl hover:scale-[1.03] transition-all duration-500 overflow-hidden relative">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {item.isFeatured && (
              <Badge className="bg-orange-gradient text-white border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl">
                <Sparkles className="w-3 h-3 mr-1" /> Bestseller
              </Badge>
            )}
            <Badge className="bg-white/90 dark:bg-black/90 backdrop-blur text-foreground border-none font-black px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] shadow-sm">
              <Star className="w-3 h-3 fill-primary text-primary" />
              {item.rating || '4.5'}
              <span className="opacity-40 font-bold ml-0.5">({item.reviewCount || '120+'})</span>
            </Badge>
          </div>
          <div className="absolute top-4 right-4 z-10">
             <div className={cn("w-6 h-6 bg-white/90 dark:bg-black/90 backdrop-blur rounded-lg border-2 flex items-center justify-center shadow-lg", item.isVeg ? "border-green-500" : "border-red-500")}>
              <div className={cn("w-2 h-2 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-sm font-black uppercase tracking-tight line-clamp-2 leading-tight min-h-[2.5rem]">{item.name}</h3>
              <Badge variant="outline" className="text-[8px] font-black uppercase border-muted text-muted-foreground shrink-0">{item.category}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed font-medium opacity-60">{item.description}</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-dashed mt-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-primary italic text-xl">₹{item.price}</span>
            </div>
            <div className="relative">
              {cartItemCount > 0 ? (
                <div className="flex items-center gap-2 bg-orange-gradient text-white rounded-xl h-10 px-2 shadow-lg">
                  <button onClick={(e) => handleQtyChange(-1, e)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="text-xs font-black w-4 text-center">{cartItemCount}</span>
                  <button onClick={(e) => handleQtyChange(1, e)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <Button onClick={handleAddClick} className="rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[9px] bg-white dark:bg-zinc-800 text-primary border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm">
                  ADD <Plus className="ml-1 w-3 h-3" />
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
