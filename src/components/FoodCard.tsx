"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Plus, Minus, Clock, Sparkles, Settings2 } from 'lucide-react';
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
      toast({
        title: "Added to Tray",
        description: `${item.name} ready for checkout.`,
      });
    }
  };

  const handleCustomizationConfirm = (options: BeverageOptions) => {
    addToCart(item, options);
    setIsCustomizing(false);
    toast({
      title: "Custom Order Added",
      description: `${item.name} (${options.size}) added.`,
    });
  };

  const handleQtyChange = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (item.isBeverage || item.isCustomizable) {
       if (delta > 0) setIsCustomizing(true);
       else toast({ title: "Manage in Cart", description: "Use the tray drawer to adjust customizations." });
       return;
    }
    
    const targetItem = cart.find(i => i.id === item.id);
    if (targetItem) {
      updateQuantity(targetItem.cartId, delta);
    }
  };

  return (
    <>
      {/* DESKTOP & TABLET CARD */}
      <div className="hidden md:flex flex-col h-full group bg-white dark:bg-zinc-900 rounded-[2rem] border border-border/40 hover:shadow-2xl hover:scale-[1.03] transition-all duration-500 overflow-hidden relative">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Overlays */}
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

          <div className="absolute bottom-4 left-4 z-10">
            <Badge variant="secondary" className="bg-black/40 backdrop-blur-md text-white border-none font-black px-2 py-1 rounded-lg text-[8px] uppercase tracking-widest">
              <Clock className="w-2.5 h-2.5 mr-1" /> {item.prepTime || 20}m
            </Badge>
          </div>
          
          <div className="absolute top-4 right-4 z-10">
             <div className={cn(
              "w-6 h-6 bg-white/90 dark:bg-black/90 backdrop-blur rounded-lg border-2 flex items-center justify-center shadow-lg",
              item.isVeg ? "border-green-500" : "border-red-500"
            )}>
              <div className={cn("w-2 h-2 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-sm font-black uppercase tracking-tight line-clamp-2 leading-tight min-h-[2.5rem]">
                {item.name}
              </h3>
              <Badge variant="outline" className="text-[8px] font-black uppercase border-muted text-muted-foreground shrink-0">{item.category}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed font-medium opacity-60">
              {item.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-dashed mt-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-primary italic text-xl">₹{item.price}</span>
              {item.discountPrice! > 0 && <span className="text-[9px] line-through opacity-30 font-bold">₹{item.discountPrice}</span>}
            </div>

            <div className="relative">
              {cartItemCount > 0 ? (
                <div className="flex items-center gap-2 bg-orange-gradient text-white rounded-xl h-10 px-2 shadow-lg animate-in zoom-in duration-300">
                  <button onClick={(e) => handleQtyChange(-1, e)} className="w-6 h-6 rounded-md hover:bg-white/20 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-black w-4 text-center">{cartItemCount}</span>
                  <button onClick={(e) => handleQtyChange(1, e)} className="w-6 h-6 rounded-md hover:bg-white/20 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                </div>
              ) : (
                <Button 
                  onClick={handleAddClick}
                  className="rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[9px] bg-white dark:bg-zinc-800 text-primary border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  ADD <Plus className="ml-1 w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE LIST CARD (Zomato Style) */}
      <div className="md:hidden flex bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-border/40 p-3 gap-4 group active:scale-[0.98] transition-all">
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-md">
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
          <div className="absolute top-2 left-2">
            <div className={cn(
              "w-4 h-4 bg-white/90 dark:bg-black/90 rounded border flex items-center justify-center",
              item.isVeg ? "border-green-500" : "border-red-500"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", item.isVeg ? "bg-green-500" : "bg-red-500")} />
            </div>
          </div>
          {item.isFeatured && (
             <div className="absolute bottom-0 left-0 right-0 bg-primary/90 py-0.5 text-[7px] font-black text-white text-center uppercase tracking-widest">
               Bestseller
             </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <Badge className="bg-green-500 text-white border-none h-4 px-1 rounded-sm gap-0.5 text-[8px] font-black">
                 {item.rating || '4.5'} <Star className="w-2 h-2 fill-white" />
               </Badge>
               <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                 <Clock className="w-2.5 h-2.5" /> {item.prepTime || 20}m
               </span>
            </div>
            <h4 className="font-black text-sm uppercase leading-tight tracking-tight truncate pr-4">{item.name}</h4>
            <p className="text-[10px] text-muted-foreground line-clamp-1 opacity-60">{item.description}</p>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-primary font-black italic text-lg leading-none">₹{item.price}</span>
              {item.discountPrice! > 0 && <span className="text-[8px] line-through opacity-30 font-bold">₹{item.discountPrice}</span>}
            </div>

            <div className="relative h-9 min-w-[70px]">
              {cartItemCount > 0 ? (
                <div className="flex items-center justify-between w-full h-full bg-orange-gradient text-white rounded-lg px-1.5 shadow-lg">
                  <button onClick={(e) => handleQtyChange(-1, e)} className="p-1"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-black">{cartItemCount}</span>
                  <button onClick={(e) => handleQtyChange(1, e)} className="p-1"><Plus className="w-3 h-3" /></button>
                </div>
              ) : (
                <Button 
                  onClick={handleAddClick}
                  variant="outline"
                  className="w-full h-full rounded-lg font-black text-[9px] uppercase border-primary/20 text-primary bg-primary/5 p-0"
                >
                  ADD <Plus className="ml-1 w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {(item.isBeverage || item.isCustomizable) && (
        <BeverageCustomizer 
          item={item} 
          isOpen={isCustomizing} 
          onClose={() => setIsCustomizing(false)} 
          onConfirm={handleCustomizationConfirm} 
        />
      )}
    </>
  );
};
