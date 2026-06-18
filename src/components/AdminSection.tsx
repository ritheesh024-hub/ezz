"use client"
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Package, Clock, ChefHat, 
  Receipt, ShoppingBag, 
  Volume2, VolumeX, BellRing,
  MapPin, User,
  Users, UserPlus, Globe, Utensils,
  TicketPercent, BarChart3, Fingerprint,
  LayoutGrid,
  Settings2,
  Ban,
  IndianRupee,
  ShieldCheck,
  ChevronRight,
  Target,
  ArrowUpRight,
  Layers,
  Zap,
  BoxSelect
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, doc, updateDoc, orderBy, increment, serverTimestamp } from 'firebase/firestore';
import { DashboardAnalysis } from './DashboardAnalysis';
import { BillingSystem } from './BillingSystem';
import { StoreSettings } from './StoreSettings';
import { NewOrderPopups } from './NewOrderPopups';
import { KitchenSystem } from './KitchenSystem';
import { StaffManagement } from './StaffManagement';
import { CouponManager } from './CouponManager';
import { UserManagement } from './UserManagement';
import { ProductManagement } from './ProductManagement';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
import { StaffRole } from '@/app/admin/dashboard/page';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalytics } from '@/hooks/use-analytics';

interface AdminSectionProps {
  assignedRole: StaffRole;
  activeView: StaffRole;
}

export const AdminSection = ({ assignedRole, activeView }: AdminSectionProps) => {
  const db = useFirestore();
  const { user } = useUser();
  const { playSound, isAdminMuted, toggleAdminMute } = useSound();
  const { logStaffAction } = useAnalytics();
  
  // Real-time Data Listeners
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1000));
  }, [db]);
  const { data: realOrders } = useCollection<any>(ordersQuery);

  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);
  const { data: dbMenu } = useCollection<any>(menuQuery);

  const [selectedOrderForView, setSelectedOrderForView] = useState<any>(null);

  const orderGroups = useMemo(() => {
    const groups = { pending: [] as any[], preparing: [] as any[], completed: [] as any[] };
    if (!realOrders) return groups;
    realOrders.forEach(o => {
      if (o.status === 'Pending') groups.pending.push(o);
      else if (['Confirmed', 'Preparing', 'Out for Delivery'].includes(o.status)) groups.preparing.push(o);
      else if (['Delivered', 'Cancelled'].includes(o.status)) groups.completed.push(o);
    });
    return groups;
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db || !user) return;
    const orderRef = doc(db, 'orders', id);
    const updateData: any = { status: newStatus };
    if (newStatus === 'Confirmed') updateData.acceptedAt = serverTimestamp();

    updateDoc(orderRef, updateData)
      .then(() => {
        const staffRef = doc(db, 'admins', user.uid);
        updateDoc(staffRef, { 
          'stats.kitchenUpdates': increment(1), 
          'stats.ordersHandled': increment(1) 
        }).catch(() => {});

        // Real-time Operational Log
        logStaffAction(user.uid, user.displayName || 'Staff', 'ORDER_STATUS_CHANGE', `Order #${id} changed to ${newStatus}`);

        playSound('success');
        toast({ title: `Order ${newStatus}` });
        if (selectedOrderForView?.id === id) setSelectedOrderForView(null);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext));
      });
  };

  const getStatusBadge = (order: any) => {
    const status = order.status;
    switch (status) {
      case 'Delivered': return <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 font-black text-[8px] uppercase tracking-widest">Delivered</Badge>;
      case 'Cancelled': return <Badge className="bg-rose-100 text-rose-700 border-none px-3 py-1 font-black text-[8px] uppercase tracking-widest">Cancelled</Badge>;
      case 'Pending': return <Badge className="bg-blue-100 text-blue-700 border-none px-3 py-1 font-black text-[8px] uppercase tracking-widest animate-pulse">Incoming</Badge>;
      case 'Confirmed': return <Badge className="bg-cyan-100 text-cyan-700 border-none px-3 py-1 font-black text-[8px] uppercase tracking-widest">Accepted</Badge>;
      case 'Preparing': return <Badge className="bg-orange-100 text-orange-700 border-none px-3 py-1 font-black text-[8px] uppercase tracking-widest">Processing</Badge>;
      case 'Out for Delivery': return <Badge className="bg-violet-100 text-violet-700 border-none px-3 py-1 font-black text-[8px] uppercase tracking-widest">In Transit</Badge>;
      default: return <Badge variant="outline" className="px-3 font-black text-[8px] uppercase">{status}</Badge>;
    }
  }

  const availableTabs = useMemo(() => {
    if (activeView === 'kitchen') return ['kitchen'];
    if (activeView === 'cashier') return ['overview', 'billing', 'orders'];
    return ['overview', 'users', 'billing', 'orders', 'products', 'coupons', 'staff', 'settings'];
  }, [activeView]);

  return (
    <section className="bg-[#F8F9FA] dark:bg-zinc-950 min-h-screen pb-24 overflow-x-hidden scrollbar-gutter-stable">
      <NewOrderPopups pendingOrders={orderGroups.pending} onViewDetails={(order) => setSelectedOrderForView(order)} onUpdateStatus={handleUpdateStatus} />
      
      <div className="container mx-auto px-4 pt-10">
        <Tabs defaultValue={availableTabs[0]} className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-72 shrink-0">
             <div className="sticky top-28 space-y-8">
                <div className="space-y-1">
                   <h2 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground px-4 opacity-40">Control Pane</h2>
                   <TabsList className="bg-white dark:bg-zinc-900 flex flex-col h-auto w-full p-2 rounded-[2rem] border shadow-sm">
                      {availableTabs.map((tab) => (
                        <TabsTrigger 
                          key={tab}
                          value={tab} 
                          className="w-full justify-start px-6 py-4 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest gap-4 data-[state=active]:bg-primary data-[state=active]:text-white transition-all group"
                        >
                          {tab === 'overview' && <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                          {tab === 'users' && <Users className="w-4 h-4" />}
                          {tab === 'billing' && <Receipt className="w-4 h-4" />}
                          {tab === 'kitchen' && <ChefHat className="w-4 h-4" />}
                          {tab === 'orders' && (
                            <div className="flex items-center gap-4 flex-1">
                              <ShoppingBag className="w-4 h-4" />
                              <span>Live Orders</span>
                              {orderGroups.pending.length > 0 && <Badge className="ml-auto bg-white text-primary border-none text-[8px] h-5 w-5 p-0 flex items-center justify-center rounded-full animate-bounce">{orderGroups.pending.length}</Badge>}
                            </div>
                          )}
                          {tab === 'products' && <Layers className="w-4 h-4" />}
                          {tab === 'coupons' && <TicketPercent className="w-4 h-4" />}
                          {tab === 'staff' && <Fingerprint className="w-4 h-4" />}
                          {tab === 'settings' && <Settings2 className="w-4 h-4" />}
                          <span className="capitalize">{tab === 'overview' ? 'Dashboard' : tab === 'billing' ? 'POS Counter' : tab === 'products' ? 'Inventory' : tab}</span>
                        </TabsTrigger>
                      ))}
                   </TabsList>
                </div>

                <Card className="rounded-[1.8rem] border-none shadow-xl bg-orange-gradient text-white p-6 relative overflow-hidden group">
                   <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:rotate-12 transition-transform"><Zap className="w-24 h-24" /></div>
                   <div className="relative z-10 space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Real-time Node</p>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-black">Alert Audio</span>
                         <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/20 hover:bg-white/30 rounded-xl" onClick={toggleAdminMute}>
                           {isAdminMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                         </Button>
                      </div>
                   </div>
                </Card>
             </div>
          </div>

          <div className="flex-1 min-w-0 min-h-[70vh]">
            <AnimatePresence mode="wait">
              <TabsContent value={activeView} className="mt-0 outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* The actual content renders based on the selected tab trigger, not activeView prop directly */}
                </motion.div>
              </TabsContent>

              {/* Fix: Directly use TabsContent children logic to prevent content mismatch */}
              {availableTabs.map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-0 outline-none">
                   <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                   >
                    {tab === 'overview' && <DashboardAnalysis orders={realOrders || []} products={dbMenu || []} />}
                    {tab === 'users' && <UserManagement />}
                    {tab === 'billing' && <BillingSystem products={dbMenu || []} orders={realOrders || []} />}
                    {tab === 'kitchen' && <KitchenSystem orders={realOrders || []} onUpdateStatus={handleUpdateStatus} />}
                    {tab === 'products' && <ProductManagement />}
                    {tab === 'coupons' && <CouponManager />}
                    {tab === 'staff' && <StaffManagement />}
                    {tab === 'settings' && <StoreSettings />}
                    {tab === 'orders' && (
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                        {[
                          { id: 'pending', label: 'Queued', icon: BellRing, color: 'text-primary', desc: 'Awaiting Action' },
                          { id: 'preparing', label: 'Active', icon: ChefHat, color: 'text-orange-500', desc: 'In Kitchen/Transit' },
                          { id: 'completed', label: 'Archived', icon: BoxSelect, color: 'text-muted-foreground', desc: 'Finalized History' }
                        ].map((group) => (
                          <div key={group.id} className="space-y-6">
                            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm">
                              <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner bg-secondary/50", group.color)}>
                                  <group.icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="font-black uppercase tracking-tight text-sm">{group.label}</h3>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40">{group.desc}</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="rounded-full h-8 w-8 p-0 flex items-center justify-center font-black text-xs">{orderGroups[group.id as keyof typeof orderGroups].length}</Badge>
                            </div>
                            
                            <div className="space-y-4">
                              {orderGroups[group.id as keyof typeof orderGroups].map((order) => (
                                <Card 
                                  key={order.id} 
                                  className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden group hover:shadow-2xl transition-all cursor-pointer border-l-4 border-l-transparent active:scale-[0.98]" 
                                  onClick={() => setSelectedOrderForView(order)} 
                                  style={{ borderLeftColor: order.status === 'Pending' ? '#ef4444' : order.status === 'Preparing' ? '#f97316' : '#22c55e' }}
                                >
                                  <div className="p-6 space-y-6">
                                    <div className="flex justify-between items-start">
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-primary italic">#{order.orderId}</p>
                                        <h4 className="text-lg font-black uppercase tracking-tighter truncate">{order.customerName}</h4>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40">Final Sale</p>
                                        <p className="text-xl font-black text-primary italic leading-none mt-1">₹{order.total}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-5 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                                      {getStatusBadge(order)}
                                      <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground opacity-40 uppercase">
                                        <Clock className="w-3 h-3" />
                                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Syncing'}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                   </motion.div>
                </TabsContent>
              ))}
            </AnimatePresence>
          </div>
        </Tabs>
      </div>

      <Dialog open={!!selectedOrderForView} onOpenChange={(open) => !open && setSelectedOrderForView(null)}>
        <DialogContent className="max-w-3xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-900">
          {selectedOrderForView && (
            <>
              <div className={cn("p-12 text-white relative overflow-hidden", selectedOrderForView.status === 'Cancelled' ? "bg-rose-600" : "bg-primary")}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <div className="flex items-center gap-3 bg-white/20 w-fit px-3 py-1 rounded-full mb-3 backdrop-blur-md border border-white/10">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{selectedOrderForView.orderType || 'Online Order'}</span>
                    </div>
                    <h2 className="text-5xl font-black font-headline uppercase tracking-tighter italic">#{selectedOrderForView.orderId}</h2>
                  </div>
                  <div className="md:text-right">
                    <p className="text-[10px] font-black uppercase opacity-70 tracking-[0.3em] mb-1">Settlement Status</p>
                    <p className="text-5xl font-black font-headline italic">₹{selectedOrderForView.total}</p>
                  </div>
                </div>
              </div>

              <div className="p-12 space-y-12 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <div className="grid md:grid-cols-5 gap-12">
                  <div className="md:col-span-3 space-y-8">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.4em] flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Manifest Breakdown
                      </h5>
                      <div className="space-y-3">
                        {selectedOrderForView.items?.map((item: any, i: number) => (
                          <div key={i} className="bg-secondary/30 dark:bg-zinc-800 p-5 rounded-[1.5rem] group hover:bg-secondary/50 transition-all border border-transparent hover:border-primary/10">
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-base font-black uppercase tracking-tight">{item.name}</span>
                               <span className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center font-black text-sm shadow-sm text-primary">x{item.quantity}</span>
                            </div>
                            <div className="flex justify-between items-end">
                               <div className="flex flex-wrap gap-1">
                                  {item.customization && <Badge variant="outline" className="text-[7px] font-black uppercase px-2 bg-white/50">{item.customization.size}</Badge>}
                                  {item.customization?.addons?.map((a: string) => <Badge key={a} variant="secondary" className="text-[7px] font-black uppercase px-2">{a}</Badge>)}
                               </div>
                               <span className="font-black text-sm italic opacity-60">₹{item.price * item.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-10">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.4em] flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Recipient Identity
                      </h5>
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] space-y-6">
                        <div className="flex gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><User className="w-6 h-6 text-primary" /></div>
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase opacity-40 mb-1">Customer</p>
                            <p className="text-base font-black uppercase truncate">{selectedOrderForView.customerName}</p>
                            <p className="text-[11px] font-bold opacity-60">{selectedOrderForView.customerPhone}</p>
                          </div>
                        </div>
                        <div className="flex gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><MapPin className="w-6 h-6 text-primary" /></div>
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase opacity-40 mb-1">Destination</p>
                            <p className="text-[11px] font-medium leading-relaxed italic text-muted-foreground">"{selectedOrderForView.address || 'In-Store Pickup'}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-10 bg-zinc-50 dark:bg-zinc-800/50 flex gap-4 border-t">
                {selectedOrderForView.status === 'Pending' && (
                  <Button 
                    className="flex-1 rounded-[1.5rem] h-18 bg-primary text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-primary/30 transform hover:scale-[1.02] active:scale-95 transition-all" 
                    onClick={() => handleUpdateStatus(selectedOrderForView.id, 'Confirmed')}
                  >
                    Confirm & Provision
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="rounded-[1.5rem] h-18 font-black uppercase text-[11px] tracking-[0.2em] px-10 border-2" 
                  onClick={() => setSelectedOrderForView(null)}
                >
                  Exit Preview
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
