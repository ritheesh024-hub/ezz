'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  MessageSquare, 
  Trash2, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  Loader2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

export const ReviewManager = () => {
  const db = useFirestore();
  const [search, setSearch] = useState('');

  const reviewsQuery = useMemo(() => {
    if (!db) return null;
    // Simple query to avoid index errors on first load
    return query(collection(db, 'reviews'), limit(100));
  }, [db]);

  const { data: reviews, loading, error: reviewsError } = useCollection<any>(reviewsQuery);

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    return reviews.filter(r => 
      (r.userName || '').toLowerCase().includes(search.toLowerCase()) || 
      (r.productName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.comment || '').toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
       const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
       const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
       return dateB - dateA;
    });
  }, [reviews, search]);

  const toggleHideReview = async (id: string, currentHidden: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'reviews', id), { isHidden: !currentHidden });
      toast({ title: currentHidden ? "Review Visible" : "Review Hidden" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const toggleFeatureReview = async (id: string, currentFeatured: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'reviews', id), { isFeatured: !currentFeatured });
      toast({ title: currentFeatured ? "Unfeatured" : "Featured on top" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter italic">Voice of <span className="text-primary">Customers</span></h2>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">Audit feedback, handle disputes, and highlight excellence.</p>
        </div>
      </div>

      <div className="flex bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border shadow-sm items-center gap-6">
         <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
            <Input 
               placeholder="Search by customer name, product or content..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="h-14 pl-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold text-base"
            />
         </div>
         <Badge variant="outline" className="h-14 px-6 rounded-2xl bg-secondary/50 border-none font-black uppercase text-[10px] tracking-widest items-center flex gap-3">
            <MessageSquare className="w-4 h-4 text-primary" /> {filteredReviews.length} Submissions
         </Badge>
      </div>

      {loading ? (
        <div className="py-40 text-center">
           <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20 mx-auto mb-6" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Connecting Sentiment Node...</p>
        </div>
      ) : (reviewsError || filteredReviews.length === 0) ? (
        <div className="py-32 text-center bg-white dark:bg-zinc-900 rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center gap-6 opacity-30">
           {reviewsError ? <AlertCircle className="w-20 h-20 text-destructive" /> : <MessageSquare className="w-20 h-20" />}
           <div className="space-y-1">
             <h3 className="text-2xl font-black uppercase tracking-widest">{reviewsError ? 'Sync Error' : 'Feed Empty'}</h3>
             {reviewsError && <p className="text-[10px] font-bold uppercase">Index registration required in console.</p>}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredReviews.map((rev) => (
            <Card key={rev.id} className={cn(
              "rounded-[3rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden transition-all relative group hover:shadow-2xl",
              rev.isHidden && "opacity-50"
            )}>
              <CardContent className="p-10 space-y-8">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                       <Avatar className="h-14 w-14 rounded-2xl shadow-xl border-4 border-white dark:border-zinc-800">
                          <AvatarImage src={rev.userPhoto} />
                          <AvatarFallback className="bg-primary/10 text-primary font-black">{(rev.userName || 'EB').slice(0, 2).toUpperCase()}</AvatarFallback>
                       </Avatar>
                       <div>
                          <p className="text-lg font-black uppercase tracking-tighter italic leading-none mb-1">{rev.userName}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">{rev.createdAt?.toDate ? format(rev.createdAt.toDate(), 'MMM dd, hh:mm a') : 'Recent'}</p>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className="flex gap-1 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("w-4 h-4", s <= rev.rating ? "fill-primary text-primary" : "text-muted dark:text-zinc-700")} />)}
                       </div>
                       <Badge className="bg-primary/5 text-primary border-none text-[8px] font-black uppercase px-2">{rev.productName}</Badge>
                    </div>
                 </div>

                 <p className="text-lg font-medium leading-relaxed italic text-muted-foreground">
                   "{rev.comment}"
                 </p>

                 <div className="flex items-center justify-between pt-8 border-t border-dashed border-zinc-100 dark:border-zinc-800">
                    <div className="flex gap-3">
                       <Button 
                          onClick={() => toggleHideReview(rev.id, rev.isHidden)}
                          variant="outline" 
                          className={cn("h-11 rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 border-2", rev.isHidden ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100")}
                       >
                          {rev.isHidden ? <><Eye className="w-4 h-4" /> Unhide</> : <><EyeOff className="w-4 h-4" /> Hide Review</>}
                       </Button>
                       <Button 
                          onClick={() => toggleFeatureReview(rev.id, rev.isFeatured)}
                          variant="outline" 
                          className={cn("h-11 rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 border-2", rev.isFeatured ? "bg-primary text-white border-primary" : "hover:border-primary hover:text-primary")}
                       >
                          <TrendingUp className="w-4 h-4" /> {rev.isFeatured ? 'Featured' : 'Feature Review'}
                       </Button>
                    </div>
                    <Badge variant="outline" className="font-mono text-[8px] font-black uppercase border-none opacity-20">ID: {rev.orderId}</Badge>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
