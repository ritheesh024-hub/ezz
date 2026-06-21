"use client"
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useStore } from '@/app/lib/store';
import { ShoppingBag, Minus, Plus, X, ChevronRight, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from './ui/separator';

export const CartDrawer = ({ children }: { children: React.ReactNode }) => {
  const { cart, updateQuantity, removeFromCart, getTotal } = useStore();
  const subtotal = getTotal();
  const deliveryFee = subtotal >= 149 ? 0 : 40;
  const total = subtotal + deliveryFee;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 rounded-l-[2rem] md:rounded-l-[3rem] border-none shadow-3xl bg-background">
        <SheetHeader className="p-5 md:p-8 border-b bg-card">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3 text-xl md:text-2xl font-black font-headline tracking-tight">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <ShoppingBag className="w-4.5 h-4.5" />
              </div>
              Your Tray
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-24 h-24 bg-secondary rounded-3xl flex items-center justify-center opacity-10">
                <ShoppingBag className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-xl font-black mb-1">Empty Tray?</h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed">Add some bites or a refreshing tea to begin.</p>
              </div>
              <SheetTrigger asChild>
                <Button className="rounded-full px-10 h-12 font-black uppercase text-[9px] tracking-widest shadow-xl bg-primary">Explore Menu</Button>
              </SheetTrigger>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.cartId} className="flex gap-4 group">
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-secondary shadow-sm">
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      fill 
                      className="object-cover"
                      unoptimized={item.imageUrl.startsWith('http')}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="font-black text-sm md:text-base truncate pr-2 tracking-tight uppercase">{item.name}</h4>
                      <button 
                        onClick={() => removeFromCart(item.cartId)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {item.customization && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-[7px] font-black uppercase tracking-widest bg-primary/5 text-primary px-1.5 py-0.5 rounded-md">{item.customization.temp}</span>
                        <span className="text-[7px] font-black uppercase tracking-widest bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-md">{item.customization.size}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-base md:text-lg font-black text-primary italic">₹{item.price}</p>
                      <div className="flex items-center bg-secondary rounded-lg px-1.5 h-8 gap-1">
                        <button 
                          onClick={() => updateQuantity(item.cartId, -1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-white rounded transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-black">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-white rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t p-5 md:p-8 space-y-5 bg-card/80 backdrop-blur-xl">
            {subtotal < 149 && (
              <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest leading-relaxed">
                  Add <span className="text-primary italic">₹{149 - subtotal}</span> for <span className="text-primary italic">FREE</span> delivery!
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Delivery</span>
                <span className={deliveryFee === 0 ? "text-green-600 italic font-black" : "text-foreground"}>
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </span>
              </div>
              <Separator className="my-2 opacity-30" />
              <div className="flex justify-between items-end pt-1">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Payable Total</span>
                <span className="text-3xl font-black font-headline text-primary italic leading-none">₹{total}</span>
              </div>
            </div>

            <Link href="/checkout" passHref>
              <Button className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/30 group bg-primary">
                Settle Order
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
