
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
    if (!db) return;

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

    const currentOrderId = orderId || `EB-${Date.now()}`;
    const orderData = {
      orderId: currentOrderId,
      customerName: formData.name,
      customerPhone: formData.phone,
      address: formData.address,
      instructions: formData.instructions || '',
      // CRITICAL: Exclude image data from order items to prevent document size limit errors
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
        toast({ title: "Order Placed Successfully! 🚀" });
      })
      .catch(async (error) => {
        setLoading(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: orderRef.path,
          operation: 'create',
          requestResourceData: orderData,
        }));
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: "Could not save order. Please check your connection."
        });
      });
  };

  const qrImage = placeholderData.placeholderImages.find(img => img.id === 'qr-code')?.imageUrl || '';

  if (cart.length === 0 && step < 4) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mb-6" />
          <h2 className="text-2xl font-black mb-2">Your cart is empty</h2>
          <Link href="/menu">
            <Button className="rounded-full px-10 h-12 font-bold mt-4">Browse Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto mb-16 px-2">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
            <div className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-700" style={{ width: `${(step - 1) * 33.33}%` }} />
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-background transition-all ${step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-black text-sm">{s}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-3xl font-headline font-black">Review Order</h2>
                <Card className="rounded-[32px] border-none shadow-xl overflow-hidden">
                  {cart.map((item) => (
                    <div key={item.id} className="p-6 border-b last:border-0 flex gap-6 items-center">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-secondary shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg truncate">{item.name}</h4>
                        <Badge variant="secondary" className="mt-1">Qty: {item.quantity}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-primary">₹{item.price * item.quantity}</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive mt-2"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </Card>
                <Button onClick={handleNext} className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl">Proceed to Details</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-3xl font-headline font-black">Delivery Details</h2>
                <Card className="rounded-[32px] border-none shadow-xl">
                  <CardContent className="p-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-14 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-14 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="rounded-xl min-h-[120px]" />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBack} className="h-16 rounded-xl px-8 font-bold border-2"><ChevronLeft /></Button>
                  <Button onClick={handleNext} className="flex-1 h-16 rounded-xl text-lg font-bold">Select Payment</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-3xl font-headline font-black">Payment</h2>
                <RadioGroup defaultValue={formData.paymentMethod} onValueChange={(v) => setFormData({...formData, paymentMethod: v})} className="space-y-4">
                  <Label htmlFor="cod" className={`flex items-center gap-4 p-6 rounded-2xl border-2 cursor-pointer ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                    <RadioGroupItem value="cod" id="cod" className="sr-only" />
                    <Truck className="w-8 h-8 text-primary" />
                    <div className="flex-1"><p className="font-bold">Cash on Delivery</p></div>
                  </Label>
                  <Label htmlFor="upi" className={`flex items-center gap-4 p-6 rounded-2xl border-2 cursor-pointer ${formData.paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                    <RadioGroupItem value="upi" id="upi" className="sr-only" />
                    <Smartphone className="w-8 h-8 text-primary" />
                    <div className="flex-1"><p className="font-bold">UPI / QR Scan</p></div>
                  </Label>
                </RadioGroup>

                {formData.paymentMethod === 'upi' && (
                  <Card className="p-8 text-center animate-in zoom-in">
                    <div className="w-48 h-48 mx-auto relative bg-white border rounded-2xl overflow-hidden mb-4">
                      <Image src={qrImage} alt="QR" fill className="p-4" />
                    </div>
                    <p className="font-black text-primary">8639366800@ybl</p>
                  </Card>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBack} className="h-16 rounded-xl px-8 font-bold border-2"><ChevronLeft /></Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-16 rounded-xl text-lg font-bold shadow-2xl shadow-primary/20">
                    {loading ? <Loader2 className="animate-spin" /> : 'Confirm Order'}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <Card className="p-12 text-center space-y-8 rounded-[48px] shadow-2xl animate-in zoom-in">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-5xl font-black mb-2">Order <span className="text-primary">Placed!</span></h2>
                  <p className="text-muted-foreground font-medium">Your meal is being prepared with love.</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-2xl inline-block">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Tracking ID</p>
                  <p className="font-mono text-2xl font-black text-primary">{orderId}</p>
                </div>
                <div className="flex justify-center gap-4">
                  <Link href={`/orders/${orderId}`}><Button className="rounded-full px-10 h-14 font-black">Track Order</Button></Link>
                  <Link href="/"><Button variant="outline" className="rounded-full px-10 h-14 font-black border-2">Go Home</Button></Link>
                </div>
              </Card>
            )}
          </div>

          {step < 4 && (
            <Card className="rounded-[32px] border-none shadow-xl h-fit sticky top-24">
              <CardHeader className="p-8 border-b bg-muted/10"><CardTitle className="text-xs font-black uppercase tracking-widest">Summary</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span className="font-bold text-foreground">₹{subtotal}</span></div>
                <div className="flex justify-between text-sm text-muted-foreground"><span>Delivery</span><span className="font-bold text-green-600">{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span></div>
                <div className="border-t border-dashed pt-6 flex justify-between items-center">
                  <span className="text-lg font-black uppercase">Total</span>
                  <span className="text-3xl font-headline font-black text-primary">₹{total}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
