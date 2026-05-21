
"use client"
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useParams } from 'next/navigation';
import { CheckCircle2, Clock, MapPin, Phone, MessageSquare, Truck, ChefHat, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [status, setStatus] = useState(1); // 1: Placed, 2: Preparing, 3: Out for Delivery, 4: Delivered

  useEffect(() => {
    // Mock progression for demo purposes
    const timer = setInterval(() => {
      setStatus(prev => (prev < 4 ? prev + 1 : prev));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    { id: 1, title: 'Order Placed', time: '12:01 PM', icon: PackageCheck, desc: 'We have received your order.' },
    { id: 2, title: 'Preparing Food', time: '12:05 PM', icon: ChefHat, desc: 'Our chef is crafting your meal.' },
    { id: 3, title: 'Out for Delivery', time: '12:20 PM', icon: Truck, desc: 'Our rider is on the way.' },
    { id: 4, title: 'Delivered', time: '12:35 PM', icon: CheckCircle2, desc: 'Enjoy your delicious bites!' }
  ];

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px]">
              Live Tracking
            </Badge>
            <h1 className="text-4xl font-headline font-black">Order <span className="text-primary">{orderId || '#EB-XXXXX'}</span></h1>
            <p className="text-muted-foreground font-medium mt-1">Est. Arrival: <span className="text-foreground font-bold">12:35 PM (25 mins)</span></p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-full h-12 px-6 gap-2 font-bold" onClick={() => window.open('https://wa.me/918639366800', '_blank')}>
              <MessageSquare className="w-4 h-4" />
              Chat with Help
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[40px] border-none shadow-2xl overflow-hidden bg-card">
              <CardContent className="p-10">
                <div className="relative space-y-12">
                  <div className="absolute left-6 top-6 w-0.5 h-[calc(100%-48px)] bg-muted z-0" />
                  
                  {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = status >= step.id;
                    const isCurrent = status === step.id;

                    return (
                      <div key={idx} className={`relative z-10 flex gap-8 items-start transition-all duration-700 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isActive ? 'bg-primary text-white scale-110' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className={`text-xl font-black ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</h4>
                            <span className="text-xs font-bold text-muted-foreground">{step.time}</span>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">{step.desc}</p>
                          {isCurrent && (
                            <div className="mt-4 flex gap-2">
                               <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                               <div className="text-[10px] font-black uppercase tracking-widest text-primary">Current Progress</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[32px] border-none shadow-xl bg-primary text-white overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <CardContent className="p-8 space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Delivery Hero</p>
                    <h4 className="text-xl font-black">Rajesh Kumar</h4>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-white text-primary hover:bg-white/90 rounded-2xl h-12 font-black gap-2">
                    <Phone className="w-4 h-4" />
                    Call Rider
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-none shadow-xl">
              <CardContent className="p-8 space-y-6">
                <h4 className="font-black text-lg uppercase tracking-widest">Delivery Address</h4>
                <div className="flex gap-4 items-start">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    Anurag University Campus, Boys Hostel, Block A, Room 302, Pocharam.
                  </p>
                </div>
                <div className="pt-6 border-t">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">Support & Feedback</p>
                  <Button variant="outline" className="w-full rounded-2xl h-12 font-bold border-muted" onClick={() => window.open('https://wa.me/918639366800', '_blank')}>
                    Help with Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
