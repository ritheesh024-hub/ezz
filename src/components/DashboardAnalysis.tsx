'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  Star,
  ChevronDown,
  Download,
  Zap
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { isWithinInterval, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

type FilterType = 'today' | 'yesterday' | 'currentMonth' | 'lastMonth';

export const DashboardAnalysis = ({ orders, products }: DashboardAnalysisProps) => {
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const dateRange = useMemo(() => {
    if (!isMounted) return { start: new Date(), end: new Date() };
    const now = new Date();
    switch (filterType) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday': { const d = subDays(now, 1); return { start: startOfDay(d), end: endOfDay(d) }; }
      case 'currentMonth': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth': { const d = subMonths(now, 1); return { start: startOfMonth(d), end: endOfMonth(d) }; }
      default: return { start: startOfDay(now), end: endOfDay(now) };
    }
  }, [filterType, isMounted]);

  const filteredOrders = useMemo(() => {
    if (!orders || !isMounted) return [];
    return orders.filter(o => {
      if (!o.createdAt?.toDate) return false;
      return isWithinInterval(o.createdAt.toDate(), { start: dateRange.start, end: dateRange.end });
    });
  }, [orders, dateRange, isMounted]);

  const metrics = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status === 'Delivered');
    const revenue = completed.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const pending = filteredOrders.filter(o => ['Pending', 'Preparing'].includes(o.status)).length;

    return { total: filteredOrders.length, revenue, pending, completed: completed.length };
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    return [
      { name: '08:00', sales: metrics.revenue * 0.1 },
      { name: '12:00', sales: metrics.revenue * 0.3 },
      { name: '16:00', sales: metrics.revenue * 0.25 },
      { name: '20:00', sales: metrics.revenue * 0.35 },
    ];
  }, [metrics]);

  if (!isMounted) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* FILTER BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-4 rounded-[2.5rem] shadow-sm border">
        <div className="flex bg-secondary/40 p-1.5 rounded-full w-full lg:w-auto">
          {['today', 'yesterday'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as FilterType)}
              className={cn(
                "px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                filterType === type ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:bg-white/40"
              )}
            >
              {type}
            </button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                (filterType.includes('Month')) ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
              )}>
                History <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-2xl p-2 min-w-[200px] shadow-2xl">
              <DropdownMenuItem onClick={() => setFilterType('currentMonth')} className="rounded-xl font-bold uppercase text-[9px] py-3">This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('lastMonth')} className="rounded-xl font-bold uppercase text-[9px] py-3">Last Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button className="w-full lg:w-auto h-12 px-10 rounded-full font-black text-[10px] uppercase bg-primary gap-3 shadow-xl shadow-primary/20">
          <Download className="w-4 h-4" /> Generate Report
        </Button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard label="Net Revenue" value={`₹${metrics.revenue}`} icon={IndianRupee} color="text-primary bg-primary/10" />
        <MetricCard label="Total Orders" value={metrics.total} icon={ShoppingBag} color="text-blue-600 bg-blue-50" />
        <MetricCard label="Kitchen Load" value={metrics.pending} icon={Clock} color="text-orange-500 bg-orange-50" />
        <MetricCard label="Performance" value="4.9" icon={Zap} color="text-yellow-600 bg-yellow-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-xl bg-white p-8">
          <CardHeader className="px-0 pb-10">
            <CardTitle className="text-2xl font-black font-headline uppercase tracking-tighter">Revenue Velocity</CardTitle>
          </CardHeader>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="sales" stroke="#ef4444" strokeWidth={5} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[3rem] border-none shadow-xl bg-white p-8">
          <CardHeader className="px-0 pb-10">
            <CardTitle className="text-2xl font-black font-headline uppercase tracking-tighter">Status Mix</CardTitle>
          </CardHeader>
          <div className="h-[300px] flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Done', value: metrics.completed, color: '#ef4444' },
                    { name: 'Active', value: metrics.pending, color: '#f59e0b' }
                  ].filter(i => i.value > 0)} 
                  innerRadius={65} 
                  outerRadius={90} 
                  dataKey="value"
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-4 mt-8">
              <StatusRow label="Fulfilled" val={metrics.completed} color="bg-primary" />
              <StatusRow label="Active" val={metrics.pending} color="bg-orange-500" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color }: any) => (
  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 hover:scale-[1.02] transition-transform">
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", color)}>
      <Icon className="w-7 h-7" />
    </div>
    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
    <h3 className="text-4xl font-black tracking-tighter">{value}</h3>
  </Card>
);

const StatusRow = ({ label, val, color }: any) => (
  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
    <div className="flex items-center gap-3">
      <div className={cn("w-3 h-3 rounded-full", color)} />
      <span className="opacity-60">{label}</span>
    </div>
    <span>{val} Units</span>
  </div>
);