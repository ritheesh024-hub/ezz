'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  X, 
  CheckCircle2, 
  Ban, 
  ExternalLink, 
  Clock, 
  MapPin, 
  IndianRupee,
  BellRing
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/use-sound';

interface NewOrderPopupsProps {
  pendingOrders: any[];
}

export const NewOrderPopups = ({ pendingOrders }: NewOrderPopupsProps) => {
  const db = useFirestore();
  const { playSound } = useSound();
  const [activeNotifications, setActiveNotifications] = useState<any[]>([]);
  const shownOrderIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  // Monitor pending orders for new arrivals
  useEffect(() => {
    if (!pendingOrders) return;

    // On initial load, mark existing pending orders as "shown" so we don't spam the UI
    if (isInitialLoad.current) {
      pendingOrders.forEach(order => shownOrderIds.current.add(order.id));
      isInitialLoad.current = false;
      return;
    }

    const newOrders = pendingOrders.filter(order => !shownOrderIds.current.has(order.id));

    if (newOrders.length > 0) {
      newOrders.forEach(order => {
        shownOrderIds.current.add(order.id);
        setActiveNotifications(prev => [order, ...prev]);
        playSound('ping'); // Trigger the persistent trill/ping
      });
    }
  }, [pendingOrders, playSound]);

  const removeNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus }).then(() => {
      playSound('success');
      toast({ title: `Order ${newStatus}` });
      removeNotification(id);
    });
  };

  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-[100] w-full max-w-[380px] space-y-4 pointer-events-none">
      {activeNotifications.map((order, index) => (
        <Card 
          key={order.id} 
          className={cn(
            "pointer-events-auto rounded-[2rem] border-none shadow-3xl bg-white overflow-hidden animate-in slide-in-from-right duration-500",
            index > 2 && "hidden" // Only show top 3 popups to prevent screen clutter
          )}
        >
          <div className="bg-primary p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">New Order</p>
                <h4 className="font-black text-sm">#{order.orderId}</h4>
              </div>
            </div>
            <button 
              onClick={() => removeNotification(order.id)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-foreground line-clamp-2">
                {order.items?.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-[9px] font-black uppercase bg-secondary">
                  <IndianRupee className="w-3 h-3 mr-1" /> ₹{order.total}
                </Badge>
                <Badge variant="outline" className="text-[9px] font-black uppercase">
                  <Clock className="w-3 h-3 mr-1" /> Just Now
                </Badge>
              </div>
            </div>

            {order.address && (
              <div className="flex items-start gap-2 p-3 bg-secondary/30 rounded-2xl">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-muted-foreground leading-tight">
                  {order.address}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => handleStatusUpdate(order.id, 'Preparing')}
                className="flex-1 rounded-xl h-10 font-black text-[9px] uppercase tracking-widest bg-primary"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Accept
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleStatusUpdate(order.id, 'Cancelled')}
                className="flex-1 rounded-xl h-10 font-black text-[9px] uppercase tracking-widest border-2"
              >
                <Ban className="w-3.5 h-3.5 mr-2" /> Reject
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full text-[9px] font-black uppercase tracking-[0.2em] h-8 text-muted-foreground hover:text-primary"
              onClick={() => {
                // This could scroll to the order in the list or open a full modal
                toast({ title: "Viewing details..." });
              }}
            >
              <ExternalLink className="w-3 h-3 mr-2" /> View Full Order
            </Button>
          </CardContent>
        </Card>
      ))}
      
      {activeNotifications.length > 3 && (
        <div className="text-right px-4">
          <Badge className="bg-primary text-white shadow-lg px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest animate-pulse">
            + {activeNotifications.length - 3} More Orders Pending
          </Badge>
        </div>
      )}
    </div>
  );
};
