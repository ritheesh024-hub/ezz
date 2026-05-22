
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calculator, Receipt, History, BarChart3, 
  Search, Plus, Minus, Trash2, Printer, 
  ShoppingBag, CheckCircle2, X
} from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BillingSystemProps {
  products: any[];
  orders: any[];
}

export const BillingSystem = ({ products, orders }: BillingSystemProps) => {
  const db = useFirestore();
  const [activeBill, setActiveBill] = useState<any[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', type: 'Dine-in' });
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const addToBill = (product: any) => {
    setActiveBill(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromBill = (id: string) => {
    setActiveBill(prev => prev.filter(p => p.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setActiveBill(prev => {
      const items = prev.map(p => {
        if (p.id === id) {
          const newQty = Math.max(0, p.quantity + delta);
          return { ...p, quantity: newQty };
        }
        return p;
      }).filter(p => p.quantity > 0);
      return items;
    });
  };

  const subtotal = activeBill.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const total = subtotal - discount;

  const generateBill = async () => {
    if (activeBill.length === 0) {
      toast({ variant: "destructive", title: "Cart is Empty", description: "Select items to generate a bill." });
      return;
    }
    if (!customerInfo.phone) {
      toast({ variant: "destructive", title: "Customer Info Missing", description: "Mobile number is required." });
      return;
    }

    const billId = `INV-${Date.now().toString().slice(-6)}`;
    const billData = {
      orderId: billId,
      customerName: customerInfo.name || 'Guest',
      customerPhone: customerInfo.phone,
      orderType: customerInfo.type,
      items: activeBill,
      subtotal,
      discount,
      total,
      paymentMethod,
      status: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: new Date(), // Local date for instant display
      isStoreBill: true
    };

    if (db) {
      const billRef = doc(db, 'orders', billId);
      try {
        await setDoc(billRef, {
          ...billData,
          createdAt: serverTimestamp() // Server date for Firestore
        });
        toast({ title: "Invoice Generated! 🧾" });
        setViewingInvoice(billData);
        setActiveBill([]);
        setCustomerInfo({ name: '', phone: '', type: 'Dine-in' });
        setDiscount(0);
      } catch (e) {
        toast({ variant: "destructive", title: "Failed to save bill" });
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <Tabs defaultValue="pos" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl border mb-6 md:mb-8 flex w-fit shadow-sm">
          <TabsTrigger value="pos" className="px-6 md:px-8 py-2 md:py-3 rounded-xl gap-2 font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
            <Calculator className="w-3.5 h-3.5 md:w-4 md:h-4" /> POS Terminal
          </TabsTrigger>
          <TabsTrigger value="history" className="px-6 md:px-8 py-2 md:py-3 rounded-xl gap-2 font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
            <History className="w-3.5 h-3.5 md:w-4 md:h-4" /> History
          </TabsTrigger>
          <TabsTrigger value="summary" className="px-6 md:px-8 py-2 md:py-3 rounded-xl gap-2 font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Menu Selection */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="p-6 md:p-8 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search menu..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 pl-12 rounded-xl border-muted bg-secondary/30 font-bold"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-hide">
                    {['Dine-in', 'Takeaway'].map(t => (
                      <Button 
                        key={t}
                        variant={customerInfo.type === t ? 'default' : 'outline'}
                        onClick={() => setCustomerInfo({...customerInfo, type: t})}
                        className="rounded-full h-10 px-6 text-[9px] font-black uppercase flex-shrink-0"
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredProducts.map(p => {
                      const cartItem = activeBill.find(i => i.id === p.id);
                      return (
                        <div key={p.id} className="group relative bg-secondary/20 rounded-[2rem] p-3 md:p-4 transition-all hover:bg-primary/5 hover:shadow-lg border-2 border-transparent hover:border-primary/10">
                          <div className="aspect-square rounded-2xl overflow-hidden mb-3 relative bg-white">
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform" unoptimized />
                          </div>
                          <h4 className="font-black text-xs md:text-sm line-clamp-1">{p.name}</h4>
                          <p className="text-primary font-black text-sm md:text-base mt-1">₹{p.price}</p>
                          
                          {cartItem ? (
                            <div className="flex items-center justify-between w-full bg-primary text-white rounded-xl h-9 md:h-10 px-2 mt-3 animate-in zoom-in duration-300">
                              <button onClick={() => updateQuantity(p.id, -1)} className="hover:bg-white/20 rounded p-1 transition-colors"><Minus className="w-3 h-3 md:w-4 md:h-4" /></button>
                              <span className="font-black text-xs md:text-sm">{cartItem.quantity}</span>
                              <button onClick={() => updateQuantity(p.id, 1)} className="hover:bg-white/20 rounded p-1 transition-colors"><Plus className="w-3 h-3 md:w-4 md:h-4" /></button>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => addToBill(p)} 
                              variant="outline" 
                              className="w-full h-9 md:h-10 mt-3 rounded-xl border-primary/30 text-primary font-black uppercase text-[9px] hover:bg-primary hover:text-white transition-all"
                            >
                              Add Item
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bill Preview */}
            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white sticky top-24">
                <CardHeader className="p-6 md:p-8 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-black font-headline">Active Bill</CardTitle>
                  {activeBill.length > 0 && (
                    <Button variant="ghost" size="icon" onClick={() => setActiveBill([])} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6 md:space-y-8">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">Customer Name</Label>
                        <Input 
                          value={customerInfo.name} 
                          onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} 
                          placeholder="Guest" 
                          className="h-11 rounded-xl bg-secondary/30 border-none font-bold" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-40">Phone Number</Label>
                        <Input 
                          value={customerInfo.phone} 
                          onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                          placeholder="10-digit number" 
                          className="h-11 rounded-xl bg-secondary/30 border-none font-black" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                    {activeBill.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-4 group bg-secondary/10 p-3 rounded-2xl animate-in slide-in-from-right duration-300">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm truncate">{item.name}</h5>
                          <p className="text-[10px] font-black text-primary/60">₹{item.price} per unit</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors"><Minus className="w-3 h-3" /></button>
                          <span className="w-5 text-center text-xs font-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => removeFromBill(item.id)} className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-xl">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {activeBill.length === 0 && (
                      <div className="text-center py-16 opacity-30 flex flex-col items-center">
                        <ShoppingBag className="w-12 h-12 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No items selected</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-6 border-t border-dashed">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="text-foreground">₹{subtotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span>Applied Discount (₹)</span>
                      <Input 
                        type="number" 
                        value={discount} 
                        onChange={e => setDiscount(Number(e.target.value))} 
                        className="h-8 w-20 text-right bg-transparent border-none focus:ring-0 font-black text-foreground"
                      />
                    </div>
                    <div className="pt-4 border-t flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Payable Net</span>
                      <span className="text-3xl font-black font-headline text-primary italic">₹{total}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <Label className="text-[9px] font-black uppercase opacity-40 tracking-widest">Payment Source</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Cash', 'UPI', 'Card'].map(m => (
                        <button 
                          key={m}
                          onClick={() => setPaymentMethod(m)}
                          className={cn(
                            "h-10 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all",
                            paymentMethod === m ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-muted text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <Button 
                      onClick={generateBill} 
                      className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 bg-primary text-white active:scale-95 transition-all"
                    >
                      Generate Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
              <h3 className="text-2xl font-black font-headline">Invoice Archive</h3>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by ID or Mobile..." className="h-12 pl-12 rounded-xl" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b bg-muted/5">
                  <tr className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Invoice ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.filter(o => o.isStoreBill).map(inv => (
                    <tr key={inv.orderId} className="group hover:bg-secondary/10 transition-colors">
                      <td className="px-6 py-5 font-black text-primary">#{inv.orderId}</td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-sm">{inv.customerName}</p>
                        <p className="text-[10px] text-muted-foreground">{inv.customerPhone}</p>
                      </td>
                      <td className="px-6 py-5 font-black">₹{inv.total}</td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className="rounded-lg text-[8px] uppercase font-black bg-secondary/50 border-none">{inv.paymentMethod}</Badge>
                      </td>
                      <td className="px-6 py-5">
                        <Badge className="bg-green-100 text-green-700 border-none text-[8px] uppercase font-black px-2 py-0.5">Paid</Badge>
                      </td>
                      <td className="px-6 py-5">
                        <Button variant="ghost" size="sm" onClick={() => setViewingInvoice(inv)} className="rounded-xl font-black text-[9px] uppercase gap-2 hover:bg-primary/10 hover:text-primary">
                          <Printer className="w-3.5 h-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {orders.filter(o => o.isStoreBill).length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-muted-foreground font-bold italic opacity-40">No records found in the current archive.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] p-8 border-none shadow-xl bg-white border-l-4 border-primary">
              <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-2">Counter Sales</p>
              <h3 className="text-4xl font-black text-primary">₹{orders.filter(o => o.isStoreBill).reduce((a, c) => a + c.total, 0)}</h3>
              <div className="mt-6 flex items-center gap-2 text-green-600 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" /> Real-time settled
              </div>
            </Card>
            <Card className="rounded-[2rem] p-8 border-none shadow-xl bg-white">
              <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-2">Total Invoices</p>
              <h3 className="text-4xl font-black">{orders.filter(o => o.isStoreBill).length}</h3>
              <div className="mt-6 text-muted-foreground font-bold text-[10px] uppercase">
                Average Value: ₹{orders.filter(o => o.isStoreBill).length > 0 ? (orders.filter(o => o.isStoreBill).reduce((a, c) => a + c.total, 0) / orders.filter(o => o.isStoreBill).length).toFixed(0) : 0}
              </div>
            </Card>
            <Card className="rounded-[2rem] p-8 border-none shadow-xl bg-white">
              <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-2">Preferred Payment</p>
              <h3 className="text-4xl font-black">Mixed</h3>
              <div className="mt-6 text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                Data updated every minute
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invoice Modal */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-md p-0 rounded-[2.5rem] overflow-hidden border-none shadow-3xl bg-white mx-4 animate-in zoom-in-95 duration-300">
          <div id="printable-invoice" className="p-8 md:p-10 space-y-6 bg-white text-black font-body">
            <div className="text-center space-y-2 pb-6 border-b-2 border-dashed border-muted">
              <div className="w-14 h-14 bg-primary rounded-2xl mx-auto flex items-center justify-center text-white mb-2 shadow-xl shadow-primary/20 rotate-6">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black font-headline tracking-tight">EZZY BITES CAFE</h2>
              <p className="text-[10px] font-bold opacity-60">Premium Fast Food Experience</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-primary">Invoice Generated</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[10px] font-bold py-2">
              <div className="space-y-1">
                <p className="opacity-40 uppercase tracking-widest text-[8px]">Guest Information</p>
                <p className="text-xs">{viewingInvoice?.customerName}</p>
                <p className="opacity-70">+91 {viewingInvoice?.customerPhone}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="opacity-40 uppercase tracking-widest text-[8px]">Transaction Details</p>
                <p className="text-xs font-black">ID: #{viewingInvoice?.orderId}</p>
                <p className="opacity-70">{viewingInvoice?.createdAt ? new Date(viewingInvoice.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just Now'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-4 text-[9px] font-black uppercase border-b pb-2 tracking-widest opacity-40">
                <span className="col-span-2">Item Narrative</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
              </div>
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto scrollbar-hide">
                {viewingInvoice?.items.map((item: any, i: number) => (
                  <div key={i} className="grid grid-cols-4 text-[11px] font-bold">
                    <span className="col-span-2 truncate pr-2">{item.name}</span>
                    <span className="text-center opacity-60">x{item.quantity}</span>
                    <span className="text-right">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-6 border-t-2 border-dashed border-muted text-[11px] font-bold">
              <div className="flex justify-between">
                <span className="opacity-40 uppercase text-[9px]">Subtotal Sum</span>
                <span>₹{viewingInvoice?.subtotal}</span>
              </div>
              {viewingInvoice?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="opacity-40 uppercase text-[9px]">Discount Rebate</span>
                  <span>-₹{viewingInvoice.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black border-t-2 border-black pt-4 mt-2">
                <span>NET TOTAL</span>
                <span className="text-primary italic">₹{viewingInvoice?.total}</span>
              </div>
            </div>

            <div className="text-center pt-6 space-y-4">
              <div className="inline-block p-3 bg-secondary/30 rounded-2xl mb-2 border-2 border-white shadow-inner">
                 <p className="text-[8px] font-black uppercase mb-2 tracking-widest">Pay via UPI</p>
                 <Image 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=8639366800@ybl&pn=Ezzy%20Bites&am=${viewingInvoice?.total}&cu=INR`)}`} 
                   alt="Payment QR" 
                   width={100} 
                   height={100} 
                   className="mx-auto mix-blend-multiply" 
                   unoptimized
                 />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] italic opacity-30">Freshly Made • Redefined</p>
            </div>
          </div>
          
          <div className="p-6 md:p-8 bg-secondary/20 flex flex-col sm:flex-row gap-3 md:gap-4 no-print border-t">
            <Button variant="outline" className="flex-1 h-12 md:h-14 rounded-2xl font-black text-[10px] uppercase gap-2 border-primary/20 hover:bg-primary/5 transition-all" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print Invoice
            </Button>
            <Button className="flex-1 h-12 md:h-14 rounded-2xl font-black text-[10px] uppercase gap-2 bg-primary shadow-lg shadow-primary/20" onClick={() => setViewingInvoice(null)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 20px;
            background: white;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
