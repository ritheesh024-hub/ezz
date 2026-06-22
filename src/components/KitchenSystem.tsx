"use client"
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  Timer,
  Package,
  Utensils,
  BellRing,
  Truck,
  AlertCircle,
  Flame,
  Activity,
  PackageCheck,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface KitchenSystemProps {
  orders: any[];
  onUpdateStatus: (id: string, status: string) => void;
  activeView?: string;
}

export const KitchenSystem = ({ orders, onUpdateStatus, activeView }: KitchenSystemProps) => {
  const kitchenOrders = (orders || []).filter(o => 
    ['pending', 'accepted', 'preparing'].includes(o.status)
  ).sort((a, b) => {
    const orderPriority = ['preparing', 'accepted', 'pending'];
    return orderPriority.indexOf(a.status) - orderPriority.indexOf(b.status);
  });

  const activeCount = kitchenOrders.length;
  const preparingCount = kitchenOrders.filter(o => o.status === 'preparing').length;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* COMPACT METRIC HUB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-xl bg-orange-gradient text-white p-5 md:p-7 relative overflow-hidden group">
           <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12">
             <Flame className="w-24 h-24 md:w-32 md:h-32" />
           </div>
           <div className="relative z-10 flex flex-col h-full justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                 <ChefHat className="w-3 h-3" />
                 <span className="text-[8px] font-black uppercase tracking-[0.1em]">In Cooking</span>
              </div>
              <div>
                <h3 className="text-4xl md:text-5xl font-black font-headline tracking-tighter italic leading-none">{preparingCount}</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] mt-2 opacity-80 italic">Active Station</p>
              </div>
           </div>
        </Card>

        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-5 md:p-7 border border-primary/10 relative overflow-hidden">
           <div className="relative z-10 flex flex-col h-full justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-2 bg-primary/10 text-primary w-fit px-3 py-1 rounded-full border border-primary/10">
                 <BellRing className="w-3 h-3 animate-bounce" />
                 <span className="text-[8px] font-black uppercase tracking-[0.1em]">Queue Load</span>
              </div>
              <div>
                <h3 className="text-4xl md:text-5xl font-black font-headline tracking-tighter italic leading-none text-primary">{activeCount - preparingCount}</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] mt-2 opacity-40 italic">Awaiting Prep</p>
              </div>
           </div>
        </Card>

        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-xl bg-zinc-900 text-white p-5 md:p-7 relative overflow-hidden group sm:col-span-2 lg:col-span-1">
           <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />
           <div className="relative z-10 flex flex-col h-full justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
                 <Activity className="w-3 h-3 text-emerald-400" />
                 <span className="text-[8px] font-black uppercase tracking-[0.1em]">Total Pulse</span>
              </div>
              <div>
                <h3 className="text-4xl md:text-5xl font-black font-headline tracking-tighter italic leading-none text-emerald-400">{activeCount}</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] mt-2 opacity-40 italic">Tickets In Loop</p>
              </div>
           </div>
        </Card>
      </div>

      {/* TICKETS AREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {kitchenOrders.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-muted flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 bg-secondary/50 rounded-[2rem] flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-muted-foreground opacity-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">Station Clear</h3>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">Awaiting fresh orders from hub</p>
            </div>
          </div>
        ) : (
          kitchenOrders.map((order) => (
            <Card 
              key={order.id} 
              className={cn(
                "rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-all duration-1000",
                order.status === 'pending' ? "ring-8 ring-blue-500/5 border-2 border-blue-500/20" : 
                order.status === 'accepted' ? "ring-8 ring-primary/5 border-2 border-primary/20" : "border-2 border-orange-500/20 shadow-orange-500/10"
              )}
            >
              <div className={cn(
                "p-6 md:p-8 flex justify-between items-center",
                order.status === 'pending' ? "bg-blue-600 text-white" :
                order.status === 'accepted' ? "bg-primary text-white" : "bg-orange-gradient text-white shadow-lg"
              )}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    {order.orderType === 'Dine-In' ? <Utensils className="w-5 h-5" /> : order.orderType === 'Take Away' ? <Package className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.1em] opacity-80">{order.orderType}</p>
                    <h4 className="font-black text-xl uppercase tracking-tighter leading-none italic">#{order.orderId}</h4>
                  </div>
                </div>
                <Badge className="bg-white/20 border-none font-black text-[8px] uppercase px-3 py-1 rounded-full tracking-widest backdrop-blur-sm">
                  {order.status.toUpperCase()}
                </Badge>
              </div>

              <CardContent className="p-8 md:p-10 space-y-8 md:space-y-10">
                <div className="space-y-4">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-[1.5rem] gap-4 border border-transparent hover:border-primary/10 transition-all group">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-lg uppercase tracking-tight flex-1 truncate pr-4 group-hover:text-primary transition-colors">{item.name}</span>
                        <div className="w-10 h-10 rounded-[1rem] bg-zinc-950 text-white flex items-center justify-center font-black text-base shadow-2xl">
                          {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {order.instructions && (
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-[1.5rem] border-2 border-dashed border-blue-200 dark:border-blue-800 flex gap-4">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-blue-600 mb-1 tracking-widest">Special Notes</p>
                      <p className="text-xs font-bold italic leading-relaxed text-blue-900 dark:text-blue-300">"{order.instructions}"</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-8 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-col gap-1">
                    <p className="text-[7px] font-black uppercase text-muted-foreground opacity-40">Sync State</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                       <Timer className="w-3.5 h-3.5 text-primary" />
                       {order.updatedAt?.toDate ? format(order.updatedAt.toDate(), 'hh:mm a') : 'Live'}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <Button 
                        onClick={() => onUpdateStatus(order.id, 'accepted')}
                        className="rounded-[1.2rem] h-14 px-8 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-3xl transition-all hover:bg-blue-700 group"
                      >
                        <PackageCheck className="w-4 h-4" /> Accept
                      </Button>
                    )}
                    {order.status === 'accepted' && (
                      <Button 
                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                        className="rounded-[1.2rem] h-14 px-8 bg-orange-500 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-3xl transition-all hover:bg-orange-600 group"
                      >
                        <ChefHat className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Start Cooking
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button 
                        onClick={() => onUpdateStatus(order.id, 'out_for_delivery')}
                        className="rounded-[1.2rem] h-14 px-8 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-3xl transition-all hover:bg-emerald-700 group"
                      >
                        <Truck className="w-4 h-4" /> Dispatch
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
