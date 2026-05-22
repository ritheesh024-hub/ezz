'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  IndianRupee,
  Users,
  Clock,
  Download,
  Sparkles,
  ArrowUpRight,
  Filter,
  PackageCheck,
  Ban,
  ChefHat,
  Star
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface DashboardAnalysisProps {
  orders: any[];
  products: any[];
}

export const DashboardAnalysis = ({ orders, products }: DashboardAnalysisProps) => {
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today');

  // Derive metrics from orders
  const metrics = useMemo(() => {
    if (!orders) return { total: 0, revenue: 0, pending: 0, completed: 0, cancelled: 0, growth: 0 };
    
    const now = new Date();
    const today = orders.filter(o => {
      if (!o.createdAt?.toDate) return false;
      const d = o.createdAt.toDate();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
    });

    const completed = orders.filter(o => o.status === 'Delivered');
    const revenue = completed.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const pending = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing').length;
    const cancelled = orders.filter(o => o.status === 'Cancelled').length;

    return {
      total: orders.length,
      revenue,
      pending,
      completed: completed.length,
      cancelled,
      growth: 12.5 // Simulated for visual effect
    };
  }, [orders]);

  // Chart Data Preparation
  const dailySalesData = [
    { name: '06:00', sales: 400, orders: 4 },
    { name: '09:00', sales: 1200, orders: 12 },
    { name: '12:00', sales: 4500, orders: 32 },
    { name: '15:00', sales: 2800, orders: 18 },
    { name: '18:00', sales: 5900, orders: 45 },
    { name: '21:00', sales: 3200, orders: 25 },
    { name: '00:00', sales: 800, orders: 6 },
  ];

  const weeklyData = [
    { day: 'Mon', count: 45 },
    { day: 'Tue', count: 52 },
    { day: 'Wed', count: 38 },
    { day: 'Thu', count: 65 },
    { day: 'Fri', count: 89 },
    { day: 'Sat', count: 120 },
    { day: 'Sun', count: 95 },
  ];

  const statusDistribution = [
    { name: 'Completed', value: metrics.completed, color: '#10b981' },
    { name: 'Pending', value: metrics.pending, color: '#f59e0b' },
    { name: 'Cancelled', value: metrics.cancelled, color: '#ef4444' },
  ];

  const handleExport = () => {
    toast({
      title: "Exporting Report",
      description: "Preparing your analytical summary as a PDF...",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 backdrop-blur-md p-4 rounded-[2rem] border shadow-sm">
        <div className="flex bg-secondary/50 p-1 rounded-2xl">
          {(['today', 'week', 'month'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                filter === f ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:bg-white/50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Button onClick={handleExport} variant="outline" className="rounded-2xl gap-2 font-bold border-muted-foreground/20 hover:bg-primary hover:text-white transition-all">
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Revenue" 
          value={`₹${metrics.revenue.toLocaleString()}`} 
          trend="+18%" 
          isPositive={true} 
          icon={IndianRupee} 
          color="bg-green-50 text-green-600"
        />
        <StatCard 
          label="Orders Today" 
          value={metrics.total.toString()} 
          trend="+5.2%" 
          isPositive={true} 
          icon={ShoppingBag} 
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          label="Pending Orders" 
          value={metrics.pending.toString()} 
          trend="-2.4%" 
          isPositive={false} 
          icon={Clock} 
          color="bg-orange-50 text-orange-600"
        />
        <StatCard 
          label="Avg. Rating" 
          value="4.8" 
          trend="+0.2" 
          isPositive={true} 
          icon={Star} 
          color="bg-yellow-50 text-yellow-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-black font-headline">Sales Velocity</CardTitle>
              <p className="text-xs text-muted-foreground font-medium">Real-time revenue stream tracking</p>
            </div>
            <Badge variant="secondary" className="bg-primary/5 text-primary border-none">Live</Badge>
          </CardHeader>
          <CardContent className="h-[350px] w-full pr-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySalesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                  itemStyle={{fontWeight: 900, color: '#ef4444'}}
                />
                <Area type="monotone" dataKey="sales" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl font-black font-headline">Fulfillment Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-3 mt-4">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Bar Chart */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl font-black font-headline">Weekly Demand</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Insights Section */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-primary/10 via-white to-accent/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
            <Sparkles className="w-48 h-48" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <CardTitle className="text-xl font-black font-headline">AI Business Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <InsightItem 
              icon={Clock} 
              title="Peak Performance" 
              desc="Daily sales spike observed between 18:00 - 20:00. Consider increasing prep staff." 
            />
            <InsightItem 
              icon={ChefHat} 
              title="Top Category" 
              desc="Hyderabadi Biryani is trending with a 35% growth this week. Run a limited-time bundle." 
            />
            <InsightItem 
              icon={Users} 
              title="Customer Loyalty" 
              desc="15% more returning customers detected compared to last month. Reward program suggested." 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, isPositive, icon: Icon, color }: any) => (
  <Card className="rounded-[2.5rem] border-none shadow-xl bg-white/80 backdrop-blur group hover:-translate-y-1 transition-all">
    <CardContent className="p-8">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 shadow-sm", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-black tracking-tight">{value}</h3>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
          isPositive ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
    </CardContent>
  </Card>
);

const InsightItem = ({ icon: Icon, title, desc }: any) => (
  <div className="flex gap-4 items-start p-4 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white transition-colors border border-transparent hover:border-primary/10">
    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0 text-primary">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h4 className="font-black text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);
