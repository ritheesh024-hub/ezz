
"use client"
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  IndianRupee, Sparkles, Loader2, 
  Package, Clock, CheckCircle2,
  Megaphone,
  LayoutDashboard, Trash2, Plus, Edit2, X, Image as ImageIcon, Upload, RefreshCw
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CATEGORIES } from '@/app/lib/menu-data';
import { dailySpecialGenerator } from '@/ai/flows/daily-special-generator';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const AdminSection = () => {
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  // Real-time Queries
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
  }, [db]);
  const { data: realOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const menuQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'menu'), orderBy('updatedAt', 'desc'));
  }, [db]);
  const { data: dbMenu, loading: menuLoading } = useCollection<any>(menuQuery);

  // Marketing State
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState<any>(null);

  // Menu Management State
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    name: '', 
    description: '', 
    price: '', 
    category: 'Veg Maggie', 
    image: '', 
    isVeg: true, 
    isAvailable: true, 
    rating: '4.5'
  });

  // Calculate Stats
  const stats = useMemo(() => {
    if (!realOrders) return { revenue: 0, count: 0, delivered: 0 };
    const deliveredOrders = realOrders.filter(o => o.status === 'Delivered');
    const revenue = deliveredOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    return { revenue, count: realOrders.length, delivered: deliveredOrders.length };
  }, [realOrders]);

  // Order Actions
  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus })
      .then(() => toast({ title: `Status Updated`, description: `Order is now ${newStatus}` }))
      .catch((e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'update' }));
      });
  };

  const handleDeleteOrder = (id: string) => {
    if (!db || !window.confirm("Permanently delete this order record?")) return;
    const orderRef = doc(db, 'orders', id);
    deleteDoc(orderRef)
      .then(() => toast({ title: `Order deleted successfully` }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'delete' })));
  };

  // Menu Actions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 750 * 1024) { 
        toast({ variant: "destructive", title: "File too large", description: "Please upload an image under 750KB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMenuFormData(prev => ({ ...prev, image: event.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setMenuFormData({ 
      name: '', 
      description: '', 
      price: '', 
      category: 'Veg Maggie', 
      image: '', 
      isVeg: true, 
      isAvailable: true, 
      rating: '4.5' 
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };

  const handleSaveMenuItem = async () => {
    if (!db || !menuFormData.name || !menuFormData.image) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name and Image are required." });
      return;
    }
    
    setSaveLoading(true);
    const itemId = editingItem ? editingItem.id : `ITEM-${Date.now()}`;
    const itemRef = doc(db, 'menu', itemId);
    
    const finalData = {
      id: itemId,
      name: menuFormData.name.trim(),
      description: (menuFormData.description || '').trim(),
      price: Number(menuFormData.price) || 0,
      category: menuFormData.category,
      image: menuFormData.image,
      isVeg: Boolean(menuFormData.isVeg),
      isAvailable: Boolean(menuFormData.isAvailable),
      rating: Number(menuFormData.rating) || 4.5,
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(itemRef, finalData, { merge: true });
      toast({ title: editingItem ? "Item Updated" : "Dish Published 🚀", description: `${finalData.name} is now live.` });
      
      if (editingItem) {
        setIsMenuDialogOpen(false);
      } else {
        // Continuous add: keep dialog open but reset form
        resetForm();
      }
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: itemRef.path, 
        operation: 'write', 
        requestResourceData: finalData 
      }));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setMenuFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      category: item.category || 'Veg Maggie',
      image: item.image || '',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      rating: item.rating?.toString() || '4.5'
    });
    setIsMenuDialogOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!db || !window.confirm("Are you sure you want to remove this dish from the menu?")) return;
    const itemRef = doc(db, 'menu', id);
    try {
      await deleteDoc(itemRef);
      toast({ title: "Item Removed", description: "Dish has been deleted from the database." });
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'delete' }));
    }
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
      toast({ variant: "destructive", title: "AI Generation Failed", description: "Please try again later." });
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <section className="py-6 md:py-10 bg-secondary/5 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-in fade-in slide-in-from-top duration-700">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary rounded-2xl shadow-xl transform -rotate-3">
                 <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight font-headline">Admin <span className="text-primary">Console</span></h1>
            </div>
            <p className="text-sm text-muted-foreground font-medium pl-1">Managing Easy Bites Real-time Operations</p>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="bg-green-100/50 text-green-700 border-green-200 px-4 py-1.5 text-[10px] uppercase font-black rounded-full animate-pulse">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
               Live System
             </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-card p-1.5 rounded-2xl border w-full flex overflow-x-auto scrollbar-hide shadow-sm">
            <TabsTrigger value="overview" className="flex-1 text-[11px] font-black py-3 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all uppercase tracking-widest">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 text-[11px] font-black py-3 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all uppercase tracking-widest">Orders</TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1 text-[11px] font-black py-3 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all uppercase tracking-widest">Inventory</TabsTrigger>
            <TabsTrigger value="marketing" className="flex-1 text-[11px] font-black py-3 px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Marketing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
               {[
                 { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
                 { label: "Total Orders", value: stats.count.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
                 { label: "Efficiency", value: stats.count > 0 ? `${Math.round((stats.delivered / stats.count) * 100)}%` : "0%", icon: CheckCircle2, color: "text-orange-600", bg: "bg-orange-50" },
                 { label: "Avg Rating", value: "4.8", icon: Sparkles, color: "text-yellow-600", bg: "bg-yellow-50" }
               ].map((s, i) => (
                 <Card key={i} className="rounded-3xl border-none shadow-lg overflow-hidden bg-card hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6">
                       <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center mb-4 ${s.color}`}>
                          <s.icon className="w-6 h-6" />
                       </div>
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{s.label}</p>
                       <h3 className="text-2xl md:text-3xl font-black">{s.value}</h3>
                    </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="orders" className="animate-in fade-in duration-500">
            <Card className="rounded-3xl shadow-2xl border-none overflow-hidden">
              <div className="p-6 border-b bg-card flex justify-between items-center">
                 <h3 className="font-black uppercase tracking-widest text-sm">Order Log</h3>
                 <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="rounded-full h-8 w-8 p-0">
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                 </Button>
              </div>
              <div className="overflow-x-auto">
                {ordersLoading ? (
                  <div className="p-24 flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-xs font-black uppercase tracking-widest opacity-40">Syncing Live Orders...</p>
                  </div>
                ) : realOrders.length === 0 ? (
                  <div className="p-24 text-center text-muted-foreground text-sm font-bold uppercase tracking-widest">No orders found.</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-none">
                        <TableHead className="text-[10px] font-black uppercase py-5 px-6">Customer & Total</TableHead>
                        <TableHead className="text-[10px] font-black uppercase py-5 px-6">Current Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase py-5 px-6 text-right">Quick Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {realOrders.map((order: any) => (
                        <TableRow key={order.id} className="hover:bg-muted/10 border-muted/20">
                          <TableCell className="py-6 px-6">
                            <div className="flex flex-col">
                              <span className="font-black text-sm">{order.customerName}</span>
                              <span className="text-[10px] text-muted-foreground font-bold">₹{order.total} • {order.items?.length || 0} items</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6">
                            <Badge className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'Preparing' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl hover:bg-blue-50 text-blue-600 border-blue-100" title="Mark Preparing" onClick={() => handleUpdateStatus(order.id, 'Preparing')}><Clock className="w-4 h-4" /></Button>
                              <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl hover:bg-green-50 text-green-600 border-green-100" title="Mark Delivered" onClick={() => handleUpdateStatus(order.id, 'Delivered')}><CheckCircle2 className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive" title="Delete" onClick={() => handleDeleteOrder(order.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col md:flex-row gap-4">
              <Button 
                className="rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] gap-3 shadow-2xl shadow-primary/30 flex-1 md:flex-none md:px-10" 
                onClick={() => {resetForm(); setIsMenuDialogOpen(true);}}
              >
                <Plus className="w-5 h-5" /> Add New Dish
              </Button>
            </div>

            <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
              <DialogContent className="max-w-2xl p-0 rounded-[32px] overflow-hidden border-none shadow-3xl">
                <div className="bg-primary p-8 text-white relative">
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight font-headline">
                    {editingItem ? 'Modify Dish' : 'Create New Dish'}
                  </DialogTitle>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Dish Identity & Specifications</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-8 right-6 text-white hover:bg-white/10 rounded-full"
                    onClick={() => setIsMenuDialogOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Dish Title</Label>
                    <Input 
                      ref={firstInputRef}
                      value={menuFormData.name} 
                      onChange={(e) => setMenuFormData({...menuFormData, name: e.target.value})} 
                      placeholder="e.g. Classic Peri Peri Maggie"
                      className="rounded-2xl h-14 border-muted bg-secondary/20 font-bold focus:ring-primary/20" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Base Price (₹)</Label>
                      <Input 
                        type="number" 
                        value={menuFormData.price} 
                        onChange={(e) => setMenuFormData({...menuFormData, price: e.target.value})} 
                        placeholder="0"
                        className="rounded-2xl h-14 border-muted bg-secondary/20 font-bold focus:ring-primary/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Dietary Type</Label>
                      <div className="h-14 flex items-center justify-between px-5 bg-secondary/30 rounded-2xl border border-muted">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${menuFormData.isVeg ? 'text-green-600' : 'text-red-600'}`}>
                          {menuFormData.isVeg ? 'Veg Only' : 'Non-Veg'}
                        </span>
                        <Switch 
                          checked={menuFormData.isVeg} 
                          onCheckedChange={(v) => setMenuFormData({...menuFormData, isVeg: v})} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Menu Category</Label>
                    <select 
                      className="w-full h-14 rounded-2xl border px-5 text-sm font-black uppercase tracking-widest bg-secondary/20 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={menuFormData.category}
                      onChange={(e) => setMenuFormData({...menuFormData, category: e.target.value})}
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Dish Description</Label>
                    <Textarea 
                      value={menuFormData.description} 
                      onChange={(e) => setMenuFormData({...menuFormData, description: e.target.value})} 
                      placeholder="Ingredients, preparation style..."
                      className="rounded-2xl min-h-[100px] border-muted bg-secondary/20 p-5 text-sm font-medium" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Dish Photo</Label>
                    <div 
                      className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${menuFormData.image ? 'border-primary/30 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 bg-secondary/10'}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {menuFormData.image ? (
                        <div className="relative w-full h-40 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                          <img src={menuFormData.image} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                             <Upload className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-foreground">Upload Photo</p>
                            <p className="text-[10px] text-muted-foreground mt-1">High-quality JPG/PNG (Max 750KB)</p>
                          </div>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-secondary/20 flex gap-4 border-t">
                  <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)} className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] border-2">Discard</Button>
                  <Button 
                    onClick={handleSaveMenuItem} 
                    disabled={saveLoading || !menuFormData.name || !menuFormData.image} 
                    className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] shadow-xl"
                  >
                    {saveLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : editingItem ? 'Update Dish' : 'Publish Dish'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuLoading ? (
                 <div className="col-span-full py-20 flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-xs font-black uppercase tracking-widest opacity-40">Loading Inventory...</p>
                 </div>
              ) : dbMenu?.length === 0 ? (
                 <div className="col-span-full py-20 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-40">Your menu is empty.</div>
              ) : dbMenu?.map((item: any) => (
                <Card key={item.id} className="rounded-3xl border-none shadow-lg overflow-hidden bg-card hover:shadow-2xl transition-all animate-in zoom-in duration-500">
                  <div className="relative h-40 bg-secondary">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4">
                       <Badge className={`rounded-full px-3 py-1 font-black text-[9px] uppercase border shadow-md ${item.isVeg ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                         {item.isVeg ? 'Veg' : 'Non-Veg'}
                       </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-lg leading-tight truncate max-w-[180px]">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{item.category}</p>
                      </div>
                      <p className="font-black text-xl text-primary">₹{item.price}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1 rounded-xl h-11 font-black text-[10px] uppercase border-2 gap-2" onClick={() => handleEditClick(item)}>
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button variant="ghost" className="rounded-xl h-11 px-3 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="animate-in fade-in duration-500">
             <Card className="rounded-[40px] border-none shadow-2xl bg-card p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                   <Megaphone className="w-48 h-48 rotate-12" />
                </div>
                <div className="max-w-2xl relative z-10">
                  <div className="flex items-center gap-3 text-primary font-black mb-6 uppercase tracking-[0.3em] text-xs">
                    <Sparkles className="w-5 h-5" /> AI Campaign Engine
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Generate Viral Social Media Posts</h3>
                  <p className="text-muted-foreground font-medium text-lg mb-10 leading-relaxed">
                    Select a dish from your active menu and let our Genkit-powered AI create a punchy, hunger-inducing promotion.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    {(dbMenu || []).slice(0, 8).map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedPromoDish(item)}
                        className={`p-4 rounded-[20px] border-2 text-left transition-all relative overflow-hidden group ${
                          selectedPromoDish?.id === item.id ? 'border-primary bg-primary/5 shadow-lg' : 'border-muted bg-muted/20 hover:border-primary/30'
                        }`}
                      >
                        <p className="text-[10px] font-black truncate uppercase tracking-widest">{item.name}</p>
                        {selectedPromoDish?.id === item.id && (
                           <div className="absolute top-1 right-1">
                              <CheckCircle2 className="w-3 h-3 text-primary" />
                           </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <Button 
                    size="lg"
                    className="w-full sm:w-auto h-16 px-12 rounded-[24px] text-lg font-black uppercase tracking-widest gap-3 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all" 
                    onClick={handleGeneratePromo} 
                    disabled={promoLoading || !selectedPromoDish}
                  >
                    {promoLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Megaphone className="w-6 h-6" />}
                    Create Promotion
                  </Button>

                  {promoResult && (
                    <div className="mt-12 p-8 bg-primary/5 rounded-[32px] border-2 border-primary/20 space-y-6 animate-in zoom-in duration-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge className="bg-primary text-white font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest text-[9px]">Live Preview</Badge>
                          <h4 className="font-black text-2xl font-headline">{promoResult.promoTitle} {promoResult.emoji}</h4>
                        </div>
                        <p className="text-4xl font-black text-primary italic">₹{promoResult.finalPrice}</p>
                      </div>
                      <p className="text-muted-foreground font-medium italic leading-relaxed text-lg border-l-4 border-primary/20 pl-6">
                        "{promoResult.promoDescription}"
                      </p>
                      <div className="flex gap-4">
                        <Button className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl" onClick={() => {
                          navigator.clipboard.writeText(`${promoResult.promoTitle} ${promoResult.emoji}\n\n${promoResult.promoDescription}\n\n🔥 Grab it now for only ₹${promoResult.finalPrice}! Order via Easy Bites.`);
                          toast({ title: "Copied to Clipboard!", description: "Paste it on Instagram, WhatsApp or Facebook." });
                        }}>Copy Caption</Button>
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
