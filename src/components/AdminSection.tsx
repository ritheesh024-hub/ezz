
"use client"
import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, IndianRupee, MessageSquare, Sparkles, Loader2, 
  Package, Clock, CheckCircle2, ShoppingCart,
  ArrowUpRight, Megaphone,
  LayoutDashboard, Zap, Star, Trash2, Plus, Edit2, X, Image as ImageIcon, Upload
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { CATEGORIES } from '@/app/lib/menu-data';
import { reviewSummaryGenerator } from '@/ai/flows/review-summary-generator';
import { dailySpecialGenerator } from '@/ai/flows/daily-special-generator';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const AdminSection = () => {
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Real-time Orders
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
  }, [db]);
  const { data: realOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  // Real-time Menu
  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'menu'), orderBy('category'));
  }, [db]);
  const { data: dbMenu, loading: menuLoading } = useCollection<any>(menuQuery);

  // AI State
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState<any>(null);

  // Menu Form State
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Veg Maggie',
    image: '',
    isVeg: true,
    isAvailable: true,
    rating: 4.5
  });

  // Dynamic Stats
  const stats = useMemo(() => {
    if (!realOrders) return { revenue: 0, count: 0, delivered: 0 };
    const deliveredOrders = realOrders.filter(o => o.status === 'Delivered');
    const revenue = deliveredOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    return {
      revenue,
      count: realOrders.length,
      delivered: deliveredOrders.length
    };
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus })
      .then(() => {
        toast({ title: `Order updated to ${newStatus}` });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'update' }));
      });
  };

  const handleDeleteOrder = (id: string) => {
    const orderRef = doc(db, 'orders', id);
    deleteDoc(orderRef)
      .then(() => {
        toast({ title: `Order deleted` });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'delete' }));
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 750 * 1024) { 
        toast({ 
          variant: "destructive", 
          title: "File too large", 
          description: "Please select an image smaller than 750KB." 
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMenuFormData(prev => ({ ...prev, image: event.target?.result as string }));
          toast({ title: "Image ready", description: "The photo has been uploaded and previewed." });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMenuItem = () => {
    if (!db) return;
    setSaveLoading(true);
    const itemId = editingItem ? editingItem.id : `ITEM-${Date.now()}`;
    const itemRef = doc(db, 'menu', itemId);
    const data = {
      ...menuFormData,
      id: itemId,
      price: Number(menuFormData.price),
      updatedAt: serverTimestamp()
    };

    setDoc(itemRef, data, { merge: true })
      .then(() => {
        toast({ 
          title: editingItem ? "Item Updated" : "Success!", 
          description: `${data.name} is now live on the menu.` 
        });
        setIsMenuDialogOpen(false);
        setEditingItem(null);
        setSaveLoading(false);
        setMenuFormData({
          name: '', description: '', price: 0, category: 'Veg Maggie', image: '', isVeg: true, isAvailable: true, rating: 4.5
        });
      })
      .catch(async (error) => {
        setSaveLoading(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: itemRef.path, 
          operation: 'write', 
          requestResourceData: data 
        }));
      });
  };

  const toggleAvailability = (id: string, current: boolean) => {
    const itemRef = doc(db, 'menu', id);
    updateDoc(itemRef, { isAvailable: !current })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'update' }));
      });
  };

  const handleDeleteItem = (id: string) => {
    const itemRef = doc(db, 'menu', id);
    deleteDoc(itemRef)
      .then(() => toast({ title: "Item removed from menu" }))
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'delete' }));
      });
  };

  const handleGeneratePromo = async () => {
    if (!selectedPromoDish) return;
    setPromoLoading(true);
    try {
      const result = await dailySpecialGenerator({
        dishName: selectedPromoDish.name,
        basePrice: selectedPromoDish.price,
        discountPercent: 15
      });
      setPromoResult(result);
    } catch (error) {
      toast({ variant: "destructive", title: "Promo Generation Failed" });
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <section className="py-8 bg-muted/20 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top duration-700">
          <div>
            <h1 className="text-3xl font-headline font-black tracking-tight flex items-center gap-2">
              <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20 transform rotate-3">
                 <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              Easy<span className="text-primary">Bites</span> Command Center
            </h1>
            <p className="text-muted-foreground text-sm font-medium ml-12">Real-time operations & dynamic menu control</p>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-full">Kitchen: LIVE</Badge>
             <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-full">Delivery: {stats.count > 0 ? 'BUSY' : 'IDLE'}</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card p-1.5 rounded-[20px] border w-full md:w-auto shadow-sm">
            <TabsTrigger value="overview" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2">
              Orders {stats.count > 0 && <Badge className="ml-1 bg-white text-primary h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">{stats.count}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Menu & Stock</TabsTrigger>
            <TabsTrigger value="marketing" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Marketing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
                 { label: "Total Orders", value: stats.count.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
                 { label: "Success Rate", value: stats.count > 0 ? `${Math.round((stats.delivered / stats.count) * 100)}%` : "0%", icon: CheckCircle2, color: "text-orange-600", bg: "bg-orange-50" },
                 { label: "AI Rating", value: "4.8", icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" }
               ].map((s, i) => (
                 <Card key={i} className="rounded-[32px] border-none shadow-xl overflow-hidden bg-card hover:scale-[1.02] transition-transform duration-300">
                    <CardContent className="p-8">
                       <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center mb-4 ${s.color}`}>
                          <s.icon className="w-6 h-6" />
                       </div>
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{s.label}</p>
                       <h3 className="text-3xl font-black">{s.value}</h3>
                    </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom duration-500">
            <Card className="rounded-[32px] shadow-xl border-none overflow-hidden">
              {ordersLoading ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Syncing real-time orders...</p>
                </div>
              ) : realOrders.length === 0 ? (
                <div className="p-24 text-center flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground opacity-30" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">No orders found</h3>
                    <p className="text-muted-foreground text-sm font-medium">Orders will appear here as customers place them.</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-6 px-8">Order ID</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-6">Customer</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-6">Items</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-6">Total</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-6">Status</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-6 text-right px-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {realOrders.map((order: any, idx: number) => (
                      <TableRow key={order.id} className="group hover:bg-muted/20 border-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs font-bold px-8">{order.orderId}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{order.customerName}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{order.customerPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {order.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                        </TableCell>
                        <TableCell className="font-black text-primary">₹{order.total}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`rounded-lg font-black uppercase text-[9px] px-2.5 py-1 ${
                            order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100' :
                            order.status === 'Preparing' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            order.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl hover:bg-primary hover:text-white transition-all" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>
                              <Clock className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl hover:bg-green-600 hover:text-white transition-all text-green-600" onClick={() => handleUpdateStatus(order.id, 'Delivered')}>
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDeleteOrder(order.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-widest">Menu Management</h2>
                <p className="text-muted-foreground text-sm font-medium mt-1">Add or update dishes live on the storefront</p>
              </div>
              <Dialog open={isMenuDialogOpen} onOpenChange={(open) => {
                setIsMenuDialogOpen(open);
                if (!open) { 
                  setEditingItem(null); 
                  setMenuFormData({ 
                    name: '', description: '', price: 0, category: 'Veg Maggie', image: '', isVeg: true, isAvailable: true, rating: 4.5 
                  }); 
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                    <Plus className="w-5 h-5" /> Add New Dish
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-[40px] max-h-[90vh] overflow-y-auto border-none shadow-3xl p-0 overflow-hidden">
                  <div className="bg-primary p-8 text-white relative">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-black tracking-tight">{editingItem ? 'Edit Dish' : 'Craft New Dish'}</DialogTitle>
                      <CardDescription className="text-white/70 font-medium">Configure item details for the digital menu.</CardDescription>
                    </DialogHeader>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dish Identity</Label>
                          <Input value={menuFormData.name} onChange={(e) => setMenuFormData({...menuFormData, name: e.target.value})} placeholder="e.g. Peri Peri Maggie" className="rounded-xl h-12 border-muted bg-muted/20" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price (₹)</Label>
                             <Input type="number" value={menuFormData.price} onChange={(e) => setMenuFormData({...menuFormData, price: Number(e.target.value)})} className="rounded-xl h-12 border-muted bg-muted/20" />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Type</Label>
                             <div className="h-12 flex items-center gap-3 px-3 bg-muted/20 rounded-xl border border-muted">
                               <Switch checked={menuFormData.isVeg} onCheckedChange={(v) => setMenuFormData({...menuFormData, isVeg: v})} />
                               <span className="text-xs font-bold">{menuFormData.isVeg ? 'Veg' : 'Non-Veg'}</span>
                             </div>
                           </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                          <select 
                            className="flex h-12 w-full rounded-xl border border-muted bg-muted/20 px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={menuFormData.category}
                            onChange={(e) => setMenuFormData({...menuFormData, category: e.target.value})}
                          >
                            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visual Branding</Label>
                          <div className="flex flex-col gap-4">
                            {menuFormData.image ? (
                              <div className="relative w-full h-40 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-muted group/img">
                                <img src={menuFormData.image} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button 
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setMenuFormData({...menuFormData, image: ''})}
                                    className="rounded-full h-10 w-10 p-0"
                                  >
                                    <X className="w-5 h-5" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="border-2 border-dashed border-muted-foreground/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 group"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Upload className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-black uppercase tracking-widest">Select Image</p>
                                  <p className="text-[9px] text-muted-foreground font-bold mt-1">PNG, JPG up to 750KB</p>
                                </div>
                              </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dish Description</Label>
                          <Textarea value={menuFormData.description} onChange={(e) => setMenuFormData({...menuFormData, description: e.target.value})} placeholder="Delicious spicy noodles with..." className="min-h-[100px] rounded-xl border-muted bg-muted/20" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-8 flex justify-end gap-4 border-t">
                    <Button variant="ghost" onClick={() => setIsMenuDialogOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-xs px-8">Discard</Button>
                    <Button onClick={handleSaveMenuItem} disabled={!menuFormData.name || !menuFormData.image || saveLoading} className="rounded-xl h-12 px-10 font-black uppercase tracking-widest shadow-xl">
                      {saveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {editingItem ? 'Save Changes' : 'Publish Dish'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {menuLoading ? (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Loading digital menu...</p>
              </div>
            ) : dbMenu.length === 0 ? (
              <div className="p-24 text-center bg-card rounded-[40px] border-2 border-dashed border-muted/50">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-10 h-10 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-2xl font-bold mb-2">The menu is empty</h3>
                <p className="text-muted-foreground font-medium mb-8">Ready to serve something delicious? Add your first dish to get started.</p>
                <Button variant="outline" className="rounded-full px-10 h-12 font-black uppercase tracking-widest" onClick={() => setIsMenuDialogOpen(true)}>Start Crafting</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {dbMenu.map((item: any, idx: number) => (
                  <Card key={item.id} className="rounded-[32px] border-none shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                    <CardContent className="p-0">
                      <div className="relative h-48 bg-muted overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4">
                           {item.isVeg ? (
                             <div className="w-6 h-6 bg-white rounded-md border border-green-500 flex items-center justify-center">
                               <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                             </div>
                           ) : (
                             <div className="w-6 h-6 bg-white rounded-md border border-red-500 flex items-center justify-center">
                               <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                             </div>
                           )}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                          <div className="max-w-[150px]">
                            <h4 className="text-white font-bold text-lg truncate leading-tight">{item.name}</h4>
                            <span className="text-white/60 text-[9px] uppercase font-black tracking-[0.2em]">{item.category}</span>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur hover:bg-white/40 border-none text-white shadow-xl" onClick={() => {
                              setEditingItem(item);
                              setMenuFormData({...item});
                              setIsMenuDialogOpen(true);
                            }}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-9 w-9 rounded-xl shadow-xl" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-xl font-black text-primary">₹{item.price}</p>
                            <Badge variant={item.isAvailable ? "outline" : "destructive"} className={`text-[9px] h-5 rounded-md px-2 font-black uppercase tracking-widest ${item.isAvailable ? 'bg-green-50 text-green-700 border-green-200' : ''}`}>
                              {item.isAvailable ? "In Stock" : "Sold Out"}
                            </Badge>
                         </div>
                         <div className="flex flex-col items-center gap-1.5">
                           <Switch checked={item.isAvailable} onCheckedChange={() => toggleAvailability(item.id, item.isAvailable)} className="scale-90" />
                           <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Active</span>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6 animate-in fade-in duration-500">
             <div className="grid lg:grid-cols-3 gap-10">
                <Card className="rounded-[40px] border-none shadow-xl bg-card">
                   <CardHeader className="p-8">
                     <CardTitle className="text-xl font-black uppercase tracking-widest">AI Content Engine</CardTitle>
                     <CardDescription className="font-medium">Let Genkit craft your daily specials and social copy.</CardDescription>
                   </CardHeader>
                   <CardContent className="px-8 pb-8 space-y-6">
                      <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Select Featured Dish</Label>
                         <div className="grid grid-cols-2 gap-3">
                           {(dbMenu.length > 0 ? dbMenu : []).slice(0, 4).map((item: any) => (
                             <button
                               key={item.id}
                               onClick={() => setSelectedPromoDish(item)}
                               className={`p-4 rounded-2xl border-2 text-left transition-all group ${
                                 selectedPromoDish?.id === item.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'
                               }`}
                             >
                               <span className={`text-[10px] block font-black truncate ${selectedPromoDish?.id === item.id ? 'text-primary' : 'text-muted-foreground'}`}>{item.name}</span>
                               <span className="text-[8px] font-bold opacity-50">₹{item.price}</span>
                             </button>
                           ))}
                         </div>
                      </div>
                      <Button 
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-2xl shadow-primary/20"
                        onClick={handleGeneratePromo}
                        disabled={promoLoading || !selectedPromoDish}
                      >
                        {promoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                        Generate Campaign
                      </Button>
                   </CardContent>
                </Card>

                <Card className="lg:col-span-2 rounded-[40px] border-none shadow-2xl bg-muted/20 relative flex items-center justify-center p-12 overflow-hidden min-h-[400px]">
                   {promoResult ? (
                     <div className="max-w-md w-full space-y-8 animate-in zoom-in duration-500">
                        <div className="p-10 bg-card rounded-[48px] shadow-3xl border border-primary/10 relative">
                           <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl shadow-2xl shadow-primary/40 animate-bounce">
                             {promoResult.emoji}
                           </div>
                           <Badge className="bg-primary/10 text-primary border-primary/20 mb-6 font-black uppercase tracking-[0.3em] text-[10px] px-4 py-1.5 rounded-full">AI Generated Promo</Badge>
                           <h4 className="text-3xl font-black mb-4 text-foreground leading-tight">{promoResult.promoTitle}</h4>
                           <p className="text-sm text-muted-foreground leading-relaxed mb-10 font-medium italic">"{promoResult.promoDescription}"</p>
                           <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[32px] border border-primary/10">
                              <div>
                                 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Campaign Price</p>
                                 <p className="text-3xl font-black text-primary">₹{promoResult.finalPrice}</p>
                              </div>
                              <Button className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] gap-2" onClick={() => {
                                navigator.clipboard.writeText(`${promoResult.promoTitle}\n${promoResult.promoDescription}\nOnly for ₹${promoResult.finalPrice}!`);
                                toast({ title: "Campaign Copied!" });
                              }}>
                                 Copy Assets
                              </Button>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center space-y-4 opacity-30">
                        <Sparkles className="w-16 h-16 mx-auto text-primary animate-pulse" />
                        <div>
                          <p className="text-xl font-black uppercase tracking-[0.2em]">Ready to Launch?</p>
                          <p className="text-sm font-bold">Select a dish and click "Generate Campaign" to start.</p>
                        </div>
                     </div>
                   )}
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
