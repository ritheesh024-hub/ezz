'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  Zap,
  Package,
  Loader2,
  Users,
  Target,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  History,
  Activity,
  Calendar,
  TrendingUp,
  CreditCard,
  ArrowDownRight,
  Fingerprint
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '@/lib/utils';
import { 
  format,
  startOfDay,
  endOfDay,
  subDays,
  isWithinInterval
} from 'date-fns';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

export const DashboardAnalysis = ({ orders = [], products = [] }: DashboardAnalysisProps) => {
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const usersQuery = useMemo(() => db ? query(collection(db, 'users')) : null, [db]);
  const { data: allUsers = [] } = useCollection<any>(usersQuery);

  const eventsQuery = useMemo(() => db ? query(collection(db, 'login_events'), orderBy('timestamp', 'desc'), limit(100)) : null, [db]);
  const { data: loginEvents = [], loading: eventsLoading } = useCollection<any>(eventsQuery);

  const metrics = useMemo(() => {
    const completed = (orders || []).filter(o => o.status === 'Delivered');
    const revenue = completed.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const pending = (orders || []).filter(o => ['Pending', 'Preparing', 'Confirmed'].includes(o.status));
    
    const itemMap: Record<string, { name: string, quantity: number, revenue: number }> = {};
    completed.forEach(order => {
      order.items?.forEach((item: any) => {
        const id = item.id || item.name;
        if (!itemMap[id]) itemMap[id] = { name: item.name, quantity: 0, revenue: 0 };
        const qty = Number(item.quantity) || 1;
        itemMap[id].quantity += qty;
        itemMap[id].revenue += (qty * (Number(item.price) || 0));
      });
    });

    const itemStats = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);

    const chartMap: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'MMM dd')).reverse();
    last7Days.forEach(date => chartMap[date] = 0);

    orders.forEach(order => {
      if (!order.createdAt?.toDate) return;
      const dateLabel = format(order.createdAt.toDate(), 'MMM dd');
      if (chartMap[dateLabel] !== undefined) {
        chartMap[dateLabel] += (Number(order.total) || 0);
      }
    });

    const chartData = Object.entries(chartMap).map(([name, val]) => ({ name, val }));

    return { 
      total: orders.length, 
      revenue, 
      pending: pending.length,
      itemStats,
      totalRegisteredUsers: allUsers.length,
      chartData
    };
  }, [orders, allUsers]);

  if (!mounted) return (
    <div className="h-[600px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Initializing Analytics Hub...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-20">
      {/* GLOBAL TELEMETRY HEADER */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black font-headline uppercase tracking-tighter">Operational <span className="text-primary italic">Intelligence</span></h3>
            <div className="flex items-center gap-3 mt-1">
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[8px] font-black uppercase border border-green-100">
                 <Activity className="w-2.5 h-2.5" /> Live Sync
               </div>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Aggregation since Day 1</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl h-12 px-6 gap-2 font-black uppercase text-[10px] tracking-widest border-2">
            <Calendar className="w-4 h-4" /> Custom Range
          </Button>
          <Button variant="outline" size="icon" onClick={() => window.location.reload()} className="rounded-xl h-12 w-12 border-2">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PRIMARY KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Gross Revenue', value: `₹${metrics.revenue}`, icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: '+12.5%', isUp: true },
          { label: 'Total Orders', value: metrics.total, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/5', trend: '+5.2%', isUp: true },
          { label: 'Active Load', value: metrics.pending, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', trend: '-2.1%', isUp: false },
          { label: 'User Assets', value: metrics.totalRegisteredUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', trend: '+8.9%', isUp: true }
        ].map((kpi, i) => (
          <Card key={i} className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 group hover:scale-[1.02] transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", kpi.bg, kpi.color)}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <Badge variant="outline" className={cn("border-none px-2 font-black text-[9px] uppercase", kpi.isUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50")}>
                {kpi.isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {kpi.trend}
              </Badge>
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-40">{kpi.label}</p>
            <h3 className="text-4xl font-black font-headline tracking-tighter italic leading-none">{kpi.value}</h3>
          </Card>
        ))}
      </div>

      {/* TREND ANALYSIS & AUDIT LOGS */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10 flex flex-col">
          <CardHeader className="px-0 pt-0 pb-10 flex flex-row items-center justify-between border-b border-dashed mb-10">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black font-headline uppercase tracking-tighter">Business Velocity</CardTitle>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">Transaction Volume Trends (Last 7 Days)</p>
            </div>
            <div className="flex items-center gap-2">
               <Badge className="bg-primary text-white font-black text-[8px] px-3 uppercase rounded-full">Revenue (INR)</Badge>
            </div>
          </CardHeader>
          <div className="flex-1 min-h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y2="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip 
                  cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: 11, padding: '16px'}}
                  formatter={(value: number) => [`₹${value}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#ef4444" 
                  strokeWidth={4} 
                  fill="url(#colorVal)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* SECURITY & IDENTITY LOGS */}
        <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
          <CardHeader className="p-10 border-b bg-muted/5 flex flex-row items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                 <ShieldCheck className="w-5 h-5" />
               </div>
               <div className="space-y-0.5">
                 <CardTitle className="text-sm font-black uppercase tracking-widest">Security Audit</CardTitle>
                 <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40">Live Identity Feed</p>
               </div>
             </div>
             <History className="w-5 h-5 text-muted-foreground opacity-20" />
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {eventsLoading ? (
              <div className="h-full flex items-center justify-center opacity-20"><Loader2 className="animate-spin w-10 h-10" /></div>
            ) : loginEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 grayscale">
                <ShieldCheck className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Zero Access Logs</p>
              </div>
            ) : (
              loginEvents.map((event: any, i: number) => (
                <div key={i} className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-border/5 group hover:border-primary/20 transition-colors">
                   <div className={cn(
                     "w-11 h-11 rounded-[1rem] flex items-center justify-center shrink-0 shadow-sm",
                     event.role === 'admin' ? "bg-primary text-white" : "bg-blue-600 text-white"
                   )}>
                     <Fingerprint className="w-5 h-5" />
                   </div>
                   <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="text-[11px] font-black uppercase truncate leading-none">{event.name}</p>
                        <span className="text-[8px] font-black text-muted-foreground opacity-40 uppercase whitespace-nowrap">
                          {event.timestamp?.toDate ? format(event.timestamp.toDate(), 'hh:mm a') : 'Now'}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold opacity-50 truncate mb-2">{event.email}</p>
                      <div className="flex items-center gap-2">
                         <span className="text-[7px] font-black uppercase bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full border shadow-sm">{event.role}</span>
                         <span className="text-[7px] font-black uppercase opacity-40 tracking-tighter">via {event.platform || 'Web Hub'}</span>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* INVENTORY ASSET PERFORMANCE */}
      <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10">
         <div className="flex items-center justify-between mb-10 border-b border-dashed pb-8">
           <div className="space-y-1">
             <h4 className="text-xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
               <Target className="w-6 h-6 text-primary" /> 
               Top Performers
             </h4>
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Highest converting menu items (Firestore)</p>
           </div>
           <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest text-primary gap-2">
             Detailed View <ArrowUpRight className="w-4 h-4" />
           </Button>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {metrics.itemStats.slice(0, 4).map((item: any, i: number) => (
             <div key={i} className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] space-y-4 group hover:bg-white dark:hover:bg-zinc-800 transition-all hover:shadow-lg border border-transparent hover:border-primary/10">
                <div className="flex justify-between items-center">
                   <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs">#{i+1}</div>
                   <div className="text-right">
                     <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40">Gross</p>
                     <span className="font-black text-lg text-primary italic">₹{item.revenue}</span>
                   </div>
                </div>
                <div className="pt-2">
                   <h5 className="font-black text-sm uppercase truncate mb-1">{item.name}</h5>
                   <div className="flex items-center justify-between">
                     <p className="text-[9px] font-black uppercase opacity-40">{item.quantity} units dispatched</p>
                     <div className="flex gap-0.5">
                       {[1,2,3,4,5].map(s => <div key={s} className="w-1 h-1 rounded-full bg-primary/20" />)}
                     </div>
                   </div>
                </div>
             </div>
           ))}
         </div>
      </Card>
    </div>
  );
};