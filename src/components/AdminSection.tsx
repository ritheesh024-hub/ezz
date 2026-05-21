
"use client"
import React, { useState, useMemo, useRef } from 'react';
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
  LayoutDashboard, Trash2, Plus, Edit2, X, Image as ImageIcon, Upload
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

  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState<any>(null);

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    name: '', description: '', price: 0, category: 'Veg Maggie', image: '', isVeg: true, isAvailable: true, rating: 4.5
  });

  const stats = useMemo(() => {
    if (!realOrders) return { revenue: 0, count: 0, delivered: 0 };
    const deliveredOrders = realOrders.filter(o => o.status === 'Delivered');
    const revenue = deliveredOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    return { revenue, count: realOrders.length, delivered: deliveredOrders.length };
  }, [realOrders]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    const orderRef = doc(db, 'orders', id);
    updateDoc(orderRef, { status: newStatus })
      .then(() => toast({ title: `Updated to ${newStatus}` }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'update' })));
  };

  const handleDeleteOrder = (id: string) => {
    if (!db || !confirm("Delete this order?")) return;
    const orderRef = doc(db, 'orders', id);
    deleteDoc(orderRef)
      .then(() => toast({ title: `Order deleted` }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'delete' })));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { 
        toast({ variant: "destructive", title: "File too large", description: "Limit is 800KB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setMenuFormData(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMenuItem = () => {
    if (!db || !menuFormData.name || !menuFormData.image) return;
    setSaveLoading(true);
    const itemId = editingItem ? editingItem.id : `ITEM-${Date.now()}`;
    const itemRef = doc(db, 'menu', itemId);
    const finalData = {
      id: itemId, name: menuFormData.name.trim(), description: (menuFormData.description || '').trim(),
      price: Number(menuFormData.price) || 0, category: menuFormData.category, image: menuFormData.image,
      isVeg: Boolean(menuFormData.isVeg), isAvailable: Boolean(menuFormData.isAvailable),
      rating: Number(menuFormData.rating) || 4.5, updatedAt: serverTimestamp()
    };

    setDoc(itemRef, finalData, { merge: true })
      .then(() => {
        toast({ title: editingItem ? "Updated" : "Published 🚀" });
        setIsMenuDialogOpen(false);
        resetForm();
      })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'write', requestResourceData: finalData })))
      .finally(() => setSaveLoading(false));
  };

  const resetForm = () => {
    setEditingItem(null);
    setMenuFormData({ name: '', description: '', price: 0, category: 'Veg Maggie', image: '', isVeg: true, isAvailable: true, rating: 4.5 });
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setMenuFormData({
      name: item.name || '', description: item.description || '', price: item.price || 0,
      category: item.category || 'Veg Maggie', image: item.image || '',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      rating: item.rating || 4.5
    });
    setIsMenuDialogOpen(true);
  };

  const toggleAvailability = (id: string, current: boolean) => {
    if (!db) return;
    const itemRef = doc(db, 'menu', id);
    updateDoc(itemRef, { isAvailable: !current, updatedAt: serverTimestamp() })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'update' })));
  };

  const handleDeleteItem = (id: string) => {
    if (!db || !confirm("Delete dish?")) return;
    const itemRef = doc(db, 'menu', id);
    deleteDoc(itemRef)
      .then(() => toast({ title: "Removed" }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: itemRef.path, operation: 'delete' })));
  };

  const handleGeneratePromo = async () => {
    if (!selectedPromoDish) return;
    setPromoLoading(true);
    try {
      const result = await dailySpecialGenerator({ dishName: selectedPromoDish.name, basePrice: selectedPromoDish.price, discountPercent: 15 });
      setPromoResult(result);
    } catch (error) {
      toast({ variant: "destructive", title: "AI Failed" });
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <section className="py-4 md:py-8 bg-muted/20 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col gap-4 mb-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl shadow-lg transform -rotate-2">
               <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight">Easy<span className="text-primary">Bites</span> Admin</h1>
          </div>
          <div className="flex flex-wrap gap-2">
             <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 text-[8px] uppercase font-black rounded-full">Kitchen Live</Badge>
             <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 text-[8px] uppercase font-black rounded-full">Orders: {realOrders.filter(o => o.status !== 'Delivered').length}</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card p-1 rounded-xl border w-full flex overflow-x-auto scrollbar-hide">
            <TabsTrigger value="overview" className="flex-1 text-[10px] font-bold py-2 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 text-[10px] font-bold py-2 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Orders</TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1 text-[10px] font-bold py-2 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Menu</TabsTrigger>
            <TabsTrigger value="marketing" className="flex-1 text-[10px] font-bold py-2 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Marketing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: "Revenue", value: `₹${stats.revenue}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
                 { label: "Orders", value: stats.count.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
                 { label: "Efficient", value: stats.count > 0 ? `${Math.round((stats.delivered / stats.count) * 100)}%` : "0%", icon: CheckCircle2, color: "text-orange-600", bg: "bg-orange-50" },
                 { label: "Rating", value: "4.8", icon: Sparkles, color: "text-yellow-600", bg: "bg-yellow-50" }
               ].map((s, i) => (
                 <Card key={i} className="rounded-2xl border-none shadow-md overflow-hidden bg-card">
                    <CardContent className="p-4 md:p-6">
                       <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3 ${s.color}`}>
                          <s.icon className="w-4 h-4 md:w-5 md:h-5" />
                       </div>
                       <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">{s.label}</p>
                       <h3 className="text-xl md:text-2xl font-black">{s.value}</h3>
                    </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="orders" className="animate-in fade-in duration-500">
            <Card className="rounded-2xl shadow-xl border-none overflow-hidden overflow-x-auto">
              {ordersLoading ? (
                <div className="p-20 flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-[10px] font-black opacity-50">Syncing...</p>
                </div>
              ) : realOrders.length === 0 ? (
                <div className="p-20 text-center text-muted-foreground text-sm font-medium">Waiting for orders...</div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                      <TableHead className="text-[10px] font-black uppercase py-4">Order</TableHead>
                      <TableHead className="text-[10px] font-black uppercase py-4">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase py-4 text-right">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {realOrders.map((order: any) => (
                      <TableRow key={order.id} className="hover:bg-muted/10 border-muted/30">
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{order.customerName}</span>
                            <span className="text-[9px] text-muted-foreground">₹{order.total} • {order.items?.length} items</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'Preparing' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleUpdateStatus(order.id, 'Preparing')}><Clock className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleUpdateStatus(order.id, 'Delivered')}><CheckCircle2 className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteOrder(order.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 mb-6">
              <Button className="rounded-xl h-12 font-black uppercase tracking-widest text-[11px] gap-2 shadow-xl shadow-primary/20" onClick={() => {resetForm(); setIsMenuDialogOpen(true);}}>
                <Plus className="w-4 h-4" /> Add Dish
              </Button>
            </div>

            <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
              <DialogContent className="max-w-lg p-0 rounded-2xl overflow-hidden border-none shadow-3xl">
                <div className="bg-primary p-6 text-white">
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingItem ? 'Edit Dish' : 'Add Dish'}</DialogTitle>
                </div>
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Dish Name</Label>
                    <Input value={menuFormData.name} onChange={(e) => setMenuFormData({...menuFormData, name: e.target.value})} className="rounded-xl h-12 border-muted" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Price (₹)</Label>
                      <Input type="number" value={menuFormData.price} onChange={(e) => setMenuFormData({...menuFormData, price: Number(e.target.value)})} className="rounded-xl h-12 border-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Veg?</Label>
                      <div className="h-12 flex items-center justify-between px-4 bg-muted/20 rounded-xl border">
                        <span className="text-[9px] font-bold uppercase">{menuFormData.isVeg ? 'Veg' : 'Non-Veg'}</span>
                        <Switch checked={menuFormData.isVeg} onCheckedChange={(v) => setMenuFormData({...menuFormData, isVeg: v})} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Category</Label>
                    <select 
                      className="w-full h-12 rounded-xl border px-4 text-xs font-bold uppercase tracking-widest"
                      value={menuFormData.category}
                      onChange={(e) => setMenuFormData({...menuFormData, category: e.target.value})}
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Photo</Label>
                    <div 
                      className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 text-center cursor-pointer hover:bg-muted/10 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {menuFormData.image ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden">
                          <img src={menuFormData.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6 text-muted-foreground opacity-50" />
                          <p className="text-[9px] font-bold uppercase text-muted-foreground">Select Photo</p>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-muted/20 flex gap-3 border-t">
                  <Button variant="ghost" onClick={() => setIsMenuDialogOpen(false)} className="flex-1 rounded-xl font-bold uppercase text-[10px]">Cancel</Button>
                  <Button onClick={handleSaveMenuItem} disabled={saveLoading || !menuFormData.name || !menuFormData.image} className="flex-1 rounded-xl font-bold uppercase text-[10px]">
                    {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingItem ? 'Update' : 'Publish'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dbMenu?.map((item: any) => (
                <Card key={item.id} className="rounded-2xl border-none shadow-md overflow-hidden bg-card">
                  <div className="flex p-4 gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 shadow-inner">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-bold text-xs truncate">{item.name}</h4>
                      <p className="text-[9px] text-muted-foreground font-bold mt-0.5 uppercase tracking-widest">₹{item.price} • {item.category}</p>
                    </div>
                    <div className="flex flex-col gap-2 justify-center">
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => handleEditClick(item)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6 animate-in fade-in duration-500">
             <Card className="rounded-2xl border-none shadow-xl bg-card p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tight">AI Campaign</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">Generate viral social posts for your signature dishes.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   {(dbMenu || []).slice(0, 4).map((item: any) => (
                     <button
                        key={item.id}
                        onClick={() => setSelectedPromoDish(item)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedPromoDish?.id === item.id ? 'border-primary bg-primary/5' : 'border-muted bg-muted/10'
                        }`}
                     >
                       <p className="text-[9px] font-black truncate">{item.name}</p>
                     </button>
                   ))}
                </div>
                <Button className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-widest gap-2 shadow-xl" onClick={handleGeneratePromo} disabled={promoLoading || !selectedPromoDish}>
                  {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                  Generate Post
                </Button>

                {promoResult && (
                  <div className="p-5 bg-primary/5 rounded-2xl border border-primary/20 space-y-3 animate-in zoom-in duration-300">
                    <h4 className="font-black text-sm">{promoResult.promoTitle} {promoResult.emoji}</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">"{promoResult.promoDescription}"</p>
                    <p className="text-xl font-black text-primary">₹{promoResult.finalPrice}</p>
                    <Button variant="outline" className="w-full h-10 rounded-lg text-[10px] font-bold" onClick={() => {
                      navigator.clipboard.writeText(`${promoResult.promoTitle} ${promoResult.emoji}\n${promoResult.promoDescription}\n🔥 Now at ₹${promoResult.finalPrice}!`);
                      toast({ title: "Copied!" });
                    }}>Copy Caption</Button>
                  </div>
                )}
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
