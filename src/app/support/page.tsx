
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, onSnapshot, arrayUnion, limit } from 'firebase/firestore';
import { 
  LifeBuoy, 
  Package, 
  CreditCard, 
  Truck, 
  Utensils, 
  MessageSquare, 
  HelpCircle, 
  Phone, 
  ChevronRight, 
  Loader2, 
  Send,
  History,
  Star,
  ArrowLeft,
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

type SupportView = 'home' | 'categories' | 'order_select' | 'form' | 'tickets' | 'feedback' | 'chat';

export default function SupportPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  const [view, setView] = useState<SupportView>('home');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Queries
  const ordersQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
  }, [db, user]);

  const ticketsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, 'support_tickets'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: recentOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: myTickets, loading: ticketsLoading } = useCollection<any>(ticketsQuery);

  const supportCategories = [
    { id: 'order', label: 'Order Issues', icon: Package, color: 'bg-primary/10 text-primary', desc: 'Missing items, wrong items, or delays' },
    { id: 'payment', label: 'Payment Issues', icon: CreditCard, color: 'bg-blue-100 text-blue-600', desc: 'Failed payments or refund status' },
    { id: 'delivery', label: 'Delivery Issues', icon: Truck, color: 'bg-emerald-100 text-emerald-600', desc: 'Rider delays or logistics issues' },
    { id: 'food', label: 'Food Quality', icon: Utensils, color: 'bg-orange-100 text-orange-600', desc: 'Taste, hygiene, or cold food' },
    { id: 'feedback', label: 'Feedback', icon: Star, color: 'bg-purple-100 text-purple-600', desc: 'Share your experience' },
    { id: 'general', label: 'General Enquiry', icon: HelpCircle, color: 'bg-zinc-100 text-zinc-600', desc: 'General questions' }
  ];

  const handleCategorySelect = (cat: any) => {
    setSelectedCategory(cat);
    if (cat.id === 'order') setView('order_select');
    else if (cat.id === 'feedback') setView('feedback');
    else setView('form');
  };

  const createTicket = async () => {
    if (!db || !user || !message.trim()) return;
    setSubmitting(true);
    try {
      const ticketData = {
        userId: user.uid,
        userName: user.displayName || 'Guest',
        userEmail: user.email || '',
        category: selectedCategory.label,
        subCategory: 'General Support',
        orderId: selectedOrder?.orderId || null,
        message: message.trim(),
        status: 'Open',
        priority: 'Medium',
        replies: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'support_tickets'), ticketData);
      
      // Notify User Node
      await addDoc(collection(db, 'user_notifications', user.uid, 'items'), {
        title: 'Support Ticket Raised 🎫',
        message: `Your ticket for ${selectedCategory.label} has been recorded. Ticket ID: ${docRef.id.slice(0, 6)}`,
        type: 'system',
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Ticket Created Successfully", description: "Our team will sync with you shortly." });
      setView('tickets');
      setMessage('');
      setSelectedOrder(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!db || !user || !message.trim() || !activeTicket) return;
    const ticketRef = doc(db, 'support_tickets', activeTicket.id);
    const reply = {
      senderId: user.uid,
      senderName: user.displayName || 'Member',
      isAdmin: false,
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      await updateDoc(ticketRef, {
        replies: arrayUnion(reply),
        updatedAt: serverTimestamp(),
        status: 'Open' // Reset to open if user replies
      });
      setMessage('');
    } catch (e) {
      toast({ variant: "destructive", title: "Reply Failed" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Closed': return 'bg-zinc-100 text-zinc-500';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  if (userLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 max-w-2xl">
        
        {/* HEADER */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                 <LifeBuoy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black font-headline uppercase tracking-tighter italic">Help <span className="text-primary">& Support</span></h1>
                <p className="text-muted-foreground text-xs font-medium tracking-tight">Quantum Support Logic v2.5</p>
              </div>
           </div>
           
           <div className="flex gap-2">
             <Button 
               variant={view === 'home' || view === 'categories' ? 'default' : 'outline'} 
               onClick={() => setView('home')}
               className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest h-10"
             >
               Resolution Hub
             </Button>
             <Button 
               variant={view === 'tickets' ? 'default' : 'outline'} 
               onClick={() => setView('tickets')}
               className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest h-10"
             >
               My Tickets {myTickets.length > 0 && <span className="ml-2 bg-white text-primary rounded-full w-4 h-4 flex items-center justify-center text-[8px]">{myTickets.length}</span>}
             </Button>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {/* VIEW: HOME / CATEGORIES */}
          {(view === 'home' || view === 'categories') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5"><LifeBuoy className="w-48 h-48 rotate-12" /></div>
                 <h2 className="text-2xl font-black uppercase tracking-tight italic leading-tight mb-8">Hi {user?.displayName?.split(' ')[0]} 👋 <br />How can we <span className="text-primary">help you</span> today?</h2>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {supportCategories.map((cat) => (
                      <Card 
                        key={cat.id} 
                        onClick={() => handleCategorySelect(cat)}
                        className="rounded-3xl border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer group bg-zinc-50 dark:bg-zinc-800/50"
                      >
                        <CardContent className="p-5 flex items-center gap-4">
                           <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", cat.color)}>
                              <cat.icon className="w-6 h-6" />
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{cat.label}</h4>
                              <p className="text-[10px] font-medium text-muted-foreground line-clamp-1">{cat.desc}</p>
                           </div>
                        </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-zinc-950 text-white p-8 group overflow-hidden relative">
                 <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                 <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-2">
                       <h4 className="font-black text-lg uppercase tracking-tight">Direct Hotline</h4>
                       <p className="text-[10px] font-medium text-white/50 leading-relaxed uppercase tracking-widest">Instant communication node available <span className="text-white font-black">24/7</span></p>
                    </div>
                    <Button onClick={() => window.open('tel:8639366800')} className="rounded-2xl h-12 px-6 bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all">
                       <Phone className="w-4 h-4 mr-2" /> Call Now
                    </Button>
                 </div>
              </Card>
            </motion.div>
          )}

          {/* VIEW: ORDER SELECTION */}
          {view === 'order_select' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
               <button onClick={() => setView('home')} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Categories
               </button>
               <h3 className="text-xl font-black uppercase italic">Select affected <span className="text-primary">Order</span></h3>
               <div className="space-y-4">
                 {ordersLoading ? (
                    <div className="py-20 text-center opacity-20"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
                 ) : recentOrders.length === 0 ? (
                    <div className="p-10 bg-white rounded-3xl text-center space-y-4 border border-dashed">
                       <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground opacity-20" />
                       <p className="text-[10px] font-black uppercase text-muted-foreground">No recent orders found on this node</p>
                    </div>
                 ) : recentOrders.map((ord: any) => (
                    <Card 
                      key={ord.id} 
                      onClick={() => { setSelectedOrder(ord); setView('form'); }}
                      className="rounded-3xl border shadow-sm hover:shadow-xl transition-all cursor-pointer group bg-white dark:bg-zinc-900"
                    >
                      <CardContent className="p-6 flex items-center justify-between">
                         <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                               <Package className="w-6 h-6" />
                            </div>
                            <div>
                               <p className="font-black text-[10px] uppercase text-primary">Ticket #{ord.orderId}</p>
                               <p className="text-sm font-bold truncate max-w-[150px]">{ord.items?.[0]?.name} {ord.items?.length > 1 && `+ ${ord.items.length - 1} more`}</p>
                               <p className="text-[9px] font-bold text-muted-foreground uppercase">{format(ord.createdAt?.toDate ? ord.createdAt.toDate() : new Date(), 'dd MMM yyyy')}</p>
                            </div>
                         </div>
                         <ChevronRight className="w-5 h-5 text-muted-foreground opacity-20 group-hover:translate-x-1 transition-all" />
                      </CardContent>
                    </Card>
                 ))}
               </div>
            </motion.div>
          )}

          {/* VIEW: TICKET FORM */}
          {view === 'form' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
               <button onClick={() => setView(selectedCategory.id === 'order' ? 'order_select' : 'home')} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Subject
               </button>
               
               <Card className="rounded-[3rem] border-none shadow-2xl bg-white dark:bg-zinc-900 p-10 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><MessageSquare className="w-48 h-48" /></div>
                  <div className="relative z-10 space-y-8">
                     <div className="space-y-1">
                        <Badge className={cn("px-4 py-1 rounded-full border-none font-black text-[9px] uppercase tracking-widest mb-2", selectedCategory.color)}>
                          {selectedCategory.label}
                        </Badge>
                        {selectedOrder && (
                          <div className="bg-secondary/50 p-4 rounded-2xl border flex items-center gap-3">
                             <Package className="w-4 h-4 text-primary" />
                             <span className="text-[10px] font-black uppercase">Active Context: Ticket #{selectedOrder.orderId}</span>
                          </div>
                        )}
                        <h3 className="text-2xl font-black uppercase tracking-tight italic">Relay your <span className="text-primary">concern</span></h3>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Message Description</Label>
                           <Textarea 
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Please describe the issue in detail for high-speed resolution..." 
                              className="min-h-[160px] rounded-[2rem] bg-secondary/30 dark:bg-zinc-800 border-none px-6 py-6 font-medium text-lg leading-relaxed focus:ring-4 focus:ring-primary/10"
                           />
                        </div>
                        <Button 
                           onClick={createTicket}
                           disabled={submitting || !message.trim()}
                           className="w-full h-18 rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.2em] bg-primary text-white shadow-2xl shadow-primary/30 gap-3"
                        >
                           {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> Launch Ticket</>}
                        </Button>
                     </div>
                  </div>
               </Card>
            </motion.div>
          )}

          {/* VIEW: MY TICKETS */}
          {view === 'tickets' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
               <h3 className="text-xl font-black uppercase italic">Active <span className="text-primary">Ledger</span></h3>
               <div className="space-y-4">
                 {ticketsLoading ? (
                    <div className="py-20 text-center opacity-20"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
                 ) : myTickets.length === 0 ? (
                    <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed shadow-xl">
                       <History className="w-16 h-16 mx-auto text-muted-foreground opacity-10 mb-4" />
                       <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Identity support history is clear</p>
                       <Button variant="outline" className="mt-8 rounded-full font-black text-[9px] uppercase tracking-widest border-2" onClick={() => setView('home')}>Get Help</Button>
                    </div>
                 ) : myTickets.map((ticket: any) => (
                    <Card 
                      key={ticket.id} 
                      onClick={() => { setActiveTicket(ticket); setView('chat'); }}
                      className="rounded-3xl border shadow-sm hover:shadow-xl transition-all cursor-pointer group bg-white dark:bg-zinc-900 border-l-[6px] border-l-primary"
                    >
                       <CardContent className="p-6 flex justify-between items-center">
                          <div className="flex gap-5 items-start">
                             <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                                <MessageSquare className="w-6 h-6 text-primary" />
                             </div>
                             <div className="min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                   <p className="font-black text-[10px] uppercase text-primary">#{ticket.id.slice(0, 8)}</p>
                                   <Badge className={cn("px-2 py-0.5 border-none font-black text-[7px] uppercase rounded-md shadow-sm", getStatusColor(ticket.status))}>
                                      {ticket.status}
                                   </Badge>
                                </div>
                                <p className="text-sm font-black uppercase tracking-tight truncate max-w-[200px]">{ticket.category}</p>
                                <p className="text-[9px] font-medium text-muted-foreground line-clamp-1 italic">"{ticket.message}"</p>
                             </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                             <ChevronRight className="w-5 h-5 text-muted-foreground opacity-20 group-hover:translate-x-1 transition-all" />
                             {ticket.replies?.length > 0 && <Badge className="bg-primary text-white text-[7px] p-0 w-4 h-4 flex items-center justify-center rounded-full animate-pulse">{ticket.replies.length}</Badge>}
                          </div>
                       </CardContent>
                    </Card>
                 ))}
               </div>
            </motion.div>
          )}

          {/* VIEW: CHAT INTERFACE */}
          {view === 'chat' && activeTicket && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-[70vh]">
               <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setView('tickets')} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Ledger
                  </button>
                  <Badge className={cn("px-4 py-1 font-black text-[9px] uppercase tracking-widest", getStatusColor(activeTicket.status))}>
                     Node: {activeTicket.status}
                  </Badge>
               </div>

               <Card className="flex-1 flex flex-col rounded-[2.5rem] border-none shadow-3xl bg-white dark:bg-zinc-900 overflow-hidden mb-6">
                  <div className="p-6 border-b bg-secondary/20 flex flex-col gap-2">
                     <p className="text-[9px] font-black uppercase tracking-widest text-primary">Identity Transcript #{activeTicket.id.slice(0, 8)}</p>
                     <h4 className="font-black text-sm uppercase">{activeTicket.category}</h4>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-zinc-50/50 dark:bg-zinc-950/20">
                     {/* Initial Message */}
                     <div className="flex flex-col items-start max-w-[85%]">
                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-[1.5rem] rounded-tl-none shadow-sm border">
                           <p className="text-sm font-medium leading-relaxed">{activeTicket.message}</p>
                        </div>
                        <span className="text-[7px] font-black uppercase opacity-30 mt-2 ml-1">SYSTEM INTAKE</span>
                     </div>

                     {activeTicket.replies?.map((reply: any, i: number) => (
                        <div key={i} className={cn("flex flex-col max-w-[85%]", reply.isAdmin ? "items-start" : "items-end ml-auto")}>
                           <div className={cn(
                              "p-4 rounded-[1.5rem] shadow-sm",
                              reply.isAdmin ? "bg-zinc-950 text-white rounded-tl-none" : "bg-primary text-white rounded-tr-none"
                           )}>
                              <p className="text-sm font-medium leading-relaxed">{reply.message}</p>
                           </div>
                           <span className={cn("text-[7px] font-black uppercase opacity-30 mt-2 mx-1", reply.isAdmin ? "text-primary" : "")}>
                              {reply.isAdmin ? 'STATION SUPPORT' : 'YOU'} — {reply.createdAt ? format(new Date(reply.createdAt), 'hh:mm a') : 'Now'}
                           </span>
                        </div>
                     ))}
                  </div>

                  <div className="p-6 bg-white dark:bg-zinc-900 border-t">
                     {activeTicket.status === 'Closed' ? (
                        <div className="py-4 text-center">
                           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">This protocol has been terminated</p>
                        </div>
                     ) : (
                        <div className="flex gap-3">
                           <Input 
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Relay signal..." 
                              className="h-14 rounded-2xl bg-secondary/50 border-none font-bold px-6"
                              onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                           />
                           <Button 
                              onClick={sendReply}
                              disabled={!message.trim()}
                              className="h-14 w-14 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 p-0"
                           >
                              <Send className="w-6 h-6" />
                           </Button>
                        </div>
                     )}
                  </div>
               </Card>
            </motion.div>
          )}

          {/* VIEW: FEEDBACK FORM */}
          {view === 'feedback' && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <button onClick={() => setView('home')} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
               </button>

               <Card className="rounded-[3rem] border-none shadow-2xl bg-white dark:bg-zinc-900 p-10 text-center space-y-10">
                  <div className="space-y-2">
                     <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                        <Star className="w-10 h-10 fill-current" />
                     </div>
                     <h3 className="text-3xl font-black font-headline uppercase tracking-tighter italic leading-none pt-4">Quantum <span className="text-purple-600">Feedback</span></h3>
                     <p className="text-muted-foreground text-sm font-medium">Your data signals improve our operational density.</p>
                  </div>

                  <div className="space-y-8">
                     <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-3">
                           {[1, 2, 3, 4, 5].map((s) => (
                              <button 
                                 key={s} 
                                 onClick={() => setMessage(s.toString())}
                                 className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all transform active:scale-90", message === s.toString() ? "bg-purple-600 text-white shadow-xl" : "bg-secondary text-muted-foreground hover:bg-purple-50")}
                              >
                                 <Star className={cn("w-6 h-6", message === s.toString() ? "fill-current" : "")} />
                              </button>
                           ))}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Overall Satisfaction Node</p>
                     </div>

                     <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Comments (Optional)</Label>
                        <Textarea 
                           placeholder="Tell us about your experience..." 
                           className="min-h-[120px] rounded-[2rem] bg-secondary/30 dark:bg-zinc-800 border-none px-6 py-6 font-medium"
                        />
                     </div>

                     <Button 
                        onClick={async () => {
                           if (!db || !user) return;
                           setSubmitting(true);
                           await addDoc(collection(db, 'feedbacks'), {
                              userId: user.uid,
                              userName: user.displayName,
                              rating: Number(message) || 5,
                              createdAt: serverTimestamp()
                           });
                           toast({ title: "Feedback Sync Successful" });
                           setSubmitting(false);
                           setView('home');
                        }}
                        disabled={submitting}
                        className="w-full h-18 rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.2em] bg-purple-600 text-white shadow-2xl shadow-purple-600/30"
                     >
                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Settle Feedback'}
                     </Button>
                  </div>
               </Card>
             </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-16 text-center">
           <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20">Ezzy Bites • Quantum Support Cluster v4.2</p>
        </div>
      </main>
    </div>
  );
}
