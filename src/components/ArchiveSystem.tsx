'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Search, 
  Eye, 
  Filter, 
  Download, 
  Loader2, 
  ShoppingBag,
  Clock,
  User,
  CheckCircle2,
  Ban,
  Utensils,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ArchiveSystemProps {
  orders: any[];
  onViewDetails: (order: any) => void;
}

export const ArchiveSystem = ({ orders, onViewDetails }: ArchiveSystemProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone?.includes(searchQuery);
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'delivered' && o.status === 'delivered') ||
        (statusFilter === 'Cancelled' && o.status === 'Cancelled');

      const matchesType = 
        typeFilter === 'all' || 
        (typeFilter === 'Online' && !o.isStoreBill) ||
        (typeFilter === 'Dine-In' && o.orderType === 'Dine-In') ||
        (typeFilter === 'Take Away' && o.orderType === 'Take Away');

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [orders, searchQuery, statusFilter, typeFilter]);

  const handleExport = () => {
    const headers = ["OrderID", "Customer", "Phone", "Type", "Status", "Amount", "Date"];
    const rows = filteredOrders.map(o => [
      o.orderId,
      o.customerName,
      o.customerPhone,
      o.orderType || 'Online',
      o.status,
      o.total,
      o.createdAt?.toDate ? format(o.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EzzyBites_Order_Archive_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic text-zinc-400">Order <span className="text-primary">Archive</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Full historical ledger of all past transactions and terminal states.</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="h-16 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 border-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
          <Download className="w-5 h-5" /> Export Data Node
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
            <Input 
              placeholder="Search by Ticket ID, Customer or Mobile..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="h-14 pl-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold text-base" 
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
             <select 
               value={statusFilter} 
               onChange={(e) => setStatusFilter(e.target.value)}
               className="h-14 px-6 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-black uppercase text-[9px] tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
             >
               <option value="all">All States</option>
               <option value="delivered">Delivered</option>
               <option value="Cancelled">Cancelled</option>
             </select>
             <select 
               value={typeFilter} 
               onChange={(e) => setTypeFilter(e.target.value)}
               className="h-14 px-6 rounded-2xl bg-secondary/30 dark:bg-zinc-800 border-none font-black uppercase text-[9px] tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
             >
               <option value="all">All Types</option>
               <option value="Online">Online Delivery</option>
               <option value="Dine-In">Dine-In</option>
               <option value="Take Away">Take Away</option>
             </select>
          </div>
        </div>
      </div>

      <Card className="rounded-[3rem] border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden border">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <tr className="text-[10px] font-black uppercase text-muted-foreground text-left tracking-[0.2em]">
                <th className="px-10 py-6">Identity Ticker</th>
                <th className="px-10 py-6">Recipient Entity</th>
                <th className="px-10 py-6">Fulfillment</th>
                <th className="px-10 py-6">Gross Sum</th>
                <th className="px-10 py-6 text-right">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center opacity-10">
                    <History className="w-20 h-20 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-[0.4em] text-sm italic">No Archive Records Match</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-primary/5 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-primary italic">#{order.orderId}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 opacity-30" />
                          <span className="text-[8px] font-bold opacity-40 uppercase">
                            {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM dd, hh:mm a') : 'Legacy'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-muted-foreground opacity-40" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm uppercase tracking-tight truncate group-hover:text-primary transition-colors">{order.customerName || 'Anonymous'}</p>
                          <p className="text-[9px] font-bold opacity-40">{order.customerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                       <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {order.orderType === 'Dine-In' ? <Utensils className="w-3 h-3 text-blue-500" /> : <Package className="w-3 h-3 text-orange-500" />}
                            <span className="text-[9px] font-black uppercase tracking-widest">{order.orderType || 'Online'}</span>
                          </div>
                          <Badge className={cn(
                            "border-none px-2 py-0.5 rounded text-[7px] font-black uppercase w-fit",
                            order.status === 'delivered' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {order.status === 'delivered' ? 'DELIVERED' : 'CANCELLED'}
                          </Badge>
                       </div>
                    </td>
                    <td className="px-10 py-6">
                       <p className="font-black text-xl text-zinc-900 dark:text-white italic leading-none">₹{order.total}</p>
                       <p className="text-[8px] font-black uppercase opacity-30 mt-1">{order.items?.length || 0} Units</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={() => onViewDetails(order)}
                         className="h-10 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 hover:bg-primary hover:text-white transition-all"
                       >
                         <Eye className="w-4 h-4" /> Manifest
                       </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
