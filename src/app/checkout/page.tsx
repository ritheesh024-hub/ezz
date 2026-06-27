"use client"
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useStore, OrderType } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Smartphone, 
  Truck, 
  ShoppingBag, 
  Loader2, 
  Trash2,
  TicketPercent,
  X,
  PartyPopper,
  Utensils,
  Package,
  Ban,
  Home,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { AuthModal } from '@/components/AuthModal';
import { useAnalytics } from '@/hooks/use-analytics';
import { useSmartPermissions } from '@/hooks/use-smart-permissions';
import { useGlobalSettings } from '@/hooks/use-global-settings';
import { useOffline } from '@/hooks/use-offline';

export default function CheckoutPage() {
  const { cart, getTotal, clearCart, removeFromCart, selectedOrderType, setOrderType } = useStore();
  const db = useFirestore();
  const { user } = useUser();
  const { settings, loading: settingsLoading } = useGlobalSettings();
  const { trackOrderPlaced } = useAnalytics();
  const { requestSmartly } = useSmartPermissions();
  const isOffline = useOffline();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    instructions: '',
    paymentMethod: 'cod'
  });

  useEffect(() => {
    setMounted(true);
    setOrderId(`EB-${Math.floor(10000 + Math.random() * 90000)}`);
  }, []);

  const subtotal = getTotal();
  const isDelivery = selectedOrderType === 'Delivery' || (!selectedOrderType);
  
  const deliveryFee = (isDelivery && subtotal < (settings?.freeDeliveryThreshold || 149)) ? (settings?.deliveryCharge || 40) : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const handleApplyCoupon = async () => {
    if (isOffline) {
      toast({ variant: "destructive", title: "Offline Node", description: "Bounty verification requires a data signal." });
      return;
    }
    if (!db) return;
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    try {
      const couponRef = doc(db, 'coupons', code);
      const couponSnap = await getDoc(couponRef);

      if (couponSnap.exists()) {
        const data = couponSnap.data();
        if (!data.isActive) throw new Error("This coupon is currently disabled.");
        if (data.expiryDate && new Date() > new Date(data.expiryDate)) throw new Error("This coupon has expired.");
        if (data.minOrderValue && subtotal < data.minOrderValue) throw new Error(`Minimum order of ₹${data.minOrderValue} required.`);

        const discountVal = data.type === 'percent' 
          ? Math.round(subtotal * (data.discount / 100))
          : data.discount;

        setDiscount(discountVal);
        setAppliedCoupon({ code, ...data });
        setCouponInput('');
        toast({ title: "Coupon Applied! 🎉", description: `${data.discount} ${data.type === 'percent' ? '%' : '₹'} discount activated.` });
      } else {
         throw new Error("Invalid promo code.");
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Coupon Error", description: e.message });
    } finally {
      setCouponLoading(false);
    }
  };

  const removePromo = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    toast({ title: "Offer Removed" });
  };

  const handleNext = () => {
    if (step === 2) {
      if (!formData.name || !formData.phone) {
        toast({ variant: "destructive", title: "Details Required", description: "Please fill in your name and phone." });
        return;
      }
      if (formData.phone.length < 10) {
        toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid 10-digit number." });
        return;
      }
      if (isDelivery && !formData.address) {
        toast({ variant: "destructive", title: "Address Required", description: "Delivery requires a sanctuary address." });
        return;
      }
      if (!user) {
        setIsAuthModalOpen(true);
        return;
      }
      if (isDelivery) requestSmartly('location');
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (isOffline) {
      toast({ variant: "destructive", title: "Signal Lost", description: "Internet connection required to place an order." });
      return;
    }
    if (!db || !user || !settings) return;

    if (!settings.isOpen) {
      toast({ variant: "destructive", title: "Station Offline", description: "We are currently not accepting new orders. Please check timings." });
      return;
    }

    if (isDelivery && !settings.deliveryActive) {
      toast({ variant: "destructive", title: "Fleet Grounded", description: "Delivery is currently disabled. Please select Takeaway." });
      return;
    }

    setLoading(true);
    const finalOrderId = orderId || `EB-${Date.now()}`;
    const orderData = {
      orderId: finalOrderId,
      userId: user.uid,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerEmail: user.email || '',
      address: isDelivery ? formData.address : (selectedOrderType === 'Dine-In' ? 'Dine-In Table Service' : 'Takeaway Counter'),
      instructions: formData.instructions || '',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        customization: item.customization || null
      })),
      subtotal: Number(subtotal),
      discount: Number(discount),
      couponCode: appliedCoupon?.code || null,
      deliveryFee: Number(deliveryFee),
      total: Number(total),
      totalAmount: Number(total),
      status: 'pending',
      paymentMethod: formData.paymentMethod,
      orderType: selectedOrderType || 'Delivery',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const orderRef = doc(db, 'orders', finalOrderId);
    setDoc(orderRef, orderData)
      .then(async () => {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          phone: formData.phone,
          name: formData.name,
          address: isDelivery ? (formData.address || '') : '',
          lastOrderAt: serverTimestamp(),
          orderCount: increment(1)
        }, { merge: true });

        if (appliedCoupon) {
           await updateDoc(doc(db, 'coupons', appliedCoupon.code), {
              usageCount: increment(1)
           });
        }

        trackOrderPlaced(orderData);
        clearCart();
        setStep(4);
        toast({ title: "Order Placed Successfully! 🚀" });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: orderRef.path,
          operation: 'create',
          requestResourceData: orderData,
        } satisfies SecurityRuleContext));
      })
      .finally(() => setLoading(false));
  };

  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`upi://pay?pa=${settings?.contactNumber}@ybl&pn=${encodeURIComponent(settings?.storeName || 'Ezzy Bites')}&cu=INR`)}`;

  if (!mounted || settingsLoading) return null;

  if (cart.length === 0 && step < 4) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-20">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-black mb-1 uppercase tracking-tighter">Your Tray is <span className="text-primary italic">Empty</span></h2>
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest max-w-xs mb-8">Add some premium bites to your cart before proceeding.</p>
          <Link href="/menu">
            <Button className="rounded-full px-10 h-12 font-black uppercase tracking-widest text-[9px] bg-primary">Browse Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!settings?.isOpen && step < 4) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-20">
          <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-600 mb-6 shadow-inner">
            <Ban className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter italic">Station <span className="text-rose-600">Offline</span></h2>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] max-w-xs mb-8">We are currently not accepting new orders. Please check back during operational hours.</p>
          <Link href="/">
            <Button variant="outline" className="rounded-full px-10 h-14 font-black uppercase text-[10px] tracking-widest border-2">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 pb-10 overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-16 md:pt-20">
        {isOffline && step < 4 && (
          <Card className="mb-6 bg-zinc-950 border-none rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none mb-1">Signal Interrupted</p>
              <p className="text-[9px] font-medium text-white/60 uppercase tracking-tight">Internet required for checkout and payment verification.</p>
            </div>
          </Card>
        )}

        <div className="max-w-md mx-auto mb-10">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-700" 
              style={{ width: `${(step - 1) * 33.33}%` }} 
            />
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-4 border-background transition-all",
                  step >= s ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'
                )}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : <span className="font-black text-[10px]">{s}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-500">
                <div className="flex justify-between items-end">
                   <h2 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tighter">Review <span className="text-primary italic">Order</span></h2>
                   {selectedOrderType && (
                     <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full font-black uppercase text-[8px] tracking-widest gap-2">
                       {selectedOrderType === 'Dine-In' ? <Utensils className="w-3 h-3" /> : selectedOrderType === 'Take Away' ? <Package className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                       {selectedOrderType} Node
                     </Badge>
                   )}
                </div>
                <Card className="rounded-[1.5rem] border-none shadow-xl overflow-hidden bg-white dark:bg-zinc-900">
                  <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                    {cart.map((item) => (
                      <div key={item.cartId} className="p-4 md:p-6 flex gap-4 md:gap-6 items-center">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-secondary shrink-0">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-sm md:text-lg truncate uppercase tracking-tight">{item.name}</h4>
                          <div className="flex gap-1.5 mt-1">
                            <Badge variant="secondary" className="text-[7px] md:text-[9px] font-black uppercase px-2 h-4 flex items-center">Qty: {item.quantity}</Badge>
                            {item.customization && <Badge variant="outline" className="text-[7px] md:text-[9px] font-black uppercase border-primary/20 text-primary px-2 h-4 flex items-center">{item.customization.size}</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg md:text-xl text-primary italic leading-none">₹{item.price * item.quantity}</p>
                          <button onClick={() => removeFromCart(item.cartId)} className="text-muted-foreground hover:text-destructive mt-2 transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5 ml-auto" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Button onClick={handleNext} className="w-full h-14 md:h-16 rounded-2xl text-base md:text-lg font-black uppercase tracking-widest bg-primary shadow-xl shadow-primary/20">Confirm & Continue</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-500">
                <h2 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tighter">Identity <span className="text-primary italic">Node</span></h2>
                
                {/* ORDER TYPE SELECTOR */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Dine-In' as OrderType, label: 'Dine In', icon: Utensils },
                    { id: 'Take Away' as OrderType, label: 'Takeaway', icon: Package },
                    { id: 'Delivery' as OrderType, label: 'Delivery', icon: Home }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setOrderType(type.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                        selectedOrderType === type.id 
                          ? "border-primary bg-primary/5 text-primary shadow-lg" 
                          : "border-muted bg-white dark:bg-zinc-900 text-muted-foreground opacity-60 hover:border-primary/20"
                      )}
                    >
                      <type.icon className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{type.label}</span>
                    </button>
                  ))}
                </div>

                <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-xl bg-white dark:bg-zinc-900">
                  <CardContent className="p-6 md:p-10 space-y-6">
                    <div className="grid md:grid-cols-2 gap-5 md:gap-8">
                      <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Full Identity</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 md:h-14 rounded-xl font-bold bg-secondary/30 border-none px-5" suppressHydrationWarning />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Mobile Node</Label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-3 border-muted/50">
                            <span className="text-[10px] font-black">+91</span>
                          </div>
                          <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="h-12 md:h-14 pl-16 md:pl-20 rounded-xl font-black bg-secondary/30 border-none" placeholder="00000 00000" suppressHydrationWarning />
                        </div>
                      </div>
                    </div>
                    {isDelivery && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Sanctuary Address</Label>
                        <div className="relative">
                          <Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="rounded-xl min-h-[100px] md:min-h-[120px] font-medium bg-secondary/30 border-none px-5 py-4 text-sm" placeholder="Building, Street, Area..." suppressHydrationWarning />
                          {isOffline && (
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-rose-600 text-white px-2 py-0.5 rounded-md">
                               <WifiOff className="w-2.5 h-2.5" />
                               <span className="text-[6px] font-black uppercase">Offline</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Special Instructions</Label>
                      <Input value={formData.instructions} onChange={(e) => setFormData({...formData, instructions: e.target.value})} className="h-12 md:h-14 rounded-xl bg-secondary/30 border-none px-5 text-sm" placeholder="No spicy, extra ketchup, etc." suppressHydrationWarning />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="h-14 md:h-16 rounded-2xl px-6 md:px-8 font-black border-2"><ChevronLeft className="w-5 h-5" /></Button>
                  <Button onClick={handleNext} className="flex-1 h-14 md:h-16 rounded-2xl text-sm md:text-base font-black uppercase tracking-widest bg-primary shadow-xl shadow-primary/20">
                    {user ? 'Select Payment' : 'Login to Continue'}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-500">
                <h2 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tighter">Payment <span className="text-primary italic">Methods</span></h2>
                
                {isOffline && (
                  <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-4">
                     <AlertCircle className="w-6 h-6 text-rose-600" />
                     <p className="text-[11px] font-bold text-rose-800 dark:text-rose-400 uppercase leading-relaxed">Payment verification nodes are dormant. Please establish a data signal to proceed with the transaction.</p>
                  </div>
                )}

                <RadioGroup value={formData.paymentMethod} onValueChange={(v) => setFormData({...formData, paymentMethod: v})} className="space-y-3" disabled={isOffline}>
                  {settings?.codEnabled && (
                    <Label htmlFor="cod" className={cn("flex items-center gap-4 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-4 cursor-pointer transition-all", formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'bg-white dark:bg-zinc-900 border-transparent shadow-sm', isOffline && "opacity-50 grayscale")}>
                      <RadioGroupItem value="cod" id="cod" className="sr-only" />
                      <Truck className={cn("w-6 h-6 md:w-8 md:h-8", formData.paymentMethod === 'cod' ? 'text-primary' : 'text-muted-foreground')} />
                      <div className="flex-1">
                        <p className="font-black text-sm md:text-base uppercase tracking-tight">Pay on Arrival</p>
                        <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Settle with cash or UPI at delivery</p>
                      </div>
                    </Label>
                  )}
                  {settings?.onlinePayEnabled && (
                    <Label htmlFor="upi" className={cn("flex items-center gap-4 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-4 cursor-pointer transition-all", formData.paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'bg-white dark:bg-zinc-900 border-transparent shadow-sm', isOffline && "opacity-50 grayscale")}>
                      <RadioGroupItem value="upi" id="upi" className="sr-only" />
                      <Smartphone className={cn("w-6 h-6 md:w-8 md:h-8", formData.paymentMethod === 'upi' ? 'text-primary' : 'text-muted-foreground')} />
                      <div className="flex-1">
                        <p className="font-black text-sm md:text-base uppercase tracking-tight">Instant UPI Scan</p>
                        <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">High-speed verification via QR</p>
                      </div>
                    </Label>
                  )}
                </RadioGroup>
                
                {formData.paymentMethod === 'upi' && !isOffline && (
                  <Card className="p-6 md:p-10 text-center animate-in zoom-in-95 rounded-[2rem] md:rounded-[3rem] border-dashed border-2 bg-white dark:bg-zinc-900">
                    <div className="w-48 h-48 md:w-56 md:h-56 mx-auto relative bg-white border-4 md:border-8 border-secondary rounded-[1.5rem] md:rounded-[2rem] overflow-hidden mb-5 p-2">
                      <Image src={qrImage} alt="QR Code" fill className="object-contain" priority unoptimized />
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3 inline-block">
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Business Identity</p>
                      <p className="font-black text-primary text-base md:text-lg">{settings?.contactNumber}@ybl</p>
                    </div>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="h-14 md:h-16 rounded-2xl px-6 md:px-8 font-black border-2"><ChevronLeft className="w-5 h-5" /></Button>
                  <Button onClick={handleSubmit} disabled={loading || isOffline} className="flex-1 h-14 md:h-16 rounded-2xl text-sm md:text-base font-black uppercase tracking-widest bg-primary shadow-2xl shadow-primary/30">
                    {loading ? <Loader2 className="animate-spin" /> : isOffline ? 'Signal Required' : 'Settle Order'}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <Card className="p-10 md:p-16 text-center space-y-8 rounded-[2.5rem] md:rounded-[4rem] shadow-3xl animate-in zoom-in-95 border-none bg-white dark:bg-zinc-900">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-12 h-12 md:w-14 md:h-14" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-4xl md:text-5xl font-black font-headline uppercase tracking-tighter">Order <span className="text-primary italic">Placed!</span></h2>
                  <p className="text-muted-foreground font-bold text-sm md:text-base uppercase tracking-widest opacity-60">Syncing with kitchen station...</p>
                </div>
                <div className="bg-secondary/50 p-6 md:p-8 rounded-2xl md:rounded-[2rem] inline-block border-2 border-dashed">
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Live Ticket ID</p>
                  <p className="font-mono text-2xl md:text-4xl font-black text-primary">{orderId}</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-5 pt-4">
                  <Link href={`/orders/${orderId}`} className="flex-1 sm:flex-none">
                    <Button className="w-full rounded-xl px-10 h-14 font-black uppercase text-[9px] tracking-widest bg-primary">Track Order</Button>
                  </Link>
                  <Link href="/" className="flex-1 sm:flex-none">
                    <Button variant="outline" className="w-full rounded-xl px-10 h-14 font-black uppercase text-[9px] tracking-widest border-2">Return Home</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {step < 4 && (
            <div className="space-y-5 sticky top-20 h-fit">
              <Card className="rounded-2xl border-none shadow-lg bg-white dark:bg-zinc-900 overflow-hidden">
                <CardHeader className="p-4 border-b bg-muted/5 flex flex-row items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary">Bounty Engine</p>
                  <TicketPercent className="w-3.5 h-3.5 text-primary opacity-40" />
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {appliedCoupon ? (
                    <div className="bg-green-50 dark:bg-emerald-950/20 border border-green-100 dark:border-emerald-900/30 p-3 rounded-xl flex items-center justify-between animate-in zoom-in-95">
                      <div className="flex items-center gap-2.5">
                         <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center text-white shrink-0"><PartyPopper className="w-5 h-5" /></div>
                         <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase text-green-700 dark:text-emerald-400 tracking-tighter truncate">{appliedCoupon.code}</p>
                            <p className="text-[7px] font-bold text-green-600 dark:text-emerald-500/60 uppercase">Activated</p>
                         </div>
                      </div>
                      <button onClick={removePromo} className="text-green-700 dark:text-emerald-400 hover:text-destructive transition-colors p-1.5"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                       <div className="flex gap-2">
                          <Input 
                            placeholder="Promo Code" 
                            value={couponInput} 
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="rounded-xl h-11 uppercase font-black bg-secondary/30 border-none px-4 text-xs"
                            suppressHydrationWarning
                            disabled={isOffline}
                          />
                          <Button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput || isOffline} className="h-11 rounded-xl font-black text-[8px] uppercase px-5 bg-primary">Apply</Button>
                       </div>
                    </div>
                  )}
                  <Link href="/coupons" className="text-[8px] font-black text-primary uppercase text-center block hover:underline tracking-widest">View Bounties</Link>
                </CardContent>
              </Card>

              <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
                <CardHeader className="p-4 md:p-5 border-b bg-muted/5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary">Order Ledger</p>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center bg-green-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-green-100 dark:border-emerald-900/30">
                      <span className="text-[9px] font-black text-green-700 dark:text-emerald-400 uppercase">Bounty</span>
                      <span className="font-black text-green-600 dark:text-emerald-500">- ₹{discount}</span>
                    </div>
                  )}
                  {isDelivery && (
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Delivery</span>
                      <span className={deliveryFee === 0 ? "text-green-600 italic font-black" : "text-foreground"}>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-dashed pt-5 flex justify-between items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Payable</span>
                    <span className="text-4xl font-black font-headline text-primary italic leading-none">₹{total}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => { if (step === 2) setStep(3); }} />
    </div>
  );
}
