'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Save, Phone, Mail, User, MapPin } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useSmartPermissions } from '@/hooks/use-smart-permissions';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { user } = useUser();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { requestSmartly } = useSmartPermissions();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    photoUrl: ''
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user || !db || !isOpen) return;
      
      setFetching(true);
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            name: data.name || user.displayName || '',
            phone: data.phone || '',
            email: data.email || user.email || '',
            address: data.address || '',
            photoUrl: data.photoUrl || user.photoURL || ''
          });
        } else {
          setFormData({
            name: user.displayName || '',
            email: user.email || '',
            phone: '',
            address: '',
            photoUrl: user.photoURL || ''
          });
        }
      } catch (e) {
        console.error("Profile load failed", e);
      } finally {
        setFetching(false);
      }
    }

    loadProfile();
  }, [user, db, isOpen]);

  const handleImageClick = async () => {
    // Smart Trigger: Request camera/storage access before file selection
    await requestSmartly('camera');
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ 
          variant: "destructive", 
          title: "File too large", 
          description: "Please select an image smaller than 2MB." 
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user || !db) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        photoUrl: formData.photoUrl,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, updateData, { merge: true });
      
      toast({ title: "Profile Updated", description: "Your details have been successfully saved." });
      onClose();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-zinc-950 max-h-[90vh] flex flex-col">
        <div className="p-8 bg-primary text-white shrink-0 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-headline uppercase tracking-tighter relative z-10">
              Edit <span className="italic opacity-80">Profile</span>
            </DialogTitle>
            <DialogDescription className="text-white/70 font-medium text-xs uppercase tracking-widest relative z-10">
              Personalize your account details
            </DialogDescription>
          </DialogHeader>
        </div>

        {fetching ? (
          <div className="p-20 text-center space-y-4 flex-1">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Connecting to Cloud...</p>
          </div>
        ) : (
          <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide flex-1">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative group cursor-pointer" 
                onClick={handleImageClick}
              >
                <Avatar className="w-32 h-32 rounded-[2.5rem] border-4 border-primary/20 shadow-2xl transition-transform group-hover:scale-105">
                  <AvatarImage src={formData.photoUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-3xl">
                    {formData.name.slice(0, 2).toUpperCase() || 'EB'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 p-2.5 bg-primary text-white rounded-2xl shadow-xl border-4 border-white dark:border-zinc-950 hover:bg-primary/90 transition-colors">
                  <Camera className="w-5 h-5" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40 text-center">Tap to change photo</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60 flex items-center gap-2">
                  <User className="w-3 h-3" /> Full Name
                </Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold px-6 focus:ring-2 focus:ring-primary/20"
                  placeholder="Your Name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Mobile Number
                  </Label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                    className="h-14 rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-bold px-6"
                    placeholder="10-digit mobile"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email Address
                  </Label>
                  <Input 
                    value={formData.email} 
                    disabled
                    className="h-14 rounded-2xl border-none bg-secondary/10 dark:bg-zinc-900/50 font-medium px-6 opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-60 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Delivery Address
                </Label>
                <Textarea 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="min-h-[100px] rounded-2xl border-none bg-secondary/30 dark:bg-zinc-800 font-medium px-6 py-4"
                  placeholder="Street, Building, Area..."
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="p-8 bg-secondary/10 shrink-0">
          <Button 
            onClick={handleSave}
            disabled={loading || fetching}
            className="w-full h-16 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20 gap-3 bg-primary"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <Save className="w-5 h-5" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
