"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, Users, IndianRupee, MessageSquare, Sparkles, Loader2, 
  TrendingUp, Package, Clock, CheckCircle2, AlertCircle, ShoppingCart,
  ArrowUpRight, MoreHorizontal, Settings, Megaphone, UtensilsCrossed,
  LayoutDashboard, Zap
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MENU_ITEMS } from '@/app/lib/menu-data';
import { reviewSummaryGenerator } from '@/ai/flows/review-summary-generator';
import { dailySpecialGenerator } from '@/ai/flows/daily-special-generator';
import { toast } from '@/hooks/use-toast';

const MOCK_REVIEWS: Record<string, string[]> = {
  '1': ["Balanced spices!", "A bit too much onion", "Best campus snack", "Fast delivery"],
  '3': ["Authentic style", "Portion size could be better", "Amazing flavors", "Perfect spices"],
  '5': ["Rich chocolate", "Too sweet for me", "Best presentation", "Nuts add great crunch"]
};

const INITIAL_ORDERS = [
  { id: "#EB-9231", customer: "Rahul Sharma", items: "Chicken Biryani, Coke", total: "₹289", status: "Delivered", time: "10 mins ago" },
  { id: "#EB-9232", customer: "Priya V.", items: "Veg Maggie, Sundae", total: "₹218", status: "Preparing", time: "15 mins ago" },
  { id: "#EB-9233", customer: "Anand K.", items: "Paneer Momos (x2)", total: "₹258", status: "Pending", time: "22 mins ago" },
  { id: "#EB-9234", customer: "Sneha G.", items: "Egg Maggie Special", total: "₹89", status: "Delivered", time: "45 mins ago" },
  { id: "#EB-9235", customer: "Vikram R.", items: "Hyderabadi Biryani (x3)", total: "₹747", status: "Cancelled", time: "1 hour ago" },
];

export const AdminSection = () => {
  const [selectedDish, setSelectedDish] = useState('1');
  const [summary, setSummary] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  
  // Marketing AI State
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<any>(null);
  const [selectedPromoDish, setSelectedPromoDish] = useState(MENU_ITEMS[0]);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    toast({ title: `Order ${id} updated to ${newStatus}` });
  };

  const handleGenerateSummary = async () => {
    setLoadingFeedback(true);
    try {
      const reviews = MOCK_REVIEWS[selectedDish] || ["Good food", "Nice experience"];
      const result = await reviewSummaryGenerator({ reviews });
      setSummary(result.summary);
    } catch (error) {
      setSummary("AI analysis currently unavailable.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleGeneratePromo = async () => {
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
    <section className="py-8 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-headline font-black tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-primary" />
              Easy<span className="text-primary">Bites</span> Command Center
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Real-time operations & intelligence</p>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 font-bold">Kitchen: LIVE</Badge>
             <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 font-bold">Delivery: BUSY</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card p-1 rounded-2xl border w-full md:w-auto shadow-sm">
            <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Orders</TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Inventory</TabsTrigger>
            <TabsTrigger value="marketing" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Marketing
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: "Today's Revenue", value: "₹42,500", icon: IndianRupee, color: "text-green-600" },
                 { label: "Orders Today", value: "128", icon: Package, color: "text-blue-600" },
                 { label: "Avg Prep Time", value: "18m", icon: Clock, color: "text-orange-600" },
                 { label: "AI Rating", value: "4.8", icon: Star, color: "text-yellow-600" }
               ].map((s, i) => (
                 <Card key={i} className="rounded-3xl border-none shadow-md overflow-hidden bg-card">
                    <CardContent className="p-5">
                       <div className={`w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-3 ${s.color}`}>
                          <s.icon className="w-5 h-5" />
                       </div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                       <h3 className="text-2xl font-black">{s.value}</h3>
                    </CardContent>
                 </Card>
               ))}
             </div>
             
             <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 rounded-3xl shadow-md border-none">
                  <CardHeader className="border-b">
                    <CardTitle className="text-lg">Sales Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px] flex items-end gap-2 p-6">
                    {[40, 60, 45, 90, 100, 80, 50, 70, 85].map((v, i) => (
                      <div key={i} className="flex-1 bg-primary/10 rounded-t-lg relative group hover:bg-primary transition-all" style={{ height: `${v}%` }}>
                         <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100">{v}%</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-md border-none bg-primary text-white overflow-hidden relative">
                   <Zap className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10" />
                   <CardHeader>
                     <CardTitle className="text-lg">Kitchen Rush</CardTitle>
                     <CardDescription className="text-white/70">8 active items being prepped</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-4xl font-black">92%</span>
                        <span className="text-xs font-bold uppercase">Efficiency</span>
                      </div>
                      <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[92%] transition-all" />
                      </div>
                      <p className="text-[10px] font-medium leading-relaxed opacity-80">Estimated wait time for new orders is currently 12 minutes above average.</p>
                   </CardContent>
                </Card>
             </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom duration-500">
            <Card className="rounded-3xl shadow-md border-none overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold">Order</TableHead>
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Items</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs font-bold">{order.id}</TableCell>
                      <TableCell className="font-bold text-sm">{order.customer}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{order.items}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`rounded-lg font-black uppercase text-[10px] ${
                          order.status === 'Delivered' ? 'bg-green-50 text-green-700' :
                          order.status === 'Preparing' ? 'bg-blue-50 text-blue-700' :
                          order.status === 'Pending' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => handleUpdateStatus(order.id, 'Preparing')}>
                            <Clock className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-green-600" onClick={() => handleUpdateStatus(order.id, 'Delivered')}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="animate-in fade-in slide-in-from-bottom duration-500">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MENU_ITEMS.map((item) => (
                <Card key={item.id} className="rounded-3xl border-none shadow-md overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="relative h-24 bg-muted">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4">
                        <h4 className="text-white font-bold text-sm">{item.name}</h4>
                        <span className="text-white/80 text-[10px] uppercase font-black tracking-widest">{item.category}</span>
                      </div>
                    </div>
                    <div className="p-5 flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-xs font-bold text-muted-foreground">Availability</p>
                          <Badge className={item.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {item.isAvailable ? "In Stock" : "Sold Out"}
                          </Badge>
                       </div>
                       <Switch checked={item.isAvailable} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Marketing AI Tab */}
          <TabsContent value="marketing" className="space-y-6 animate-in fade-in duration-500">
             <div className="grid lg:grid-cols-3 gap-6">
                <Card className="rounded-3xl border-none shadow-md">
                   <CardHeader>
                     <CardTitle className="text-lg">Promotional AI</CardTitle>
                     <CardDescription>Generate daily specials and social copy.</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="space-y-2">
                         <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Dish</Label>
                         <div className="grid grid-cols-2 gap-2">
                           {MENU_ITEMS.slice(0, 4).map((item) => (
                             <button
                               key={item.id}
                               onClick={() => setSelectedPromoDish(item)}
                               className={`p-3 rounded-xl border-2 text-left transition-all ${
                                 selectedPromoDish.id === item.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50'
                               }`}
                             >
                               <span className="text-[10px] block font-black">{item.name}</span>
                             </button>
                           ))}
                         </div>
                      </div>
                      <Button 
                        className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
                        onClick={handleGeneratePromo}
                        disabled={promoLoading}
                      >
                        {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                        Generate Special
                      </Button>
                   </CardContent>
                </Card>

                <Card className="lg:col-span-2 rounded-3xl border-none shadow-md bg-muted/30 relative flex items-center justify-center p-8 overflow-hidden">
                   {promoResult ? (
                     <div className="max-w-md w-full space-y-6 animate-in zoom-in duration-500">
                        <div className="p-6 bg-card rounded-[32px] shadow-2xl border border-primary/10 relative">
                           <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-2xl animate-bounce">
                             {promoResult.emoji}
                           </div>
                           <h4 className="text-2xl font-black mb-2 text-primary">{promoResult.promoTitle}</h4>
                           <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">{promoResult.promoDescription}</p>
                           <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl">
                              <div>
                                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Special Price</p>
                                 <p className="text-2xl font-black">₹{promoResult.finalPrice}</p>
                              </div>
                              <Button variant="outline" className="rounded-xl border-primary text-primary font-bold text-xs h-9">
                                 Copy to Post
                              </Button>
                           </div>
                        </div>
                        <p className="text-[10px] text-center font-black uppercase text-muted-foreground tracking-[0.3em]">
                           AI Powered Content Engine
                        </p>
                     </div>
                   ) : (
                     <div className="text-center space-y-3 opacity-30">
                        <Sparkles className="w-12 h-12 mx-auto" />
                        <p className="font-bold">Select a dish to generate a promotion</p>
                     </div>
                   )}
                </Card>
             </div>
             
             {/* Feedback Integration */}
             <div className="grid lg:grid-cols-3 gap-6">
                <Card className="rounded-3xl border-none shadow-md">
                   <CardHeader>
                      <CardTitle className="text-lg">Customer Sentiment</CardTitle>
                      <CardDescription>Synthesize reviews with Genkit AI.</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      {MENU_ITEMS.slice(0, 3).map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedDish(item.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                            selectedDish === item.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50'
                          }`}
                        >
                           <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-xs">
                             {item.rating}
                           </div>
                           <span className="font-bold text-sm">{item.name}</span>
                        </button>
                      ))}
                      <Button className="w-full rounded-xl font-bold h-12" variant="outline" onClick={handleGenerateSummary} disabled={loadingFeedback}>
                        {loadingFeedback ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                        Analyze Feedback
                      </Button>
                   </CardContent>
                </Card>

                <Card className="lg:col-span-2 rounded-3xl border-none shadow-md flex items-center justify-center p-8">
                   {summary ? (
                     <div className="text-center space-y-4 animate-in fade-in duration-500">
                        <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-foreground/80">
                           "{summary}"
                        </p>
                        <Badge className="bg-green-100 text-green-700 font-bold px-4 py-1">Actionable Insight</Badge>
                     </div>
                   ) : (
                     <p className="text-muted-foreground/30 font-black uppercase text-sm">Select dish to analyze sentiment</p>
                   )}
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
