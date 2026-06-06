'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Search, Loader2, 
  CalendarDays, Mail, Phone,
  Clock, ShieldCheck, UserCircle2,
  Download, Filter, ArrowUpDown
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export const UserManagement = () => {
  const db = useFirestore();
  const usersQuery = useMemo(() => db ? query(collection(db, 'users'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: users, loading } = useCollection<any>(usersQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'new'>('all');

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [users, searchQuery]);

  const handleExportUsers = () => {
    if (!filteredUsers.length) return;
    const headers = ["Name", "Email", "Phone", "Registration Date", "Order Count"];
    const rows = filteredUsers.map(u => [
      u.name || 'Anonymous',
      u.email || 'N/A',
      u.phone || 'N/A',
      u.createdAt?.toDate ? format(u.createdAt.toDate(), 'yyyy-MM-dd') : 'N/A',
      u.orderCount || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EzzyBites_Users_Audit_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter">Customer <span className="text-primary italic">Base</span></h2>
          <p className="text-muted-foreground text-sm font-medium">Monitor user activity, preferences, and retention trends.</p>
        </div>
        <Button onClick={handleExportUsers} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          <Download className="w-4 h-4" /> Export User Audit
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="h-12 pl-12 rounded-xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold" 
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Badge variant="outline" className="h-12 px-5 rounded-xl bg-secondary/30 border-none font-black uppercase text-[9px] tracking-widest items-center flex gap-2">
             <Users className="w-3 h-3" /> {filteredUsers.length} Total
          </Badge>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-40 text-center space-y-4">
              <Loader2 className="animate-spin mx-auto w-12 h-12 text-primary" />
              <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Syncing Database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/10 dark:bg-zinc-800 border-b">
                  <tr className="text-[10px] font-black uppercase text-muted-foreground text-left">
                    <th className="px-8 py-6">Customer Profile</th>
                    <th className="px-8 py-6">Verification</th>
                    <th className="px-8 py-6">Engagement</th>
                    <th className="px-8 py-6">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center opacity-30">
                        <UserCircle2 className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">No users matched your search</p>
                      </td>
                    </tr>
                  ) : filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-secondary/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 rounded-2xl shadow-md border-2 border-background shrink-0">
                            <AvatarImage src={u.photoUrl} alt={u.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-black">
                              {(u.name || 'EB').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-sm group-hover:text-primary transition-colors truncate">{u.name || 'Anonymous Guest'}</span>
                            <span className="text-[9px] font-medium opacity-50 truncate flex items-center gap-1.5">
                               <Mail className="w-2.5 h-2.5" /> {u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                               <ShieldCheck className={cn("w-3.5 h-3.5", u.email ? "text-green-500" : "text-zinc-300")} />
                               <span className="text-[9px] font-black uppercase">{u.email ? 'Email Verified' : 'Guest Identity'}</span>
                            </div>
                            {u.phone && (
                              <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1.5">
                                <Phone className="w-2.5 h-2.5" /> +91 {u.phone}
                              </p>
                            )}
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col gap-1">
                            <Badge variant="secondary" className="w-fit px-2 py-0.5 font-black text-[8px] uppercase">
                               {u.orderCount || 0} Orders Placed
                            </Badge>
                            {u.lastOrderAt && (
                              <p className="text-[8px] font-medium opacity-50 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> Active: {format(u.lastOrderAt.toDate(), 'MMM d, yyyy')}
                              </p>
                            )}
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground/60">
                           <CalendarDays className="w-3 h-3" />
                           {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'MMM d, yyyy') : 'Pre-launch'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
