
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserPlus, Trash2, 
  ShieldCheck, Receipt, ChefHat,
  Loader2, Mail, Lock, Search
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { StaffRole } from '@/app/admin/dashboard/page';

export const StaffManagement = () => {
  const db = useFirestore();
  const staffQuery = query(collection(db!, 'admins'));
  const { data: staffList, loading } = useCollection<any>(staffQuery);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'cashier' as StaffRole,
  });
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddStaff = async () => {
    if (!formData.email || !formData.password) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    setAdding(true);
    try {
      // Note: In a real production app, you would use a Firebase Cloud Function 
      // to create users without logging out the current admin.
      // For this prototype, we simulate the database record creation.
      // We assume the user is already created in Auth or will be managed separately.
      
      const newStaffId = `staff-${Date.now()}`;
      await setDoc(doc(db!, 'admins', newStaffId), {
        email: formData.email,
        role: formData.role,
        createdAt: serverTimestamp()
      });

      toast({ title: "Staff member added successfully" });
      setIsAddDialogOpen(false);
      setFormData({ email: '', password: '', role: 'cashier' });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to add staff", description: error.message });
    } finally {
      setAdding(false);
    }
  };

  const removeStaff = async (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      await deleteDoc(doc(db!, 'admins', id));
      toast({ title: "Staff member removed" });
    }
  };

  const getRoleIcon = (role: StaffRole) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="w-4 h-4 text-primary" />;
      case 'cashier': return <Receipt className="w-4 h-4 text-blue-500" />;
      case 'kitchen': return <ChefHat className="w-4 h-4 text-orange-500" />;
    }
  };

  const filteredStaff = staffList?.filter(s => 
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black font-headline uppercase tracking-tighter">Team Management</h2>
          <p className="text-muted-foreground text-sm font-medium">Manage operational permissions and staff access.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-primary">
          <UserPlus className="w-5 h-5" /> Add New Staff
        </Button>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
        <CardHeader className="p-8 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by email or role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 rounded-xl bg-secondary/30 border-none font-bold"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/10 border-b">
                  <tr className="text-[10px] font-black uppercase text-muted-foreground text-left">
                    <th className="px-8 py-5">Staff Member</th>
                    <th className="px-8 py-5">Assigned Role</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStaff?.map((staff) => (
                    <tr key={staff.id} className="hover:bg-secondary/5 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Users className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-sm">{staff.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant="outline" className="rounded-full px-4 py-1.5 gap-2 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[9px] tracking-widest">
                          {getRoleIcon(staff.role as StaffRole)}
                          {staff.role}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => removeStaff(staff.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStaff?.length === 0 && (
                <div className="p-20 text-center opacity-30">
                  <Users className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-black uppercase text-xs tracking-widest">No matching staff records found</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none bg-white dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-headline uppercase tracking-tighter">Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  className="h-14 pl-12 rounded-xl border-muted bg-secondary/20"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Temporary Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  className="h-14 pl-12 rounded-xl border-muted bg-secondary/20"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Work Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v: StaffRole) => setFormData({...formData, role: v})}
              >
                <SelectTrigger className="h-14 rounded-xl bg-secondary/20 border-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl p-2">
                  <SelectItem value="admin" className="rounded-xl py-3 font-bold">Administrator</SelectItem>
                  <SelectItem value="cashier" className="rounded-xl py-3 font-bold">Billing Cashier</SelectItem>
                  <SelectItem value="kitchen" className="rounded-xl py-3 font-bold">Kitchen Chef</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full h-16 rounded-2xl font-black text-lg bg-primary mt-4" 
              onClick={handleAddStaff}
              disabled={adding}
            >
              {adding ? <Loader2 className="animate-spin w-6 h-6" /> : 'Register Team Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
