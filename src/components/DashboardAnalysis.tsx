'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IndianRupee,
  Zap,
  Loader2,
  Users,
  CreditCard,
  Fingerprint,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Heart,
  MessageSquare,
  Star,
  Gift,
  TicketPercent,
  TrendingDown,
  ChefHat,
  BellRing
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
  isToday,
  subDays
} from 'date-fns';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';

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

  const metrics = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const todayRev = delivered.filter(o => o.createdAt?.toDate && isToday(o.createdAt.toDate())).reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const totalRev = delivered.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    
    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      accepted: orders.filter(o => o.status === 'accepted').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
      delivered: delivered.length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length
    };

    const chartMap: Record<string, number> = {};
    const labels = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'MMM dd')).reverse();
    labels.forEach(l => chartMap[l] = 0);

    delivered.forEach(o => {
      if (!o.createdAt?.toDate) return;
      const label = format(o.createdAt.toDate(), 'MMM dd');
      if (chartMap[label] !== undefined) chartMap[label] += Number(o.total) || 0;
    });

    const chartData = Object.entries(chartMap).map(([name, val]) => ({ name, val }));

    return { 
      todayRev, 
      totalRev, 
      statusCounts, 
      chartData, 
      avgOrder: delivered.length ? Math.round(totalRev / delivered.length) : 0,
      totalOrders: orders.length
    };
  }, [orders]);

  if (!mounted) return (
    <div className="h-[600px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Syncing Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Gross Revenue" value={`₹${metrics.todayRev}`} icon={IndianRupee} trend="+12%" color="text-emerald-500" bg="bg-emerald-50" />
        <KPICard label="Total Tickets" value={metrics.totalOrders} icon={Zap} trend="Real-time" color="text-primary" bg="bg-primary/5" />
        <KPICard label="In Kitchen" value={metrics.statusCounts.preparing} icon={ChefHat} trend="Active" color="text-orange-500" bg="bg-orange-50" />
        <KPICard label="Pending Hub" value={metrics.statusCounts.pending} icon={BellRing} trend="Immediate" color="text-rose-500" bg="bg-rose-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 md:p-10 flex flex-col h-full overflow-hidden relative">
          <CardHeader className="px-0 pt-0 pb-10 flex flex-row items-center justify-between border-b border-dashed mb-10">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black font-headline uppercase tracking-tighter italic">Operational <span className="text-primary">Velocity</span></CardTitle>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">7-Day Transaction Performance</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 font-black text-[9px] uppercase tracking-widest rounded-full">Live Node Feed</Badge>
          </CardHeader>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="velocity" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(v: any) => [`₹${v}`, 'Gross']}
                />
                <Area type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={5} fill="url(#velocity)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 space-y-10">
          <div className="space-y-1">
            <h4 className="text-xl font-black font-headline uppercase tracking-tighter italic">Status <span className="text-primary">Ledger</span></h4>
            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">Real-time Node Distribution</p>
          </div>
          <div className="space-y-6">
             <MetricBar label="Delivered" count={metrics.statusCounts.delivered} total={metrics.totalOrders} color="bg-emerald-500" />
             <MetricBar label="Preparing" count={metrics.statusCounts.preparing} total={metrics.totalOrders} color="bg-orange-500" />
             <MetricBar label="In Dispatch" count={metrics.statusCounts.out_for_delivery} total={metrics.totalOrders} color="bg-blue-500" />
             <MetricBar label="Rejected" count={metrics.statusCounts.cancelled} total={metrics.totalOrders} color="bg-rose-500" />
          </div>
        </Card>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, icon: Icon, trend, color, bg }: any) => (
  <Card className="rounded-[2rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 group hover:scale-[1.03] transition-all duration-500 overflow-hidden relative">
    <div className="absolute -right-4 -top-4 w-20 h-20 bg-secondary/30 rounded-full blur-2xl group-hover:bg-primary/5 transition-colors" />
    <div className="flex justify-between items-start mb-8">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner relative z-10", bg, color)}>
        <Icon className="w-7 h-7" />
      </div>
      <div className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-zinc-100", color)}>
        {trend}
      </div>
    </div>
    <div className="relative z-10 space-y-1">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{label}</p>
      <h3 className="text-4xl font-black font-headline tracking-tighter italic leading-none">{value}</h3>
    </div>
  </Card>
);

const MetricBar = ({ label, count, total, color }: any) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em]">
        <span className="opacity-60">{label}</span>
        <span className="font-mono">{count} <span className="opacity-30 ml-1 text-[8px]">({percentage}%)</span></span>
      </div>
      <div className="h-2 w-full bg-secondary dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className={cn("h-full rounded-full", color)} 
        />
      </div>
    </div>
  );
};