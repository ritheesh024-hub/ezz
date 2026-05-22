"use client"
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  IndianRupee, Sparkles, Loader2, 
  Package, Clock, CheckCircle2,
  Megaphone, LayoutDashboard, Trash2, Plus, Edit2, 
  Database, Coffee, Receipt, History, 
  Ban, ChefHat, Volume2, VolumeX, BellRing,
  ShoppingBag, Star, Zap
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CATEGORIES, MENU_ITEMS } from '@/app/lib/menu-data';
import { dailySpecialGenerator } from '@/ai/flows/daily-special-generator';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, writeBatch, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { DashboardAnalysis } from './DashboardAnalysis';
import { BillingSystem } from './BillingSystem';
import { NewOrderPopups } from './NewOrderPopups';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';

export const AdminSection = () => {
  const db = useFirestore();
  const { playSound, isAdminMuted, toggleAdminMute } = useSound();
  
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
  }, [db]);
  const { data: realOrders } = useCollection<any>(ordersQuery);

  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);
  const { data: dbMenu } = useCollection<any>(menuQuery);

  const orderGroups = useMemo(() => {
    const groups = {
      pending: [] as any[],
      preparing: [] as any[],
      completed: [] as any[]
    };
    realOrders?.forEach(o => {
      if (o.status === 'Pending') groups.pending.push(o);
      else if (o.status === 'Preparing') groups.preparing.push(o);
      else if (o.status === 'Delivered') groups.completed.push(o);
    });
    return groups;
  }, [realOrders]);

  useEffect(() => {
    if (isAdminMuted || orderGroups.pending.length === 0) return;
    const ringInterval = setInterval(() => playSound('ping'), 5000);
    playSound('ping');
    return () => clearInterval(ringInterval);
  }, [orderGroups.pending.length, isAdminMuted, playSound]);

  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    name: '', description: '', price: '', category: 'Veg Maggie', imageUrl: '', isVeg: true, isAvailable: true, rating: '4.5', isBeverage: false
  });

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus }).then(() => {
      playSound('success');
      toast({ title: `Status: ${newStatus}` });
    });
  };

  const handleSaveMenuItem = () => {
    if (!db || !menuFormData.name || !menuFormData.imageUrl) return;
    setSaveLoading(true);
    const itemId = editingItem ? editingItem.id : `PROD-${Date.now()}`;
    const itemRef = doc(db, 'products', itemId);
    const finalData = {
      ...menuFormData,
      id: itemId,
      price: Number(menuFormData.price),
      rating: Number(menuFormData.rating),
      createdAt: editingItem?.createdAt || serverTimestamp()
    };
    setDoc(itemRef, finalData, { merge: true }).then(() => {
      setSaveLoading(false);
      playSound('pop');
      setIsMenuDialogOpen(false);
    });
  };

  return (
    <section className="bg-secondary/5 min-h-screen pb-20">
      <NewOrderPopups pendingOrders={orderGroups.pending} />
      
      {/* ADMIN HEADER */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-headline tracking-tight">Ezzy<span className="text-primary italic">Ops</span></h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">System Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn("rounded-xl h-10 gap-2 font-black uppercase text-[10px] tracking-widest", !isAdminMuted && "bg-primary text-white border-none")}
              onClick={toggleAdminMute}
            >
              {isAdminMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isAdminMuted ? "Muted" : "Audio Active"}
            </Button>
            <Badge className="bg-green-100 text-green-700 border-none uppercase font-black text-[9px] px-3 py-1">System Live</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-10">
        <Tabs defaultValue="overview" className="space-y-10">
          <TabsList className="bg-white p-1 rounded-full border w-full lg:w-fit flex shadow-sm mx-auto">
            {[
              { id: 'overview', label: 'Analysis', icon: Zap },
              { id: 'billing', label: 'Billing POS', icon: Receipt },
              { id: 'orders', label: 'Live Orders', icon: ShoppingBag },
              { id: 'inventory', label: 'Inventory', icon: Database },
              { id: 'marketing', label: 'AI Labs', icon: Sparkles },
            ].map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex-1 lg:flex-none px-8 py-3 font-black uppercase text-[10px] tracking-widest rounded-full gap-2 relative">
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'orders' && orderGroups.pending.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
             <DashboardAnalysis orders={realOrders || []} products={dbMenu || []} />
          </TabsContent>

          <TabsContent value="billing">
            <BillingSystem products={dbMenu || []} orders={realOrders || []} />
          </TabsContent>

          <TabsContent value="orders">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { id: 'pending', label: 'Incoming Orders', icon: BellRing, color: 'text-primary' },
                { id: 'preparing', label: 'In the Kitchen', icon: ChefHat, color: 'text-orange-500' },
                { id: 'completed', label: 'Ready / Delivered', icon: CheckCircle2, color: 'text-green-600' }
              ].map((status) => (
                <div key={status.id} className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <status.icon className={cn("w-5 h-5", status.color)} />
                      <h3 className="font-black uppercase tracking-widest text-[11px] opacity-60">{status.label}</h3>
                    </div>
                    <Badge className="bg-secondary text-foreground rounded-full px-2.5">{orderGroups[status.id as keyof typeof orderGroups].length}</Badge>
                  </div>
                  <div className="space-y-6">
                    {orderGroups[status.id as keyof typeof orderGroups].map((order) => (
                      <Card key={order.id} className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden group">
                        <CardContent className="p-0">
                          <div className={cn("h-1.5 w-full", status.id === 'pending' ? "bg-primary" : status.id === 'preparing' ? "bg-orange-500" : "bg-green-500")} />
                          <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-[10px] font-black uppercase text-primary mb-1">#{order.orderId}</p>
                                <h4 className="text-lg font-black">{order.customerName}</h4>
                                <p className="text-[11px] font-bold text-muted-foreground">{order.customerPhone}</p>
                              </div>
                              <p className="text-xl font-black text-primary italic">₹{order.total}</p>
                            </div>
                            <div className="bg-secondary/30 p-4 rounded-2xl space-y-2">
                              {order.items?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-[11px] font-bold">
                                  <span>{item.name} <span className="text-primary ml-1">x{item.quantity}</span></span>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                              {order.status === 'Pending' && (
                                <Button className="flex-1 rounded-xl font-black text-[10px] uppercase h-12 bg-primary" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>
                                  Accept Order
                                </Button>
                              )}
                              {order.status === 'Preparing' && (
                                <Button className="flex-1 rounded-xl font-black text-[10px] uppercase h-12 bg-orange-500" onClick={() => handleUpdateStatus(order.id, 'Delivered')}>
                                  Mark Ready
                                </Button>
                              )}
                              <Button variant="outline" className="h-12 w-12 rounded-xl text-destructive border-2" onClick={() => handleUpdateStatus(order.id, 'Cancelled')}>
                                <Ban className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-10">
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => { setIsMenuDialogOpen(true); }} className="rounded-2xl h-16 px-10 font-black uppercase tracking-widest text-[11px] gap-3 bg-primary shadow-xl shadow-primary/20">
                <Plus className="w-6 h-6" /> Add Product
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {dbMenu?.map((item: any) => (
                <Card key={item.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white hover:shadow-2xl transition-all">
                  <div className="h-44 relative bg-secondary">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur text-foreground border-none text-[8px] uppercase font-black px-3 py-1 rounded-full">{item.category}</Badge>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <h4 className="font-black text-lg truncate">{item.name}</h4>
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-black text-primary italic">₹{item.price}</p>
                      <Badge variant="outline" className={cn("text-[9px] uppercase font-black px-3 py-1 rounded-full", item.isAvailable ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200")}>
                        {item.isAvailable ? "Instock" : "Out"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="ghost" className="flex-1 rounded-xl h-10 font-black text-[9px] uppercase hover:bg-primary/10 hover:text-primary" onClick={() => { setEditingItem(item); setMenuFormData({ ...item, price: item.price.toString() }); setIsMenuDialogOpen(true); }}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Button variant="ghost" className="h-10 w-10 text-destructive rounded-xl hover:bg-destructive/10" onClick={() => deleteDoc(doc(db!, 'products', item.id))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="marketing">
             <Card className="rounded-[4rem] border-none shadow-3xl bg-white p-10 md:p-20 overflow-hidden relative">
                <div className="max-w-4xl relative z-10 space-y-12">
                  <h3 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none">AI Marketing <br /><span className="text-primary italic">Labs</span></h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {dbMenu?.slice(0, 12).map((item: any) => (
                      <button key={item.id} onClick={() => setSelectedPromoDish(item)} className={cn("p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all truncate", selectedPromoDish?.id === item.id ? "border-primary bg-primary text-white" : "border-muted bg-white")}>
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <Button size="lg" className="rounded-full h-20 px-12 font-black uppercase text-[12px] gap-4 bg-primary" onClick={async () => {
                      if (!selectedPromoDish) return;
                      setPromoLoading(true);
                      try {
                        const res = await dailySpecialGenerator({ dishName: selectedPromoDish.name, basePrice: selectedPromoDish.price, discountPercent: 15 });
                        setPromoResult(res);
                      } finally { setPromoLoading(false); }
                    }} disabled={promoLoading || !selectedPromoDish}>
                    {promoLoading ? <Loader2 className="animate-spin w-8 h-8" /> : <Megaphone className="w-8 h-8" />} Generate Promotion
                  </Button>
                  {promoResult && (
                    <div className="mt-12 p-10 bg-primary/5 rounded-[3rem] border-2 border-primary/10 space-y-6 animate-in zoom-in">
                      <h4 className="text-3xl font-black">{promoResult.promoTitle} {promoResult.emoji}</h4>
                      <p className="text-xl font-medium italic opacity-80 leading-relaxed">{promoResult.promoDescription}</p>
                    </div>
                  )}
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-white border-none shadow-3xl">
          <DialogHeader>
            <DialogTitle className="text-4xl font-black font-headline uppercase tracking-tighter">{editingItem ? 'Update Product' : 'Create Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Product Name</Label>
                <Input value={menuFormData.name} onChange={e => setMenuFormData({...menuFormData, name: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Base Price (₹)</Label>
                <Input type="number" value={menuFormData.price} onChange={e => setMenuFormData({...menuFormData, price: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Category</Label>
                <select value={menuFormData.category} onChange={e => setMenuFormData({...menuFormData, category: e.target.value})} className="w-full h-14 rounded-2xl bg-secondary/30 border-none px-6 text-[11px] font-black uppercase outline-none appearance-none">
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Display Image URL</Label>
                <Input value={menuFormData.imageUrl} onChange={e => setMenuFormData({...menuFormData, imageUrl: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
              </div>
            </div>
            <div className="flex items-center justify-between p-8 bg-secondary/40 rounded-[2rem]">
              <div className="flex items-center gap-4">
                <Switch checked={menuFormData.isAvailable} onCheckedChange={(checked) => setMenuFormData({...menuFormData, isAvailable: checked})} />
                <span className="text-xs font-black uppercase tracking-widest">Active Instock</span>
              </div>
              <div className="flex items-center gap-4">
                <Switch checked={menuFormData.isVeg} onCheckedChange={(checked) => setMenuFormData({...menuFormData, isVeg: checked})} />
                <span className="text-xs font-black uppercase tracking-widest">Vegetarian</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-12">
            <Button variant="outline" className="flex-1 h-16 rounded-2xl font-black uppercase text-[11px] border-2" onClick={() => setIsMenuDialogOpen(false)}>Discard</Button>
            <Button className="flex-1 h-16 rounded-2xl font-black uppercase text-[11px] bg-primary" onClick={handleSaveMenuItem} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="animate-spin" /> : 'Confirm Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};