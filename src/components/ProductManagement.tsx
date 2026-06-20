"use client"
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Edit2, Trash2, 
  LayoutGrid, 
  Loader2, Package, Star, 
  Power
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { FoodItem } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { CATEGORIES } from '@/app/lib/menu-data';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  discountPrice: number;
  imageUrl: string;
  isVeg: boolean;
  isAvailable: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isCustomizable: boolean;
  spiceLevel: 'None' | 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
  prepTime: number;
}

const DEFAULT_FORM_DATA: ProductFormData = {
  name: '',
  description: '',
  category: 'Biryani',
  price: 0,
  discountPrice: 0,
  imageUrl: '',
  isVeg: true,
  isAvailable: true,
  isBestSeller: false,
  isFeatured: false,
  isCustomizable: false,
  spiceLevel: 'None',
  prepTime: 20
};

export const ProductManagement = () => {
  const db = useFirestore();
  const productsQuery = useMemo(() => db ? query(collection(db, 'products'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: products, loading } = useCollection<FoodItem>(productsQuery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);

  const stats = useMemo(() => {
    if (!products) return { total: 0, active: 0, featured: 0, categoryCounts: {} as Record<string, number> };
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return {
      total: products.length,
      active: products.filter(p => p.isAvailable).length,
      featured: products.filter(p => p.isFeatured).length,
      categoryCounts: counts
    };
  }, [products]);

  const displayProducts = products || [];

  const handleOpenModal = (item: FoodItem | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'Biryani',
        price: item.price || 0,
        discountPrice: item.discountPrice || 0,
        imageUrl: item.imageUrl || '',
        isVeg: item.isVeg ?? true,
        isAvailable: item.isAvailable ?? true,
        isBestSeller: item.isBestSeller ?? false,
        isFeatured: item.isFeatured ?? false,
        isCustomizable: item.isCustomizable ?? false,
        spiceLevel: item.spiceLevel || 'None',
        prepTime: item.prepTime || 20
      });
    } else {
      setEditingItem(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!db || !formData.name || !formData.imageUrl) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Identity and Media are mandatory." });
      return;
    }

    setSaveLoading(true);
    const id = editingItem ? editingItem.id : `PROD-${Date.now()}`;
    const productRef = doc(db, 'products', id);
    const finalData = {
      ...formData,
      id,
      price: Number(formData.price || 0),
      discountPrice: Number(formData.discountPrice || 0),
      prepTime: Number(formData.prepTime || 20),
      rating: editingItem?.rating || 4.5,
      createdAt: editingItem?.createdAt || serverTimestamp()
    };

    setDoc(productRef, finalData, { merge: true })
      .then(() => {
        toast({ title: editingItem ? "Registry Updated" : "Identity Created", description: `${formData.name} sync complete.` });
        setIsModalOpen(false);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: productRef.path,
          operation: editingItem ? 'update' : 'create',
          requestResourceData: finalData
        } satisfies SecurityRuleContext));
      })
      .finally(() => setSaveLoading(false));
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'products', id))
      .then(() => toast({ title: "Product Terminated" }))
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `products/${id}`,
          operation: 'delete'
        } satisfies SecurityRuleContext));
      });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic">Kitchen <span className="text-primary">Ledger</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Provision menu items and optimize visibility parameters.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="h-16 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 bg-primary text-white shadow-3xl hover:scale-[1.02] transition-all">
          <Plus className="w-5 h-5" /> Provision Dish
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatsCard label="Total Catalog" value={stats.total} icon={LayoutGrid} color="bg-blue-50 text-blue-600" />
        <StatsCard label="Live Listings" value={stats.active} icon={Package} color="bg-emerald-50 text-emerald-600" />
        <StatsCard label="Featured Board" value={stats.featured} icon={Star} color="bg-orange-50 text-orange-600" />
      </div>

      {loading ? (
        <div className="py-48 text-center space-y-6">
          <Loader2 className="animate-spin mx-auto w-12 h-12 text-primary opacity-20" />
          <p className="font-black uppercase tracking-[0.3em] text-[10px] text-muted-foreground animate-pulse">Syncing Cloud Catalog...</p>
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="py-48 text-center bg-white dark:bg-zinc-900 rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center gap-6">
          <Package className="w-20 h-20 opacity-10" />
          <h3 className="text-2xl font-black uppercase tracking-widest italic">Registry Void</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {displayProducts.map((item) => (
            <Card key={item.id} className="rounded-[2.5rem] border-none shadow-xl overflow-hidden group hover:shadow-2xl transition-all relative bg-white dark:bg-zinc-900">
              <div className="aspect-[4/3] relative overflow-hidden bg-secondary/30">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                   <Badge className={cn("border-none px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest shadow-xl", item.isAvailable ? "bg-emerald-500 text-white" : "bg-zinc-500 text-white")}>
                     {item.isAvailable ? 'LIVE' : 'IDLE'}
                   </Badge>
                </div>
              </div>
              <CardContent className="p-8 space-y-6">
                <div>
                  <h4 className="font-black text-base uppercase tracking-tight truncate leading-none group-hover:text-primary transition-colors mb-2">{item.name}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 italic">{item.category}</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-dashed">
                   <div>
                      <p className="text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Base Rate</p>
                      <span className="text-2xl font-black text-primary italic">₹{item.price}</span>
                   </div>
                   <div className="flex gap-2">
                      <Button onClick={() => handleOpenModal(item)} variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-secondary/30 border-none hover:bg-primary hover:text-white transition-all"><Edit2 className="w-4 h-4" /></Button>
                      <Button onClick={() => handleDelete(item.id)} variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-rose-50 border-none hover:bg-rose-600 hover:text-white transition-all text-rose-600"><Trash2 className="w-4 h-4" /></Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* PRODUCT DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950">
          <div className="p-10 bg-primary text-white shrink-0 relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
             <DialogHeader className="relative z-10">
                <DialogTitle className="text-4xl font-black font-headline uppercase tracking-tighter leading-none">{editingItem ? 'Edit Provision' : 'New Creation'}</DialogTitle>
                <p className="text-white/70 font-medium text-xs uppercase tracking-widest mt-2">Syncing with Operational Registry</p>
             </DialogHeader>
          </div>

          <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto scrollbar-hide">
             <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.4em] border-b pb-2">Manifest Identity</h5>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Entity Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold px-6" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Assigned Group</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold px-6 uppercase text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-2xl">{CATEGORIES.filter(c => c !== 'All').map(c => <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                </div>

                <div className="space-y-6">
                  <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.4em] border-b pb-2">Logistics Control</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Unit Rate (₹)</Label>
                      <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold px-6" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Prep Window (M)</Label>
                      <Input type="number" value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: Number(e.target.value)})} className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold px-6" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-secondary/30 dark:bg-zinc-800 rounded-3xl">
                     <div className="flex gap-4 items-center">
                        <Power className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Broadcast Live</span>
                     </div>
                     <Switch checked={formData.isAvailable} onCheckedChange={v => setFormData({...formData, isAvailable: v})} />
                  </div>
                </div>
             </div>

             <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase text-primary tracking-[0.4em] border-b pb-2">Digital Asset Node</h5>
                <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://media.ezzybites.com/image.jpg" className="h-14 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-bold px-6" />
             </div>
          </div>

          <DialogFooter className="p-10 bg-secondary/30 flex gap-4">
             <Button variant="outline" className="h-16 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2" onClick={() => setIsModalOpen(false)}>Abandon</Button>
             <Button className="h-16 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all" onClick={handleSave} disabled={saveLoading}>
               {saveLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Save'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatsCard = ({ label, value, icon: Icon, color }: any) => (
  <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-8 flex justify-between items-start group hover:scale-[1.02] transition-all duration-500">
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
      <h4 className="text-4xl font-black italic">{value}</h4>
    </div>
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:shadow-xl shadow-inner", color)}>
      <Icon className="w-7 h-7" />
    </div>
  </Card>
);