'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const PromoBanner = () => {
  const [copied, setCopied] = React.useState(false);
  const couponCode = 'STUDENT10';

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    toast({
      title: "Code Copied! 🎓",
      description: "Use STUDENT10 at checkout for 10% off.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x" />
      
      {/* Decorative Elements */}
      <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-50%] left-[-50%] w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-700" />
      
      <div className="container mx-auto px-6 py-10 md:py-14 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 animate-bounce">
              <GraduationCap className="w-4 h-4 text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Student Special Offer</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-headline font-black text-white leading-none tracking-tighter">
              Bite Into <br /> 
              <span className="text-yellow-300 italic">Big Savings.</span>
            </h2>
            
            <p className="text-white/80 text-sm md:text-lg font-medium max-w-md">
              Exclusively for AU Students! Get <span className="font-black text-white text-xl">10% OFF</span> on every online order.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl hover:scale-[1.02] transition-transform duration-500">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-white/60 tracking-[0.2em] text-center md:text-left">Coupon Code</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl md:text-4xl font-black font-mono text-white tracking-tighter">{couponCode}</span>
                <button 
                  onClick={handleCopy}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all text-white"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="h-px md:h-12 w-12 md:w-px bg-white/20" />
            
            <Button 
              onClick={() => window.location.href = '/menu'}
              className="h-16 px-10 rounded-2xl bg-yellow-400 text-black hover:bg-yellow-300 font-black uppercase tracking-widest text-xs group/btn shadow-xl"
            >
              Order Now
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Floating Sparkles */}
      <Sparkles className="absolute top-6 left-10 text-yellow-300/30 w-8 h-8 animate-pulse" />
      <Sparkles className="absolute bottom-6 right-20 text-white/20 w-12 h-12 animate-bounce" />
    </div>
  );
};