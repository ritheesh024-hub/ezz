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
  Fingerprint,
  PieChart,
  Boxes
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { 
  format,
  startOfDay,
  endOfDay,
  subDays,
  isWithinInterval,
  isToday,
  isThisWeek,
  isThisMonth
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

  // 1. Live Identity Data
  const usersQuery = useMemo(() => db ? query(collection(db, 'users')) : null, [db]);
  const { data: allUsers = [] } = useCollection<any>(usersQuery);

  // 2. Behavioral Audit Feed
  const analyticsQuery = useMemo(() => db ? query(collection(db, 'analytics'), orderBy('timestamp', 'desc'), limit(50)) : null, [db]);
  const { data: eventLogs = [], loading: logsLoading } = useCollection<any>(analyticsQuery);

  // 3. Calculation Engine
  const metrics = useMemo(() => {
    const now = new Date();
    
    // Revenue Filters
    const delivered = orders.filter(o => o.status === 'Delivered');
    const todayRev = delivered.filter(o => o.createdAt?.toDate && isToday(o.createdAt.toDate())).reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const weekRev = delivered.filter(o => o.createdAt?.toDate && isThisWeek(o.createdAt.toDate())).reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const monthRev = delivered.filter(o => o.createdAt?.toDate && isThisMonth(o.createdAt.toDate())).reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const totalRev = delivered.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    
    // Order Status Breakdown
    const statusCounts = {
      Pending: orders.filter(o => o.status === 'Pending').length,
      Preparing: orders.filter(o => o.status === 'Preparing' || o.status === 'Confirmed').length,
      Delivered: orders.filter(o => o.status === 'Delivered').length,
      Cancelled: orders.filter(o => o.status === 'Cancelled').length
    };

    // Inventory & Catalog Analysis
    const itemMap: Record<string, { name: string, quantity: number, revenue: number, views: number }> = {};
    
    // Aggregate Sales
    delivered.forEach(order => {
      order.items?.forEach((item: any) => {
        const id = item.id || item.name;
        if (!itemMap[id]) itemMap[id] = { name: item.name, quantity: 0, revenue: 0, views: 0 };
        const qty = Number(item.quantity) || 1;
        itemMap[id].quantity += qty;
        itemMap[id].revenue += (qty * (Number(item.price) || 0));
      });
    });

    // Merge Catalog View Data (from custom analytics collection)
    const viewLogs = eventLogs.filter(log => log.event === 'view_item');
    viewLogs.forEach(log => {
      const id = log.item_id;
      if (id && itemMap[id]) {
        itemMap[id].views += 1;
      }
    });

    const topPerformers = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);

    // Business Velocity Chart (7 Day Revenue Area)
    const chartMap: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'MMM dd')).reverse();
    last7Days.forEach(date => chartMap[date] = 0);

    delivered.forEach(order => {
      if (!order.createdAt?.toDate) return;
      const dateLabel = format(order.createdAt.toDate(), 'MMM dd');
      if (chartMap[dateLabel] !== undefined) {
        chartMap[dateLabel] += (Number(order.total) || 0);
      }
    });

    const chartData = Object.entries(chartMap).map(([name, val]) => ({ name, val }));

    return { 
      totalOrders: orders.length,
      revenue: { today: todayRev, week: weekRev, month: monthRev, total: totalRev },
      status: statusCounts,
      topPerformers,
      avgOrderValue: delivered.length > 0 ? Math.round(totalRev / delivered.length) : 0,
      totalCustomers: allUsers.length,
      chartData
    };
  }, [orders, allUsers, eventLogs]);

  if (!mounted) return (
    <div className="h-[600px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Connecting Data Nodes...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-20">
      {/* REAL-TIME TELEMETRY HUB */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatTile label="Today's Revenue" value={`₹${metrics.revenue.today}`} icon={IndianRupee} color="text-emerald-500" bg="bg-emerald-50" />
        <StatTile label="Active Tickets" value={metrics.status.Preparing + metrics.status.Pending} icon={Zap} color="text-orange-500" bg="bg-orange-50" />
        <StatTile label="Total History" value={metrics.totalOrders} icon={ShoppingBag} color="text-primary" bg="bg-primary/5" />
        <StatTile label="Avg Order" value={`₹${metrics.avgOrderValue}`} icon={CreditCard} color="text-blue-500" bg="bg-blue-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* REVENUE VELOCITY CHART */}
        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10 flex flex-col h-full">
          <CardHeader className="px-0 pt-0 pb-10 flex flex-row items-center justify-between border-b border-dashed mb-10">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black font-headline uppercase tracking-tighter">Business Velocity</CardTitle>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">7-Day Transaction Performance</p>
            </div>
            <div className="flex gap-2">
               <Badge className="bg-primary text-white font-black text-[8px] px-3 uppercase rounded-full">Revenue Trend</Badge>
            </div>
          </CardHeader>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: 11}}
                  formatter={(v: any) => [`₹${v}`, 'Sales']}
                />
                <Area type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={4} fill="url(#colorRev)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* LIVE ACTIVITY FEED */}
        <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
          <CardHeader className="p-10 border-b bg-muted/5 flex flex-row items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Activity className="w-5 h-5" /></div>
               <div className="space-y-0.5">
                 <CardTitle className="text-sm font-black uppercase tracking-widest">Behavioral Feed</CardTitle>
                 <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40">Live Action Stream</p>
               </div>
             </div>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[8px] font-black uppercase">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
             </div>
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide max-h-[500px]">
            {logsLoading ? (
              <div className="h-full flex items-center justify-center opacity-20"><Loader2 className="animate-spin w-8 h-8" /></div>
            ) : eventLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20"><PieChart className="w-12 h-12 mb-4" /><p className="text-[10px] font-black uppercase">Awaiting Signals</p></div>
            ) : eventLogs.map((log: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-transparent group hover:border-primary/20 transition-all">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white",
                  log.event === 'purchase' ? "bg-green-500" : log.event === 'add_to_cart' ? "bg-primary" : "bg-blue-500"
                )}>
                  {log.event === 'purchase' ? <ShoppingBag className="w-5 h-5" /> : log.event === 'view_item' ? <Package className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                   <div className="flex justify-between items-start mb-0.5">
                     <p className="text-[11px] font-black uppercase truncate">{log.event.replace('_', ' ')}</p>
                     <span className="text-[8px] font-black text-muted-foreground opacity-40 uppercase">
                       {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'hh:mm a') : 'Now'}
                     </span>
                   </div>
                   <p className="text-[9px] font-bold opacity-50 truncate">
                     {log.item_name || log.email || log.search_term || 'Generic Engagement'}
                   </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* OPERATIONAL BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* ORDER STATUS DISTRIBUTION */}
        <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10 space-y-8">
          <div className="space-y-1">
            <h4 className="text-xl font-black font-headline uppercase tracking-tighter">Inventory Flow</h4>
            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Status Breakdown Across All Nodes</p>
          </div>
          <div className="space-y-4">
             <ProgressLine label="Delivered" count={metrics.status.Delivered} total={metrics.totalOrders} color="bg-emerald-500" />
             <ProgressLine label="Preparing" count={metrics.status.Preparing} total={metrics.totalOrders} color="bg-orange-500" />
             <ProgressLine label="Pending" count={metrics.status.Pending} total={metrics.totalOrders} color="bg-blue-500" />
             <ProgressLine label="Cancelled" count={metrics.status.Cancelled} total={metrics.totalOrders} color="bg-rose-500" />
          </div>
        </Card>

        {/* TOP CONVERTING DISHES */}
        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h4 className="text-xl font-black font-headline uppercase tracking-tighter flex items-center gap-3"><Target className="w-6 h-6 text-primary" /> Top Performers</h4>
              <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40">Revenue Generating Catalog Items</p>
            </div>
            <Button variant="ghost" className="font-black text-[9px] uppercase tracking-widest text-primary gap-2">Full Catalog <ArrowUpRight className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {metrics.topPerformers.slice(0, 6).map((item, i) => (
              <div key={i} className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-[1.8rem] flex flex-col justify-between h-32 hover:bg-white dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-primary/10 group">
                 <div className="flex justify-between items-start">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">#{i+1}</span>
                    <div className="text-right">
                       <p className="text-[8px] font-black uppercase opacity-40">Gross</p>
                       <p className="text-sm font-black text-primary italic">₹{item.revenue}</p>
                    </div>
                 </div>
                 <div>
                    <h5 className="font-black text-xs uppercase truncate group-hover:text-primary transition-colors">{item.name}</h5>
                    <p className="text-[8px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest mt-0.5">{item.quantity} Sold • {item.views} Views</p>
                 </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, icon: Icon, color, bg }: any) => (
  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 group hover:scale-[1.02] transition-transform">
    <div className="flex justify-between items-start mb-6">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", bg, color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex gap-1 h-fit">
        {[1,2,3].map(i => <div key={i} className={cn("w-1 h-3 rounded-full", color, i === 3 ? "opacity-30" : "opacity-60")} />)}
      </div>
    </div>
    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-40">{label}</p>
    <h3 className="text-4xl font-black font-headline tracking-tighter italic leading-none">{value}</h3>
  </Card>
);

const ProgressLine = ({ label, count, total, color }: any) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className="opacity-60">{label}</span>
        <span>{count} <span className="opacity-40 ml-1">({percentage}%)</span></span>
      </div>
      <div className="h-1.5 w-full bg-secondary dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
