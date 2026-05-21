
"use client"
import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle2, ChevronRight, ChevronLeft, CreditCard, Wallet, Smartphone, Truck, ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getTotal, clearCart } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    instructions: '',
    paymentMethod: 'cod'
  });

  const subtotal = getTotal();
  const deliveryFee = subtotal >= 149 ? 0 : 40;
  const total = subtotal + deliveryFee;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    clearCart();
    setStep(4); // Success step
  };

  if (cart.length === 0 && step < 4) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <ShoppingBag className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
          <h2 className="text-2xl font-headline font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/menu">
            <Button size="lg" className="rounded-full px-8">Browse Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Step Progress */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
            <div className={`absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500`} style={{ width: `${(step - 1) * 33.33}%` }} />
            
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border-4 border-background ${step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold">{s}</span>}
                </div>
                <span className={`text-[10px] md:text-xs font-bold mt-2 uppercase tracking-wider ${step >= s ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Review' : s === 2 ? 'Details' : s === 3 ? 'Payment' : 'Done'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-2xl font-headline font-bold">Review Your Cart</h2>
                <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 border-b last:border-0 flex gap-4 items-center">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-secondary">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleNext} className="w-full h-14 rounded-xl text-lg font-bold">
                  Continue to Delivery Details
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-2xl font-headline font-bold">Delivery Details</h2>
                <Card className="rounded-2xl border shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          placeholder="Anurag University student" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          placeholder="+91 86393XXXXX" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="rounded-xl h-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Full Delivery Address</Label>
                      <Textarea 
                        id="address" 
                        placeholder="House No, Street, Landmark, Pincode" 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="rounded-xl min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                      <Input 
                        id="instructions" 
                        placeholder="E.g. No spicy, leave at door" 
                        value={formData.instructions}
                        onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                        className="rounded-xl h-12"
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBack} className="h-14 rounded-xl px-6">
                    <ChevronLeft className="mr-2 w-5 h-5" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-14 rounded-xl text-lg font-bold">
                    Proceed to Payment
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                <h2 className="text-2xl font-headline font-bold">Payment Method</h2>
                <RadioGroup 
                  defaultValue={formData.paymentMethod} 
                  onValueChange={(v) => setFormData({...formData, paymentMethod: v})}
                  className="space-y-4"
                >
                  <Label 
                    htmlFor="upi" 
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-transparent bg-card'}`}
                  >
                    <RadioGroupItem value="upi" id="upi" className="sr-only" />
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">UPI / PhonePe / GPay</p>
                      <p className="text-xs text-muted-foreground">Scan QR or pay with UPI ID</p>
                    </div>
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </Label>

                  <Label 
                    htmlFor="razorpay" 
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'border-transparent bg-card'}`}
                  >
                    <RadioGroupItem value="razorpay" id="razorpay" className="sr-only" />
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">Online Payment</p>
                      <p className="text-xs text-muted-foreground">Credit/Debit Cards & Net Banking</p>
                    </div>
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </Label>

                  <Label 
                    htmlFor="cod" 
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-transparent bg-card'}`}
                  >
                    <RadioGroupItem value="cod" id="cod" className="sr-only" />
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when you receive your food</p>
                    </div>
                  </Label>
                </RadioGroup>

                {formData.paymentMethod === 'upi' && (
                  <div className="bg-card border rounded-2xl p-6 text-center space-y-4 animate-in zoom-in duration-300">
                    <p className="text-sm font-bold uppercase text-muted-foreground">Scan QR to Pay</p>
                    <div className="w-48 h-48 mx-auto relative bg-secondary rounded-xl overflow-hidden">
                      <Image 
                        src="https://picsum.photos/seed/qr/200/200" 
                        alt="QR Code" 
                        fill 
                        className="p-2"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Cafe UPI ID: 8639366800@ybl</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleBack} className="h-14 rounded-xl px-6">
                    <ChevronLeft className="mr-2 w-5 h-5" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-14 rounded-xl text-lg font-bold shadow-xl shadow-primary/20">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Confirm Order'}
                    {!loading && <CheckCircle2 className="ml-2 w-5 h-5" />}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-card border rounded-3xl p-8 text-center space-y-6 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-3xl font-headline font-bold mb-2">Order Confirmed!</h2>
                  <p className="text-muted-foreground">Thank you for ordering from Easy Bites. Your food is being prepared with love.</p>
                </div>
                <div className="bg-secondary p-4 rounded-xl inline-block">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Order ID</p>
                  <p className="font-mono text-lg font-bold">#EB-{Math.floor(Math.random() * 90000) + 10000}</p>
                </div>
                <div className="pt-6">
                  <Link href="/">
                    <Button variant="default" className="rounded-full px-10 h-12">Return Home</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {step < 4 && (
            <div className="space-y-6">
              <Card className="rounded-2xl border shadow-sm sticky top-24">
                <CardHeader className="p-6 border-b">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items ({cart.length})</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className={deliveryFee === 0 ? "text-green-600 font-bold" : ""}>
                        {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                      </span>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">To Pay</span>
                      <span className="text-2xl font-headline font-black text-primary">₹{total}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 bg-secondary/50 rounded-b-2xl border-t">
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <Truck className="w-4 h-4 text-primary shrink-0" />
                    <p>Estimated delivery time: <span className="text-foreground font-bold">20-30 mins</span></p>
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
