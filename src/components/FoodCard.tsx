
"use client"
import React from 'react';
import Image from 'next/image';
import { Star, Heart, Plus, Minus, Clock } from 'lucide-react';
import { FoodItem, useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import placeholderData from '@/app/lib/placeholder-images.json';

export const FoodCard = ({ item }: { item: FoodItem }) => {
  const { cart, addToCart, updateQuantity } = useStore();
  
  const cartItem = cart.find(i => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  // Find the specific placeholder hint for this item's image
  const imgData = placeholderData.placeholderImages.find(img => img.imageUrl === item.image);
  const aiHint = imgData?.imageHint || item.category.toLowerCase();

  const handleAdd = () => {
    addToCart(item);
    toast({
      title: "Added to cart",
      description: `${item.name} is ready for checkout.`,
    });
  };

  return (
    <div className="group bg-card rounded-3xl border overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full shadow-sm">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image 
          src={item.image} 
          alt={item.name} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          data-ai-hint={aiHint}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {item.isVeg ? (
            <div className="bg-white/90 backdrop-blur px-1.5 py-1.5 rounded-md border border-green-500 shadow-sm">
               <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-700" />
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur px-1.5 py-1.5 rounded-md border border-red-500 shadow-sm">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-700" />
            </div>
          )}
        </div>
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Heart className="w-4 h-4" />
        </button>
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-white/90 backdrop-blur text-foreground border shadow-sm font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {item.rating}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 flex flex-col flex-1">
        <div className="mb-2">
          <h3 className="text-base md:text-lg font-black line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{item.name}</h3>
          <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem] leading-relaxed font-medium">
            {item.description}
          </p>
        </div>

        <div className="flex items-center gap-3 text-[9px] md:text-[10px] text-muted-foreground mb-4 uppercase tracking-widest font-black opacity-70">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> 20-30 MINS
          </span>
          <span className="flex items-center gap-1 text-primary">
             10% OFF
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-headline font-black text-primary leading-none">₹{item.price}</span>
            <span className="text-[9px] md:text-[10px] text-muted-foreground line-through opacity-50">₹{Math.round(item.price * 1.1)}</span>
          </div>

          {quantity === 0 ? (
            <Button 
              onClick={handleAdd}
              size="sm"
              className="rounded-xl px-5 h-9 md:h-10 font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-primary/20"
            >
              Add
              <Plus className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <div className="flex items-center bg-primary text-primary-foreground rounded-xl h-9 md:h-10 px-1 shadow-lg overflow-hidden animate-in zoom-in duration-300">
              <button 
                onClick={() => updateQuantity(item.id, -1)}
                className="w-8 h-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-black">{quantity}</span>
              <button 
                onClick={() => updateQuantity(item.id, 1)}
                className="w-8 h-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
