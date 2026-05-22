"use client"
import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  IndianRupee, Sparkles, Loader2, 
  Package, Clock, CheckCircle2,
  Megaphone, LayoutDashboard, Trash2, Plus, Edit2, Link as LinkIcon,
  ChevronRight, MapPin, Phone, ShoppingBag
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CATEGORIES } from '@/app/lib/menu-data';
import { dailySpecialGenerator } from '@/ai/flows/daily-special-generator';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { DashboardAnalysis } from './DashboardAnalysis';
import { cn } from '@/lib/utils';

export const AdminSection = () => {
  const db = useFirestore();
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), limit(200));
  }, [db]);
  const { data: realOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'products'));
  }, [db]);
  const { data: dbMenu, loading: menuLoading } = useCollection<any>(menuQuery);

  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState<any>(null);

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    name: '', description: '', price: '', category: 'Veg Maggie', imageUrl: '', isVeg: true, isAvailable: true, rating: '4.5'
  });

  const sortedOrders = useMemo(() => {
    if (!realOrders) return [];
    return [...realOrders].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: orderRef.path, operation: 'update', requestResourceData: { status: newStatus }
      }));
    });
    toast({ title: `Order ${newStatus}` });
  };

  const handleDeleteOrder = (id: string) => {
    if (!db || !window.confirm("Delete order record permanently?")) return;
    const orderRef = doc(db, 'orders', id);
    deleteDoc(orderRef).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'delete' }));
    });
  };

  const resetForm = () => {
    setEditingItem(null);
    setMenuFormData({ name: '', description: '', price: '', category: 'Veg Maggie', imageUrl: '', isVeg: true, isAvailable: true, rating: '4.5' });
  };

  const handleSaveMenuItem = () => {
    if (!db || !menuFormData.name || !menuFormData.imageUrl) {
      toast({ variant: "destructive", title: "Missing Data", description: "Name and Image URL are mandatory." });
      return;
    }
    
    setSaveLoading(true);
    const itemId = editingItem ? editingItem.id : `PROD-${Date.now()}`;
    const itemRef = doc(db, 'products', itemId);
    
    const finalData = {
      id: itemId,
      name: menuFormData.name.trim(),
      description: menuFormData.description.trim(),
      price: Number(menuFormData.price) || 0,
      category: menuFormData.category,
      imageUrl: menuFormData.imageUrl.trim(),
      isVeg: menuFormData.isVeg,
      isAvailable: menuFormData.isAvailable,
      rating: Number(menuFormData.rating) || 4.5,
      createdAt: editingItem?.createdAt || serverTimestamp()
    };

    setDoc(itemRef, finalData, { merge: true })
      .then(() => {
        setSaveLoading(false);
        toast({ title: editingItem ? "Item Updated" : "Dish Added Permanently! 🚀" });
        setIsMenuDialogOpen(false);
        resetForm();
      })
      .catch(async (e) => {
        setSaveLoading(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: itemRef.path, operation: 'write', requestResourceData: finalData 
        }));
      });
  };

  return (
    <section className="py-10 bg-secondary/5 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-3xl shadow-2xl shadow-primary/20 flex items-center justify-center text-white transform rotate-6">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl font-black font-headline tracking-tight text-foreground">Ezzy<span className="text-primary italic">Console</span></h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Operational Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-4 py-1.5 uppercase font-black text-[10px] hidden sm:flex">
              Live Engine Active
            </Badge>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-10">
          <TabsList className="bg-white/50 backdrop-blur-md p-1.5 rounded-[2rem] border w-full flex shadow-xl overflow-x-auto scrollbar-hide">
            <TabsTrigger value="overview" className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] whitespace-nowrap px-8 rounded-[1.5rem] data-[state=active]:bg-primary data-[state=active]:text-white">Analysis</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] whitespace-nowrap px-8 rounded-[1.5rem] data-[state=active]:bg-primary data-[state=active]:text-white">Orders ({realOrders?.length || 0})</TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] whitespace-nowrap px-8 rounded-[1.5rem] data-[state=active]:bg-primary data-[state=active]:text-white">Inventory</TabsTrigger>
            <TabsTrigger value="marketing" className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] gap-2 flex items-center justify-center whitespace-nowrap px-8 rounded-[1.5rem] data-[state=active]:bg-primary data-[state=active]:text-white">
              <Sparkles className="w-4 h-4" /> AI Labs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
             {ordersLoading ? (
               <div className="py-40 flex flex-col items-center justify-center gap-4">
                 <Loader2 className="w-12 h-12 animate-spin text-primary" />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Aggregating Cloud Data...</p>
               </div>
             ) : (
               <DashboardAnalysis orders={realOrders || []} products={dbMenu || []} />
             )}
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-8">
              {ordersLoading ? (
                <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
              ) : sortedOrders.length === 0 ? (
                <Card className="rounded-[3rem] p-24 text-center border-dashed border-2">
                  <Package className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Awaiting fresh orders...</p>
                </Card>
              ) : (
                <div className="grid gap-8">
                  {sortedOrders.map((order: any) => (
                    <Card key={order.id} className="rounded-[3rem] border-none shadow-2xl bg-white/80 backdrop-blur overflow-hidden group hover:shadow-primary/5 transition-all">
                      <CardContent className="p-0">
                        <div className="grid md:grid-cols-4">
                          <div className="p-10 border-r bg-muted/5">
                            <Badge className="mb-6 bg-primary/10 text-primary border-none text-[9px] uppercase font-black px-3 py-1">
                              {order.orderId}
                            </Badge>
                            <h4 className="text-2xl font-black mb-2">{order.customerName}</h4>
                            <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5" /> {order.customerPhone}
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest opacity-60">
                              <Clock className="w-3.5 h-3.5" /> {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : 'Recent'}
                            </div>
                          </div>
                          
                          <div className="p-10 md:col-span-2 space-y-6">
                             <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                                  <MapPin className="w-5 h-5 text-primary" />
                                </div>
                                <p className="text-sm font-bold leading-relaxed opacity-80">{order.address}</p>
                             </div>
                             <div className="space-y-3">
                               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Order Pack</p>
                               {order.items?.map((item: any, i: number) => (
                                 <div key={i} className="flex justify-between items-center bg-secondary/20 p-4 rounded-[1.5rem] text-xs font-black">
                                   <span>{item.name} <span className="text-primary italic">x{item.quantity}</span></span>
                                   <span className="text-primary">₹{item.price * item.quantity}</span>
                                 </div>
                               ))}
                             </div>
                          </div>

                          <div className="p-10 bg-secondary/5 flex flex-col justify-between items-end border-l border-white">
                            <div className="text-right mb-8">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Settlement</p>
                              <p className="text-4xl font-headline font-black text-primary">₹{order.total}</p>
                              <Badge variant="outline" className={cn(
                                "mt-4 font-black text-[10px] uppercase px-4 py-1.5 rounded-full",
                                order.status === 'Delivered' ? 'bg-green-100 text-green-700 border-none' : 
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-none' : 'bg-orange-100 text-orange-700 border-none'
                              )}>
                                {order.status}
                              </Badge>
                            </div>
                            
                            <div className="w-full grid grid-cols-2 gap-3">
                               <Button size="sm" variant="outline" className="rounded-2xl h-11 font-black text-[9px] uppercase border-muted-foreground/20" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>Prep</Button>
                               <Button size="sm" variant="outline" className="rounded-2xl h-11 font-black text-[9px] uppercase border-muted-foreground/20" onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}>Ride</Button>
                               <Button size="sm" variant="default" className="rounded-2xl h-11 font-black text-[9px] uppercase col-span-2 shadow-lg shadow-primary/20" onClick={() => handleUpdateStatus(order.id, 'Delivered')}>Complete</Button>
                               <div className="flex gap-2 col-span-2">
                                 <Button variant="ghost" className="flex-1 rounded-2xl text-destructive font-black text-[9px] uppercase hover:bg-red-50" onClick={() => handleUpdateStatus(order.id, 'Cancelled')}>Cancel</Button>
                                 <Button size="icon" variant="ghost" className="rounded-2xl text-muted-foreground hover:bg-muted" onClick={() => handleDeleteOrder(order.id)}><Trash2 className="w-4 h-4" /></Button>
                               </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-10">
            <Button onClick={() => { resetForm(); setIsMenuDialogOpen(true); }} className="rounded-[1.5rem] h-16 px-12 font-black uppercase tracking-widest text-xs gap-3 shadow-2xl shadow-primary/20 w-full sm:w-auto transition-transform active:scale-95 bg-primary text-white">
              <Plus className="w-5 h-5" /> Add Culinary Entry
            </Button>

            <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
              <DialogContent className="max-w-2xl p-0 rounded-[3rem] overflow-hidden border-none shadow-3xl bg-card">
                <div className="bg-primary p-10 text-white relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  <DialogTitle className="text-3xl font-black font-headline uppercase tracking-tight relative z-10">
                    {editingItem ? 'Refine Entry' : 'New Dish Metadata'}
                  </DialogTitle>
                </div>
                <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Dish Name</Label>
                    <Input 
                      ref={firstInputRef} 
                      value={menuFormData.name} 
                      onChange={e => setMenuFormData({...menuFormData, name: e.target.value})} 
                      placeholder="e.g. Signature Truffle Maggie" 
                      className="h-14 rounded-2xl focus:ring-primary/20 font-bold border-muted" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Price (₹)</Label>
                      <Input 
                        type="number" 
                        value={menuFormData.price} 
                        onChange={e => setMenuFormData({...menuFormData, price: e.target.value})} 
                        className="h-14 rounded-2xl focus:ring-primary/20 font-bold border-muted" 
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Category</Label>
                      <select 
                        value={menuFormData.category} 
                        onChange={e => setMenuFormData({...menuFormData, category: e.target.value})} 
                        className="w-full h-14 rounded-2xl border bg-secondary/20 px-6 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Asset Reference (URL)</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          value={menuFormData.imageUrl} 
                          onChange={e => setMenuFormData({...menuFormData, imageUrl: e.target.value})} 
                          placeholder="https://images.unsplash.com/..." 
                          className="h-14 rounded-2xl pl-12 focus:ring-primary/20 font-bold border-muted" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60">Narrative / Description</Label>
                    <Textarea 
                      value={menuFormData.description} 
                      onChange={e => setMenuFormData({...menuFormData, description: e.target.value})} 
                      placeholder="Explain the taste profile..." 
                      className="rounded-2xl min-h-[120px] focus:ring-primary/20 font-bold border-muted p-6" 
                    />
                  </div>
                </div>
                <div className="p-10 bg-secondary/10 flex gap-6">
                  <Button variant="outline" className="flex-1 h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs border-muted-foreground/20" onClick={() => setIsMenuDialogOpen(false)} disabled={saveLoading}>
                    Abort
                  </Button>
                  <Button className="flex-1 h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 bg-primary text-white" onClick={handleSaveMenuItem} disabled={saveLoading}>
                    {saveLoading ? <Loader2 className="animate-spin" /> : editingItem ? 'Update Hub' : 'Push to Production'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {menuLoading ? (
                <div className="col-span-full py-20 text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                  <p className="mt-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">Hydrating Product Nodes...</p>
                </div>
              ) : dbMenu?.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white/50 rounded-[4rem] border-4 border-dashed border-muted/30">
                  <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">No active nodes in production.</p>
                </div>
              ) : dbMenu?.map((item: any) => (
                <Card key={item.id} className="rounded-[3rem] border-none shadow-xl overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all bg-white/80 backdrop-blur">
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Badge className="absolute top-6 left-6 bg-white/90 backdrop-blur-md text-[9px] uppercase font-black text-foreground border-none px-4 py-1.5 rounded-full shadow-lg">
                      {item.category}
                    </Badge>
                  </div>
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex-1 min-w-0 mr-4">
                        <h4 className="font-black text-xl truncate tracking-tight">{item.name}</h4>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{item.isVeg ? 'Vegetarian' : 'Standard'}</p>
                      </div>
                      <p className="text-2xl font-black text-primary italic">₹{item.price}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-2xl h-12 font-black text-[10px] uppercase gap-2 hover:bg-primary/5 hover:text-primary transition-colors border-muted-foreground/20" 
                        onClick={() => { 
                          setEditingItem(item); 
                          setMenuFormData({ ...item, price: item.price.toString() }); 
                          setIsMenuDialogOpen(true); 
                        }}
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="rounded-2xl h-12 px-5 text-destructive hover:bg-red-50 transition-colors" 
                        onClick={() => { 
                          if(confirm("Expunge entry permanently?")) {
                            deleteDoc(doc(db, 'products', item.id)).catch(async (e) => {
                              errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `products/${item.id}`, operation: 'delete' }));
                            });
                          }
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="marketing">
             <Card className="rounded-[4rem] border-none shadow-2xl bg-white/80 backdrop-blur p-12 md:p-20 relative overflow-hidden">
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
                <div className="max-w-3xl relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-primary text-white rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20 transform -rotate-12">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">AI Content Labs</h3>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Generative Marketing Engine</p>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-12 text-lg font-medium leading-relaxed">Tap into our neural network to synthesize viral social media narratives for your culinary creations.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
                    {dbMenu?.slice(0, 8).map((item: any) => (
                      <button 
                        key={item.id} 
                        onClick={() => setSelectedPromoDish(item)} 
                        className={cn(
                          "p-6 rounded-[2rem] border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                          selectedPromoDish?.id === item.id 
                            ? "border-primary bg-primary text-white scale-105 shadow-xl shadow-primary/20" 
                            : "border-muted hover:border-primary/30 bg-white/50 hover:bg-white"
                        )}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="rounded-[2rem] h-20 px-14 font-black uppercase tracking-[0.2em] text-xs gap-4 shadow-2xl shadow-primary/20 w-full sm:w-auto active:scale-95 transition-all bg-primary text-white" 
                    onClick={async () => {
                      if (!selectedPromoDish) return;
                      setPromoLoading(true);
                      try {
                        const res = await dailySpecialGenerator({ dishName: selectedPromoDish.name, basePrice: selectedPromoDish.price, discountPercent: 20 });
                        setPromoResult(res);
                      } catch { 
                        toast({ variant: "destructive", title: "AI Sync Failed", description: "Neural pathways blocked. Please retry." }); 
                      } finally { 
                        setPromoLoading(false); 
                      }
                    }} 
                    disabled={promoLoading || !selectedPromoDish}
                  >
                    {promoLoading ? <Loader2 className="animate-spin" /> : <Megaphone className="w-6 h-6" />} Synthesize Viral Narrative
                  </Button>

                  {promoResult && (
                    <div className="mt-16 p-10 bg-primary/5 rounded-[3.5rem] border-2 border-primary/10 space-y-8 animate-in zoom-in duration-700">
                      <div className="flex justify-between items-start">
                        <h4 className="text-3xl md:text-4xl font-black">{promoResult.promoTitle} {promoResult.emoji}</h4>
                        <Badge className="bg-primary text-white border-none font-black uppercase tracking-widest px-4 py-1">20% Discount applied</Badge>
                      </div>
                      <p className="text-xl md:text-2xl font-medium italic opacity-80 leading-relaxed font-headline">"{promoResult.promoDescription}"</p>
                      <div className="flex items-center justify-between pt-6 border-t border-primary/10">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Promo Value</p>
                           <p className="text-3xl font-black text-primary">₹{promoResult.finalPrice}</p>
                        </div>
                        <Button className="rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest gap-2" onClick={() => { 
                          navigator.clipboard.writeText(`${promoResult.promoTitle}\n\n${promoResult.promoDescription}\n\nNow only ₹${promoResult.finalPrice}!`); 
                          toast({ title: "Narrative Copied to Clipboard" }); 
                        }}>
                          Copy for Social
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
