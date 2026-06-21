'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  IndianRupee,
  Zap,
  Loader2,
  Users,
  TrendingUp,
  TrendingDown,
  ChefHat,
  BellRing,
  Calendar as CalendarIcon,
  Download,
  Printer,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShoppingBag,
  Ban
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
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subMonths,
  subWeeks,
  eachDayOfInterval,
  eachHourOfInterval,
  isSameDay,
  isSameHour
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

type RangeType = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'custom';

export const DashboardAnalysis = ({ orders = [], products = [] }: DashboardAnalysisProps) => {
  const [mounted, setMounted] = useState(false);
  const [rangeType, setRangeType] = useState<RangeType>('today');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Resolve Intervals based on Range Selection
  const intervals = useMemo(() => {
    const now = new Date();
    let current = { from: startOfDay(now), to: endOfDay(now) };
    let previous = { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };

    switch (rangeType) {
      case 'yesterday':
        current = { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };
        previous = { from: startOfDay(subDays(now, 2)), to: endOfDay(subDays(now, 2)) };
        break;
      case 'week':
        current = { from: startOfWeek(now), to: endOfDay(now) };
        previous = { from: startOfWeek(subWeeks(now, 1)), to: endOfWeek(subWeeks(now, 1)) };
        break;
      case 'month':
        current = { from: startOfMonth(now), to: endOfDay(now) };
        previous = { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
        break;
      case 'last_month':
        current = { from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) };
        previous = { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(subMonths(now, 2)) };
        break;
      case 'custom':
        current = { from: startOfDay(dateRange.from), to: endOfDay(dateRange.to) };
        // Comparison for custom is the same duration prior to 'from'
        const duration = current.to.getTime() - current.from.getTime();
        previous = { 
          from: new Date(current.from.getTime() - duration), 
          to: new Date(current.to.getTime() - duration) 
        };
        break;
    }
    return { current, previous };
  }, [rangeType, dateRange]);

  // 2. Data Crunching Node
  const metrics = useMemo(() => {
    const filterOrders = (start: Date, end: Date) => 
      orders.filter(o => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return isWithinInterval(d, { start, end });
      });

    const currOrders = filterOrders(intervals.current.from, intervals.current.to);
    const prevOrders = filterOrders(intervals.previous.from, intervals.previous.to);

    const calculateStats = (data: any[]) => {
      const delivered = data.filter(o => o.status === 'delivered');
      const revenue = delivered.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
      const customers = new Set(data.map(o => o.userId || o.customerPhone)).size;
      return {
        revenue,
        total: data.length,
        delivered: delivered.length,
        pending: data.filter(o => o.status === 'pending').length,
        preparing: data.filter(o => o.status === 'preparing').length,
        cancelled: data.filter(o => o.status === 'Cancelled').length,
        customers,
        aov: delivered.length ? Math.round(revenue / delivered.length) : 0
      };
    };

    const currStats = calculateStats(currOrders);
    const prevStats = calculateStats(prevOrders);

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    // Chart Data Construction
    let chartData: any[] = [];
    const isSingleDay = isSameDay(intervals.current.from, intervals.current.to);

    if (isSingleDay) {
      const hours = eachHourOfInterval({ start: intervals.current.from, end: intervals.current.to });
      chartData = hours.map(h => {
        const val = currOrders
          .filter(o => {
             const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
             return isSameHour(d, h) && o.status === 'delivered';
          })
          .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        return { name: format(h, 'HH:mm'), val };
      });
    } else {
      const days = eachDayOfInterval({ start: intervals.current.from, end: intervals.current.to });
      chartData = days.map(d => {
        const val = currOrders
          .filter(o => {
             const ordDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
             return isSameDay(ordDate, d) && o.status === 'delivered';
          })
          .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
        return { name: format(d, 'MMM dd'), val };
      });
    }

    return {
      current: currStats,
      previous: prevStats,
      trends: {
        revenue: calcTrend(currStats.revenue, prevStats.revenue),
        orders: calcTrend(currStats.total, prevStats.total),
        customers: calcTrend(currStats.customers, prevStats.customers),
        aov: calcTrend(currStats.aov, prevStats.aov)
      },
      chartData
    };
  }, [orders, intervals]);

  const handleExport = () => {
    const headers = ["Identity", "Value"];
    const rows = [
      ["Platform", "Ezzy Bites Premium"],
      ["Report Type", "Operational Audit"],
      ["Range", `${format(intervals.current.from, 'PPP')} to ${format(intervals.current.to, 'PPP')}`],
      ["Gross Revenue", `INR ${metrics.current.revenue}`],
      ["Total Tickets", metrics.current.total],
      ["Delivered Units", metrics.current.delivered],
      ["Unique Node IDs", metrics.current.customers],
      ["Average Order Density", metrics.current.aov]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EzzyBites_Audit_${rangeType}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return (
    <div className="h-[600px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Syncing Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32">
      {/* STICKY FILTER BAR */}
      <div className="sticky top-0 z-40 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl -mx-6 md:-mx-10 px-6 md:px-10 py-6 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 no-print">
        <div className="flex flex-wrap gap-2">
          {(['today', 'yesterday', 'week', 'month', 'last_month'] as RangeType[]).map((r) => (
            <Button
              key={r}
              onClick={() => setRangeType(r)}
              variant={rangeType === r ? 'default' : 'outline'}
              className={cn(
                "h-10 px-6 rounded-full font-black uppercase text-[9px] tracking-widest transition-all",
                rangeType === r ? "bg-primary shadow-lg shadow-primary/20 border-none" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              )}
            >
              {r.replace('_', ' ')}
            </Button>
          ))}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={rangeType === 'custom' ? 'default' : 'outline'}
                className={cn(
                  "h-10 px-6 rounded-full font-black uppercase text-[9px] tracking-widest gap-2",
                  rangeType === 'custom' ? "bg-primary border-none shadow-lg shadow-primary/20" : "bg-white dark:bg-zinc-900"
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Custom
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-[2rem] border-none shadow-3xl" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                    setRangeType('custom');
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <Button onClick={handlePrint} variant="outline" className="flex-1 lg:flex-none h-12 rounded-xl font-black uppercase text-[9px] tracking-widest gap-3 border-2">
            <Printer className="w-4 h-4" /> Print Report
          </Button>
          <Button onClick={handleExport} variant="outline" className="flex-1 lg:flex-none h-12 rounded-xl font-black uppercase text-[9px] tracking-widest gap-3 border-2 bg-zinc-950 text-white hover:bg-zinc-800">
            <Download className="w-4 h-4" /> Export Excel
          </Button>
        </div>
      </div>

      {/* PRINT HEADER */}
      <div className="hidden print:block text-center space-y-4 mb-12">
         <h1 className="text-4xl font-black font-headline uppercase tracking-tighter italic">EZZY BITES <span className="text-primary">OPS</span></h1>
         <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">Operational Intelligence Report</p>
         <div className="bg-zinc-100 p-4 rounded-2xl border-2 border-dashed">
            <p className="text-xs font-black uppercase tracking-widest">Selected Range: {format(intervals.current.from, 'PPP')} - {format(intervals.current.to, 'PPP')}</p>
         </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          label="Gross Revenue" 
          value={`₹${metrics.current.revenue.toLocaleString()}`} 
          trend={metrics.trends.revenue} 
          icon={IndianRupee} 
          color="text-emerald-500" 
          bg="bg-emerald-50" 
        />
        <KPICard 
          label="Total Tickets" 
          value={metrics.current.total} 
          trend={metrics.trends.orders} 
          icon={Zap} 
          color="text-primary" 
          bg="bg-primary/5" 
        />
        <KPICard 
          label="Active Node IDs" 
          value={metrics.current.customers} 
          trend={metrics.trends.customers} 
          icon={Users} 
          color="text-blue-500" 
          bg="bg-blue-50" 
        />
        <KPICard 
          label="Avg. Density" 
          value={`₹${metrics.current.aov}`} 
          trend={metrics.trends.aov} 
          icon={Target} 
          color="text-orange-500" 
          bg="bg-orange-50" 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* CHART NODE */}
        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 md:p-12 flex flex-col h-full overflow-hidden relative">
          <CardHeader className="px-0 pt-0 pb-10 flex flex-row items-center justify-between border-b border-dashed mb-10">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black font-headline uppercase tracking-tighter italic">Operational <span className="text-primary">Velocity</span></CardTitle>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Period Transaction Performance</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 font-black text-[9px] uppercase tracking-widest rounded-full">Live Signal</Badge>
          </CardHeader>
          <div className="flex-1 min-h-[400px]">
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

        {/* STATUS LEDGER */}
        <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10 space-y-12">
          <div className="space-y-1">
            <h4 className="text-2xl font-black font-headline uppercase tracking-tighter italic">Status <span className="text-primary">Ledger</span></h4>
            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">Real-time Node Distribution</p>
          </div>
          <div className="space-y-8">
             <MetricBar label="Delivered" count={metrics.current.delivered} total={metrics.current.total} color="bg-emerald-500" icon={ShoppingBag} />
             <MetricBar label="In Cooking" count={metrics.current.preparing} total={metrics.current.total} color="bg-orange-500" icon={ChefHat} />
             <MetricBar label="Pending Hub" count={metrics.current.pending} total={metrics.current.total} color="bg-primary" icon={BellRing} />
             <MetricBar label="Rejected" count={metrics.current.cancelled} total={metrics.current.total} color="bg-rose-500" icon={Ban} />
          </div>
        </Card>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, icon: Icon, trend, color, bg }: any) => {
  const isPositive = trend >= 0;
  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-8 group hover:scale-[1.03] transition-all duration-500 overflow-hidden relative border">
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-secondary/30 rounded-full blur-2xl group-hover:bg-primary/5 transition-colors" />
      <div className="flex justify-between items-start mb-8">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner relative z-10", bg, color)}>
          <Icon className="w-7 h-7" />
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-tight",
          isPositive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
        )}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="relative z-10 space-y-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{label}</p>
        <h3 className="text-4xl font-black font-headline tracking-tighter italic leading-none">{value}</h3>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mt-2">vs previous period</p>
      </div>
    </Card>
  );
};

const MetricBar = ({ label, count, total, color, icon: Icon }: any) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color.replace('bg-', 'bg-') + '/10', color.replace('bg-', 'text-'))}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
        </div>
        <span className="font-mono text-xs font-black">{count} <span className="opacity-30 ml-1 text-[9px]">({percentage}%)</span></span>
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