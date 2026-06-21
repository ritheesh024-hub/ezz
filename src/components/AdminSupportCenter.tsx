
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  LifeBuoy, 
  Loader2, 
  Search, 
  Star, 
  CheckCircle2, 
  Clock, 
  User, 
  Send,
  MoreVertical,
  Flag,
  ArrowRight,
  Package,
  Inbox,
  LayoutDashboard,
  Filter
} from 'lucide-react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, serverTimestamp, arrayUnion, addDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const AdminSupportCenter = () => {
  const db = useFirestore();
  const { user: staffUser } = useUser();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Open');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ticketsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'support_tickets'), orderBy('updatedAt', 'desc'), limit(100));
  }, [db]);

  const feedbackQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(50));
  }, [db]);

  const { data: tickets, loading: ticketsLoading } = useCollection<any>(ticketsQuery);
  const { data: feedbacks, loading: feedbackLoading } = useCollection<any>(feedbackQuery);

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => {
      const matchesSearch = t.userName?.toLowerCase().includes(search.toLowerCase()) || 
                           t.message?.toLowerCase().includes(search.toLowerCase()) ||
                           t.id?.includes(search);
      const matchesTab = t.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [tickets, search, activeTab]);

  const handleReply = async () => {
    if (!db || !staffUser || !replyMessage.trim() || !selectedTicket) return;
    setSubmitting(true);
    const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
    const reply = {
      senderId: staffUser.uid,
      senderName: staffUser.displayName || 'Support Hub',
      isAdmin: true,
      message: replyMessage.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(ticketRef, {
        replies: arrayUnion(reply),
        updatedAt: serverTimestamp(),
        status: 'In Progress'
      });

      // Send User Notification
      await addDoc(collection(db, 'user_notifications', selectedTicket.userId, 'items'), {
        title: 'Support Replied 🎧',
        message: `Our team has responded to your ticket #${selectedTicket.id.slice(0, 6)}`,
        type: 'system',
        ctaLink: '/support',
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Reply Dispatched" });
      setReplyMessage('');
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    if (!db) return;
    const ticketRef = doc(db, 'support_tickets', id);
    try {
      await updateDoc(ticketRef, { status, updatedAt: serverTimestamp() });
      
      // Notify User if resolved
      if (status === 'Resolved') {
        const ticket = tickets.find(t => t.id === id);
        if (ticket) {
          await addDoc(collection(db, 'user_notifications', ticket.userId, 'items'), {
            title: 'Issue Resolved ✅',
            message: `Your support ticket #${id.slice(0, 6)} has been marked as resolved.`,
            type: 'system',
            ctaLink: '/support',
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
      
      toast({ title: `Ticket marked as ${status}` });
      if (selectedTicket?.id === id) setSelectedTicket(prev => ({ ...prev, status }));
    } catch (e) {
      toast({ variant: "destructive", title: "Status Update Failed" });
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Urgent': return 'bg-rose-100 text-rose-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Medium': return 'bg-blue-100 text-blue-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic">Support <span className="text-primary">Center</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Enterprise customer resolution hub and platform feedback audit.</p>
        </div>
      </div>

      <Tabs defaultValue="Open" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
           <TabsList className="bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border shadow-sm w-fit overflow-x-auto scrollbar-hide">
              {['Open', 'In Progress', 'Resolved', 'Closed', 'Feedback'].map(tab => (
                 <TabsTrigger 
                   key={tab} 
                   value={tab}
                   className="px-8 py-3 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                 >
                   {tab}
                 </TabsTrigger>
              ))}
           </TabsList>
           
           {activeTab !== 'Feedback' && (
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                <Input 
                   placeholder="Search tickets by ID, name or message..." 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="h-12 pl-10 rounded-xl bg-white border-none shadow-sm font-bold"
                />
             </div>
           )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <TabsContent value={activeTab} className="m-0 outline-none">
                 {activeTab === 'Feedback' ? (
                    <FeedbackGrid feedbacks={feedbacks} loading={feedbackLoading} />
                 ) : (
                    <TicketList 
                      tickets={filteredTickets} 
                      loading={ticketsLoading} 
                      selectedId={selectedTicket?.id} 
                      onSelect={setSelectedTicket} 
                    />
                 )}
              </TabsContent>
           </div>

           <div className="relative">
              {activeTab !== 'Feedback' && (
                 <div className="sticky top-24">
                    {selectedTicket ? (
                       <TicketDetailView 
                          ticket={selectedTicket} 
                          replyMessage={replyMessage}
                          setReplyMessage={setReplyMessage}
                          handleReply={handleReply}
                          submitting={submitting}
                          onStatusUpdate={updateTicketStatus}
                       />
                    ) : (
                       <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 p-10 text-center space-y-6">
                          <Inbox className="w-16 h-16 mx-auto text-muted-foreground opacity-10" />
                          <div className="space-y-1">
                             <h4 className="text-xl font-black uppercase tracking-tight italic">No Selection</h4>
                             <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-relaxed">Select a ticket from the ledger to initiate resolution logic.</p>
                          </div>
                       </Card>
                    )}
                 </div>
              )}
           </div>
        </div>
      </Tabs>
    </div>
  );
};

const TicketList = ({ tickets, loading, selectedId, onSelect }: any) => {
  if (loading) return <div className="py-40 text-center opacity-20"><Loader2 className="w-12 h-12 animate-spin mx-auto" /></div>;
  if (tickets.length === 0) return (
     <div className="py-40 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-muted">
        <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground opacity-10 mb-4" />
        <p className="font-black uppercase tracking-[0.4em] text-[10px] text-muted-foreground opacity-40">Operational queue clear</p>
     </div>
  );

  return (
    <div className="space-y-4">
       {tickets.map((t: any) => (
          <Card 
            key={t.id} 
            onClick={() => onSelect(t)}
            className={cn(
               "rounded-[1.8rem] border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden",
               selectedId === t.id ? "ring-2 ring-primary bg-white dark:bg-zinc-800 shadow-xl" : "bg-white dark:bg-zinc-900"
            )}
          >
             <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 rounded-xl shadow-md border-2 border-white dark:border-zinc-700">
                         <AvatarImage src={t.userPhoto} />
                         <AvatarFallback className="bg-primary/10 text-primary font-black">{(t.userName || 'EB').slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                         <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-0.5">#{t.id.slice(0, 8)}</p>
                         <h4 className="font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{t.userName}</h4>
                      </div>
                   </div>
                   <Badge className={cn("px-3 py-1 font-black text-[8px] uppercase tracking-widest border-none", 
                      t.priority === 'Urgent' ? 'bg-rose-500 text-white' : 
                      t.priority === 'High' ? 'bg-orange-500 text-white' : 'bg-secondary text-muted-foreground'
                   )}>
                      {t.priority}
                   </Badge>
                </div>
                
                <div className="space-y-3">
                   <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-secondary/50 border-none font-black text-[7px] uppercase px-2 py-0.5 rounded-md">{t.category}</Badge>
                      {t.orderId && <Badge variant="outline" className="bg-primary/5 text-primary border-none font-black text-[7px] uppercase px-2 py-0.5 rounded-md">Order #{t.orderId}</Badge>}
                   </div>
                   <p className="text-[11px] font-medium text-muted-foreground line-clamp-2 leading-relaxed italic">"{t.message}"</p>
                </div>

                <div className="mt-5 pt-5 border-t border-dashed flex justify-between items-center opacity-60">
                   <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                      <Clock className="w-3 h-3 text-primary" />
                      {t.updatedAt?.toDate ? format(t.updatedAt.toDate(), 'hh:mm a') : 'Now'}
                   </div>
                   <div className="flex items-center gap-3">
                      {t.replies?.length > 0 && (
                         <div className="flex items-center gap-1.5 text-[8px] font-black uppercase">
                            <MessageSquare className="w-3 h-3 text-blue-500" /> {t.replies.length} Signals
                         </div>
                      )}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                   </div>
                </div>
             </CardContent>
          </Card>
       ))}
    </div>
  );
};

const TicketDetailView = ({ ticket, replyMessage, setReplyMessage, handleReply, submitting, onStatusUpdate }: any) => {
  return (
    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden flex flex-col h-[75vh]">
       <div className="p-8 border-b bg-zinc-50 dark:bg-zinc-800/50 flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary italic">Identity Transcript #{ticket.id.slice(0, 8)}</p>
                <h4 className="font-black text-xl uppercase tracking-tighter italic leading-none">{ticket.userName}</h4>
                <p className="text-[10px] font-medium opacity-40">{ticket.userEmail}</p>
             </div>
             <Select defaultValue={ticket.status} onValueChange={(v) => onStatusUpdate(ticket.id, v)}>
                <SelectTrigger className="w-32 h-10 rounded-xl bg-white border-none shadow-sm font-black text-[9px] uppercase tracking-widest">
                   <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                   <SelectItem value="Open">OPEN</SelectItem>
                   <SelectItem value="In Progress">IN WORK</SelectItem>
                   <SelectItem value="Resolved">RESOLVED</SelectItem>
                   <SelectItem value="Closed">CLOSED</SelectItem>
                </SelectContent>
             </Select>
          </div>
          
          <div className="flex gap-3 items-center">
             <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-3 py-1 rounded-md">{ticket.category}</Badge>
             {ticket.orderId && <Badge className="bg-zinc-950 text-white border-none text-[8px] font-black uppercase px-3 py-1 rounded-md">Ticket #{ticket.orderId}</Badge>}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-zinc-50/30">
          <div className="flex flex-col items-start max-w-[90%]">
             <div className="bg-white dark:bg-zinc-800 p-6 rounded-[2rem] rounded-tl-none shadow-sm border border-zinc-100">
                <p className="text-sm font-medium leading-relaxed italic">"{ticket.message}"</p>
             </div>
             <span className="text-[8px] font-black uppercase tracking-widest opacity-30 mt-3 ml-2">USER ORIGINAL SIGNAL — {format(ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(), 'p')}</span>
          </div>

          {ticket.replies?.map((r: any, i: number) => (
             <div key={i} className={cn("flex flex-col max-w-[90%]", r.isAdmin ? "items-end ml-auto" : "items-start")}>
                <div className={cn(
                   "p-5 rounded-[1.8rem] shadow-md",
                   r.isAdmin ? "bg-zinc-950 text-white rounded-tr-none" : "bg-primary text-white rounded-tl-none"
                )}>
                   <p className="text-sm font-medium leading-relaxed">{r.message}</p>
                </div>
                <span className="text-[7px] font-black uppercase opacity-30 mt-2 mx-2">
                   {r.isAdmin ? 'STATION REPLY' : 'USER SIGNAL'} — {r.createdAt ? format(new Date(r.createdAt), 'hh:mm a') : 'Now'}
                </span>
             </div>
          ))}
       </div>

       <div className="p-8 border-t bg-white dark:bg-zinc-900">
          <div className="flex gap-3">
             <Input 
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Compose signal response..." 
                className="h-14 rounded-2xl bg-secondary/50 border-none font-bold px-6"
                onKeyDown={e => e.key === 'Enter' && handleReply()}
             />
             <Button 
                onClick={handleReply}
                disabled={submitting || !replyMessage.trim()}
                className="h-14 w-14 rounded-2xl bg-primary text-white shadow-2xl p-0 shrink-0"
             >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
             </Button>
          </div>
       </div>
    </Card>
  );
};

const FeedbackGrid = ({ feedbacks, loading }: any) => {
  if (loading) return <div className="py-40 text-center opacity-20"><Loader2 className="w-12 h-12 animate-spin mx-auto" /></div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       {feedbacks.map((f: any) => (
          <Card key={f.id} className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-8 hover:shadow-xl transition-all group">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                      <Star className="w-6 h-6 fill-current" />
                   </div>
                   <div>
                      <h4 className="font-black text-sm uppercase tracking-tight">{f.userName || 'Member'}</h4>
                      <p className="text-[8px] font-black text-muted-foreground uppercase opacity-40">{f.createdAt?.toDate ? format(f.createdAt.toDate(), 'dd MMM, hh:mm a') : 'Recent'}</p>
                   </div>
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-none px-3 py-1 font-black text-[10px] rounded-lg">{f.rating} / 5</Badge>
             </div>
             <p className="text-sm font-medium leading-relaxed italic text-muted-foreground group-hover:text-foreground transition-colors">
                "{f.comment || 'No qualitative data node provided.'}"
             </p>
          </Card>
       ))}
       {feedbacks.length === 0 && (
          <div className="col-span-full py-40 text-center opacity-10">
             <Star className="w-16 h-16 mx-auto mb-4" />
             <p className="font-black uppercase tracking-[0.4em] text-[10px]">Feedback register clear</p>
          </div>
       )}
    </div>
  );
};
