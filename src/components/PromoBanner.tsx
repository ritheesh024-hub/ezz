
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, GraduationCap, ArrowRight, Sparkles, PartyPopper } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export const PromoBanner = () => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const offers = [
    {
      id: 'student',
      code: 'STUDENT10',
      title: 'Bite Into Big Savings.',
      subtitle: 'Exclusively for AU Students!',
      description: 'Get 10% OFF on every online order.',
      tag: 'Student Special Offer',
      icon: GraduationCap,
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
      accent: 'text-yellow-300'
    },
    {
      id: 'new-user',
      code: 'EZZYBITES15',
      title: 'Welcome to the Family.',
      subtitle: 'New Users Only!',
      description: 'Get 15% OFF on your very first order.',
      tag: 'Limited Time Offer',
      icon: PartyPopper,
      gradient: 'from-red-600 via-orange-600 to-yellow-500',
      accent: 'text-white'
    }
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast({
      title: "Code Copied! 🚀",
      description: `Use ${code} at checkout for your discount.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {offers.map((offer) => (
            <CarouselItem key={offer.id}>
              <div className="relative w-full overflow-hidden group">
                <div className={`absolute inset-0 bg-gradient-to-r ${offer.gradient} animate-gradient-x`} />
                
                {/* Decorative Elements */}
                <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-50%] left-[-50%] w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-700" />
                
                <div className="container mx-auto px-6 py-10 md:py-14 relative z-10">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 animate-bounce">
                        <offer.icon className="w-4 h-4 text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{offer.tag}</span>
                      </div>
                      
                      <h2 className="text-4xl md:text-6xl font-headline font-black text-white leading-none tracking-tighter">
                        {offer.title.split('.').map((part, i) => (
                          <React.Fragment key={i}>
                            {i === 0 ? part : <><br /><span className={`${offer.accent} italic`}>{part}</span></>}
                          </React.Fragment>
                        ))}
                      </h2>
                      
                      <p className="text-white/80 text-sm md:text-lg font-medium max-w-md">
                        {offer.subtitle} <span className="font-black text-white text-xl">{offer.description.split('OFF')[0]}OFF</span>{offer.description.split('OFF')[1]}
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl hover:scale-[1.02] transition-transform duration-500">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-white/60 tracking-[0.2em] text-center md:text-left">Coupon Code</p>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl md:text-4xl font-black font-mono text-white tracking-tighter">{offer.code}</span>
                          <button 
                            onClick={() => handleCopy(offer.code)}
                            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all text-white"
                          >
                            {copied === offer.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="h-px md:h-12 w-12 md:w-px bg-white/20" />
                      
                      <Button 
                        onClick={() => window.location.href = '/menu'}
                        className="h-16 px-10 rounded-2xl bg-white text-black hover:bg-zinc-100 font-black uppercase tracking-widest text-xs group/btn shadow-xl"
                      >
                        Order Now
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Floating Sparkles */}
                <Sparkles className="absolute top-6 left-10 text-white/30 w-8 h-8 animate-pulse" />
                <Sparkles className="absolute bottom-6 right-20 text-white/20 w-12 h-12 animate-bounce" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
