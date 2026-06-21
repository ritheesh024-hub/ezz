'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';

export const PromoBanner = () => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const offers = [
    {
      id: 'student',
      code: 'STUDENT10',
      codeLabel: 'STUDENT10',
      title: 'Academic Special',
      description: 'FLAT 10 % OFF on all orders.',
      gradient: 'from-[#FF6B00] to-[#FF8A00]'
    },
    {
      id: 'new-user',
      code: 'EZZYBITES15',
      codeLabel: 'EZZYBITES15',
      title: 'Midnight Cravings',
      description: '15 % OFF late-night meals.',
      gradient: 'from-[#6366F1] to-[#4F46E5]'
    },
    {
      id: 'weekend',
      code: 'WEEKEND20',
      codeLabel: 'WEEKEND20',
      title: 'Weekend Bonanza',
      description: 'FLAT 20 % OFF this Sunday.',
      gradient: 'from-[#F43F5E] to-[#E11D48]'
    }
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast({
      title: "Code Copied! 🚀",
      description: `Use ${code} at checkout.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full relative md:py-2 py-0.5">
      <Carousel
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 5000 })]}
        className="w-full"
      >
        <CarouselContent className="-ml-3 md:-ml-4">
          {offers.map((offer) => (
            <CarouselItem key={offer.id} className="pl-3 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
              <div className={cn(
                "relative w-full h-[100px] md:h-[120px] overflow-hidden rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl border border-white/10 group",
                "bg-gradient-to-br", offer.gradient
              )}>
                <div className="relative h-full flex flex-col justify-center p-4 md:p-5 z-10 text-center items-center transform transition-transform group-hover:scale-[1.01]">
                  <div className="space-y-1.5 md:space-y-2 w-full">
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-2xl px-2 py-0.5 rounded-full border border-white/10">
                      <span className="text-[7px] font-black uppercase tracking-widest text-white">{offer.title}</span>
                    </div>
                    
                    <h3 className="text-[11px] md:text-sm font-black text-white leading-tight uppercase tracking-tighter line-clamp-1">
                      {offer.description}
                    </h3>
                    
                    <div className="flex justify-center pt-0.5">
                      <button 
                        className="bg-black/20 backdrop-blur-3xl px-3 py-1 rounded-xl border border-white/10 flex items-center gap-2 group/code cursor-pointer transition-all hover:bg-black/30 active:scale-95 shadow-sm" 
                        onClick={() => handleCopy(offer.code)}
                      >
                         <span className="text-[10px] md:text-xs font-black font-mono text-white tracking-tighter">{offer.codeLabel}</span>
                         <div className="w-5 h-5 md:w-6 md:h-6 bg-white/10 rounded-lg flex items-center justify-center transition-colors group-hover/code:bg-white/20">
                           {copied === offer.code ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-white/70" />}
                         </div>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl opacity-50" />
                <div className="absolute -left-4 -top-4 w-20 h-20 bg-black/5 rounded-full blur-xl opacity-30" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
