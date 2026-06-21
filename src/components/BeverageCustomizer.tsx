'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { FoodItem, BeverageOptions } from '@/app/lib/store';
import { Coffee, Thermometer, ShoppingBag, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeverageCustomizerProps {
  item: FoodItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: BeverageOptions) => void;
}

export const BeverageCustomizer = ({ item, isOpen, onClose, onConfirm }: BeverageCustomizerProps) => {
  const [options, setOptions] = useState<BeverageOptions>({
    size: 'Small',
    sugar: 'Regular',
    temp: 'Hot',
    addons: []
  });

  const toggleAddon = (addon: string) => {
    setOptions(prev => ({
      ...prev,
      addons: prev.addons.includes(addon) 
        ? prev.addons.filter(a => a !== addon)
        : [...prev.addons, addon]
    }));
  };

  const calculatePreviewPrice = () => {
    let price = item.price;
    if (options.size === 'Medium') price += 20;
    if (options.size === 'Large') price += 40;
    price += options.addons.length * 15;
    return price;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl bg-card">
        <div className="bg-primary p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-headline uppercase tracking-tight relative z-10 flex items-center gap-3">
              <Coffee className="w-8 h-8" />
              Customize
            </DialogTitle>
            <DialogDescription className="text-white/70 font-bold text-xs uppercase tracking-widest relative z-10 mt-1">{item.name}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          {/* Temperature */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
              <Thermometer className="w-3.5 h-3.5" /> Serving Temperature
            </Label>
            <RadioGroup 
              value={options.temp} 
              onValueChange={(v: any) => setOptions({...options, temp: v})}
              className="grid grid-cols-2 gap-3"
            >
              {['Hot', 'Cold'].map((t) => (
                <Label key={t} className={cn(
                  "flex items-center justify-center h-12 rounded-xl border-2 cursor-pointer transition-all font-black text-xs uppercase",
                  options.temp === t ? "border-primary bg-primary/5 text-primary" : "border-muted opacity-60"
                )}>
                  <RadioGroupItem value={t} className="sr-only" />
                  {t}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Size */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Cup Size</Label>
            <RadioGroup 
              value={options.size} 
              onValueChange={(v: any) => setOptions({...options, size: v})}
              className="grid grid-cols-3 gap-3"
            >
              {['Small', 'Medium', 'Large'].map((s) => (
                <Label key={s} className={cn(
                  "flex flex-col items-center justify-center h-20 rounded-2xl border-2 cursor-pointer transition-all",
                  options.size === s ? "border-primary bg-primary/5 text-primary" : "border-muted opacity-60"
                )}>
                  <RadioGroupItem value={s} className="sr-only" />
                  <span className="font-black text-xs uppercase">{s}</span>
                  <span className="text-[10px] font-bold opacity-70">
                    {s === 'Small' ? 'Base' : s === 'Medium' ? '+₹20' : '+₹40'}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Sugar */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Sugar Level</Label>
            <div className="flex flex-wrap gap-2">
              {['None', 'Less', 'Regular', 'Extra'].map((s) => (
                <button
                  key={s}
                  onClick={() => setOptions({...options, sugar: s as any})}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    options.sugar === s ? "border-primary bg-primary text-white" : "border-muted text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Premium Add-ons (+₹15 each)</Label>
            <div className="grid grid-cols-2 gap-3">
              {['Cream', 'Chocolate', 'Ice', 'Honey'].map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAddon(a)}
                  className={cn(
                    "flex items-center justify-between px-4 h-12 rounded-xl border-2 transition-all",
                    options.addons.includes(a) ? "border-primary bg-primary/5 text-primary" : "border-muted opacity-60"
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{a}</span>
                  {options.addons.includes(a) ? <Plus className="w-4 h-4 rotate-45" /> : <Plus className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-secondary/10 flex flex-col gap-4">
          <div className="flex justify-between items-center w-full mb-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Final Amount</p>
              <p className="text-3xl font-black font-headline text-primary italic">₹{calculatePreviewPrice()}</p>
            </div>
          </div>
          <Button 
            className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 gap-3"
            onClick={() => onConfirm(options)}
          >
            <ShoppingBag className="w-5 h-5" />
            Add to Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};