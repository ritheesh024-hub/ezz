
"use client"
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard, 
  Smartphone, 
  Truck, 
  ShoppingBag, 
  Loader2, 
  Zap,
  Clock,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';
import { toast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function CheckoutPage() {
  const { cart, getTotal, clearCart, removeFromCart } = useStore();
  const db = useFirestore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    instructions: '',
    paymentMethod: 'cod'
  });

  useEffect(() => {
    setOrderId(`EB-${Math.floor(Math.random() * 90000) + 10000}`);
  }, []);

  const subtotal = getTotal();
  const deliveryFee = subtotal >= 149 ? 0 : 40;
  const total = subtotal + deliveryFee;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!db) {
      toast({ 
        variant: "destructive", 
        title: "Connection Error", 
        description: "Firestore is not initialized." 
      });
      return;
    }

    if (!formData.name || !formData.phone || !formData.address) {
      toast({ 
        variant: "destructive", 
        title: "Missing details", 
        description: "Please fill in delivery info." 
      });
      setStep(2);
      return;
    }

    setLoading(true);

    if (formData.paymentMethod !== 'cod') {
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    const currentOrderId = orderId || `EB-${Date.now()}`;
    const orderData = {
      orderId: currentOrderId,
      customerName: formData.name,
      customerPhone: formData.phone,
      address: formData.address,
      instructions: formData.instructions || '',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal: Number(subtotal),
      deliveryFee: Number(deliveryFee),
      total: Number(total),
      status: 'Pending',
      paymentMethod: formData.paymentMethod,
      createdAt: serverTimestamp()
    };

    const orderRef = doc(collection(db, 'orders'), currentOrderId);
    
    setDoc(orderRef, orderData)
      .then(() => {
        setLoading(false);
        clearCart();
        setStep(4);
        toast({ title: "Order Success!", description: "Check status in tracking." });
      })
      .catch(async () => {
        setLoading(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: orderRef.path,
          operation: 'create',
          requestResourceData: orderData,
        }));
      });
  };

  const qrImage = placeholderData.placeholderImages.find(img => img.id === 'qr-code')?.imageUrl || '';

  if (cart.length === 0 && step < 4) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-primary/30" />
          </div>
          <h2 className="text-2xl font-black mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8 text-sm">Add some delicious bites to proceed.</p>
          <Link href="/menu">
            <Button className="rounded-full px-10 h-12 font-bold">Explore Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Step Indicator - More compact for mobile */}
        <div className="max-w-2xl mx-auto mb-10 md:mb-16">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
            <div className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-700" style={{ width: `${(step - 1) * 33.33}%` }} />
            
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all border-4 border-background ${step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <span className="font-black text-xs md:text-sm">{s}</span>}
                </div>
                <span className={`hidden md:block text-[10px] font-black mt-3 uppercase tracking-[0.2em] ${step >= s ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Review' : s === 2 ? 'Details' : s === 3 ? 'Pay' : 'Success'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-8 md:gap-10">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-headline font-black tracking-tight">Review Order</h2>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 py-1 px-3 rounded-full font-bold text-[10px]">
                    {cart.length} items
                  </Badge>
                </div>
                <div className="bg-card border-none shadow-xl rounded-[24px] md:rounded-[32px] overflow-hidden">
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 md:p-6 border-b last:border-0 flex gap-4 md:gap-6 items-center">
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden bg-secondary shadow-sm shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm md:text-lg truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <Badge variant="secondary" className="rounded-md text-[10px] px-1.5 py-0">Qty: {item.quantity}</Badge>
                           <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                            title="Remove item"
                           >
                            <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-base md:text-xl text-primary">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleNext} className="w-full h-14 md:h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
                  Proceed to Delivery
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-2xl md:text-3xl font-headline font-black tracking-tight">Delivery Details</h2>
                <Card className="rounded-[24px] md:rounded-[32px] border-none shadow-xl">
                  <CardContent className="p-6 md:p-8 space-y-5 md:space-y-6">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Full Name</Label>
                        <Input 
                          id="name" 
                          placeholder="Your Name" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="rounded-xl h-12 md:h-14 border-muted focus:ring-primary/20 bg-muted/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Phone Number</Label>
                        <Input 
                          id="phone" 
                          placeholder="8639366800" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="rounded-xl h-12 md:h-14 border-muted focus:ring-primary/20 bg-muted/10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-70">Delivery Address</Label>
                      <Textarea 
                        id="address" 
                        placeholder="Flat/House No, Area, Landmark" 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="rounded-xl min-h-[100px] border-muted bg-muted/10 p-4"
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBack} className="h-14 md:h-16 rounded-xl md:rounded-[20px] px-6 font-bold border-2">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-14 md:h-16 rounded-xl md:rounded-[20px] text-lg font-bold shadow-xl">
                    Payment Options
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-2xl md:text-3xl font-headline font-black tracking-tight">Payment Method</h2>
                <RadioGroup 
                  defaultValue={formData.paymentMethod} 
                  onValueChange={(v) => setFormData({...formData, paymentMethod: v})}
                  className="space-y-4"
                >
                  <Label 
                    htmlFor="cod" 
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-transparent bg-card shadow-sm'}`}
                  >
                    <RadioGroupItem value="cod" id="cod" className="sr-only" />
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                      <Truck className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-base">Cash on Delivery</p>
                      <p className="text-[11px] text-muted-foreground font-medium">Pay when food arrives</p>
                    </div>
                  </Label>

                  <Label 
                    htmlFor="upi" 
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-transparent bg-card shadow-sm'}`}
                  >
                    <RadioGroupItem value="upi" id="upi" className="sr-only" />
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-base">UPI / QR Code</p>
                      <p className="text-[11px] text-muted-foreground font-medium">Fast & Secure Mobile Pay</p>
                    </div>
                  </Label>
                </RadioGroup>

                {formData.paymentMethod === 'upi' && (
                  <div className="bg-card border-none shadow-xl rounded-[32px] p-6 text-center space-y-4 animate-in zoom-in duration-500">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Scan to Pay</p>
                    <div className="w-48 h-48 mx-auto relative bg-white rounded-2xl overflow-hidden border-4 border-muted/20">
                      <Image src={qrImage} alt="UPI QR" fill className="p-3" />
                    </div>
                    <p className="text-sm font-black text-primary">8639366800@ybl</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBack} className="h-14 md:h-16 rounded-xl px-6 font-bold border-2">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-14 md:h-16 rounded-xl text-lg font-bold shadow-2xl shadow-primary/20">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Confirm Order'}
                    {!loading && <CheckCircle2 className="ml-2 w-5 h-5" />}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-card border-none shadow-2xl rounded-[32px] md:rounded-[48px] p-8 md:p-12 text-center space-y-6 md:space-y-8 animate-in zoom-in duration-500">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 md:w-14 md:h-14" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-5xl font-headline font-black mb-3">Order <span className="text-primary">Placed!</span></h2>
                  <p className="text-sm md:text-lg text-muted-foreground font-medium">Your meal is being prepared with love.</p>
                </div>
                <div className="bg-secondary/50 p-4 md:p-6 rounded-2xl inline-flex flex-col items-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-1">Tracking ID</p>
                  <p className="font-mono text-xl md:text-2xl font-black text-primary">{orderId}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href={`/orders/${orderId}`}>
                    <Button className="rounded-full w-full sm:w-auto px-10 h-12 md:h-14 font-black uppercase tracking-widest text-[11px]">Track Order</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="rounded-full w-full sm:w-auto px-10 h-12 md:h-14 font-black uppercase tracking-widest text-[11px] border-2">Go Home</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {step < 4 && (
            <div className="space-y-6">
              <Card className="rounded-[24px] md:rounded-[32px] border-none shadow-xl sticky top-24 overflow-hidden">
                <CardHeader className="p-6 md:p-8 border-b bg-muted/10">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-4 md:space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-bold">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className={deliveryFee === 0 ? "text-green-600 font-black" : "font-bold"}>
                        {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-dashed pt-4 md:pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-black uppercase tracking-widest">Total</span>
                      <span className="text-3xl font-headline font-black text-primary">₹{total}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-6 md:px-8 py-4 bg-primary/5 border-t border-primary/10">
                  <div className="flex gap-3 items-center">
                    <Clock className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-bold leading-tight">Arriving in <span className="text-primary font-black">20-30 mins</span></p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
