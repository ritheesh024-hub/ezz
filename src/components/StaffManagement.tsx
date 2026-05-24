
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserPlus, Trash2, 
  ShieldCheck, Receipt, ChefHat,
  Loader2, Mail, Lock, Search,
  MoreVertical, Edit3, Power, Eye,
  Calendar, Smartphone, Activity,
  AlertCircle, ChevronRight, CheckCircle2,
  XCircle, Filter, Ban, RefreshCcw
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { StaffRole } from '@/app/admin/dashboard/page';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const StaffManagement = () => {
  const db = useFirestore();
  const auth = getAuth();
  const staffQuery = query(collection(db!, 'admins'));
  const { data: staffList, loading } = useCollection<any>(staffQuery);

  // States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [alertAction, setAlertAction] = useState<{ type: 'delete' | 'disable' | 'enable', staffId: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'cashier' as StaffRole,
    photoUrl: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  // Handlers
  const handleAddStaff = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name, Email and Password are required." });
      return;
    }

    setSubmitting(true);
    try {
      const newStaffId = `staff-${Date.now()}`;
      await setDoc(doc(db!, 'admins', newStaffId), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        role: formData.role,
        status: 'active',
        onlineStatus: 'offline',
        photoUrl: formData.photoUrl || `https://picsum.photos/seed/${newStaffId}/200`,
        createdAt: serverTimestamp(),
        lastLoginAt: null,
        stats: {
          ordersHandled: 0,
          billsGenerated: 0,
          kitchenUpdates: 0
        }
      });

      toast({ title: "Staff member added successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to add staff", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff || !db) return;
    setSubmitting(true);
    try {
      const staffRef = doc(db, 'admins', selectedStaff.id);
      await updateDoc(staffRef, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        photoUrl: formData.photoUrl
      });
      toast({ title: "Profile updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAlertConfirm = async () => {
    if (!alertAction || !db) return;
    const { type, staffId } = alertAction;
    
    try {
      const staffRef = doc(db, 'admins', staffId);
      if (type === 'delete') {
        await deleteDoc(staffRef);
        toast({ title: "Staff member removed permanently" });
      } else if (type === 'disable') {
        await updateDoc(staffRef, { status: 'disabled', onlineStatus: 'offline' });
        toast({ title: "Account disabled" });
      } else if (type === 'enable') {
        await updateDoc(staffRef, { status: 'active' });
        toast({ title: "Account re-enabled" });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action failed", description: e.message });
    } finally {
      setIsAlertDialogOpen(false);
      setAlertAction(null);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Reset link sent", description: "Instructions sent to staff email." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to send reset email", description: e.message });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'cashier',
      photoUrl: ''
    });
  };

  const openEdit = (staff: any) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      password: '', // Password can't be fetched
      phone: staff.phone || '',
      role: staff.role,
      photoUrl: staff.photoUrl || ''
    });
    setIsEditDialogOpen(true);
  };

  const openProfile = (staff: any) => {
    setSelectedStaff(staff);
    setIsProfileDialogOpen(true);
  };

  const triggerAlert = (type: 'delete' | 'disable' | 'enable', staffId: string) => {
    setAlertAction({ type, staffId });
    setIsAlertDialogOpen(true);
  };

  const getRoleIcon = (role: StaffRole) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="w-4 h-4 text-primary" />;
      case 'cashier': return <Receipt className="w-4 h-4 text-blue-500" />;
      case 'kitchen': return <ChefHat className="w-4 h-4 text-orange-500" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 font-black text-[8px] uppercase">Active</Badge>
      : <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-3 font-black text-[8px] uppercase">Disabled</Badge>;
  };

  const getOnlineStatus = (status: string) => {
    switch (status) {
      case 'online': return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[9px] font-black uppercase tracking-widest text-green-600">Online</span></div>;
      case 'busy': return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-[9px] font-black uppercase tracking-widest text-orange-600">Busy</span></div>;
      default: return <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-300" /><span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Offline</span></div>;
    }
  };

  const filteredStaff = useMemo(() => {
    return staffList?.filter(s => {
      const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-headline uppercase tracking-tighter">Staff <span className="text-primary italic">Directory</span></h2>
          <p className="text-muted-foreground text-sm font-medium">Configure roles, monitor performance, and manage access.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          <UserPlus className="w-5 h-5" /> Add New Staff
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 rounded-xl border-none bg-secondary/30 font-bold"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-12 w-full lg:w-40 rounded-xl bg-secondary/30 border-none font-black uppercase text-[9px] tracking-widest">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="cashier">Cashiers</SelectItem>
              <SelectItem value="kitchen">Kitchen</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 w-full lg:w-40 rounded-xl bg-secondary/30 border-none font-black uppercase text-[9px] tracking-widest">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="disabled">Disabled Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-40 text-center space-y-4">
              <Loader2 className="animate-spin mx-auto w-12 h-12 text-primary" />
              <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Synchronizing team data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead className="bg-secondary/10 border-b">
                  <tr className="text-[10px] font-black uppercase text-muted-foreground text-left">
                    <th className="px-8 py-6">Staff Member</th>
                    <th className="px-8 py-6">Role</th>
                    <th className="px-8 py-6">Availability</th>
                    <th className="px-8 py-6">Account Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStaff?.map((staff) => (
                    <tr key={staff.id} className="hover:bg-secondary/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 rounded-2xl shadow-md">
                            <AvatarImage src={staff.photoUrl} alt={staff.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-black">{staff.name?.slice(0, 2).toUpperCase() || 'EB'}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-black text-sm group-hover:text-primary transition-colors">{staff.name || 'Staff User'}</span>
                            <span className="text-[10px] font-medium opacity-50">{staff.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant="outline" className="rounded-full px-4 py-1.5 gap-2 border-muted bg-zinc-50 dark:bg-zinc-800 text-foreground font-black uppercase text-[9px] tracking-widest">
                          {getRoleIcon(staff.role as StaffRole)}
                          {staff.role}
                        </Badge>
                      </td>
                      <td className="px-8 py-6">
                        {getOnlineStatus(staff.onlineStatus)}
                      </td>
                      <td className="px-8 py-6">
                        {getStatusBadge(staff.status)}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary"><MoreVertical className="w-5 h-5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest opacity-40 px-3 py-2">Quick Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openProfile(staff)} className="rounded-xl gap-3 py-3 font-bold"><Eye className="w-4 h-4" /> View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(staff)} className="rounded-xl gap-3 py-3 font-bold"><Edit3 className="w-4 h-4" /> Edit Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest opacity-40 px-3 py-2">Security</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleResetPassword(staff.email)} className="rounded-xl gap-3 py-3 font-bold"><RefreshCcw className="w-4 h-4 text-blue-500" /> Reset Password</DropdownMenuItem>
                            {staff.status === 'active' ? (
                              <DropdownMenuItem onClick={() => triggerAlert('disable', staff.id)} className="rounded-xl gap-3 py-3 font-bold text-orange-600"><Ban className="w-4 h-4" /> Disable Account</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => triggerAlert('enable', staff.id)} className="rounded-xl gap-3 py-3 font-bold text-green-600"><CheckCircle2 className="w-4 h-4" /> Enable Account</DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => triggerAlert('delete', staff.id)} className="rounded-xl gap-3 py-3 font-bold text-destructive"><Trash2 className="w-4 h-4" /> Delete Permanently</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStaff?.length === 0 && (
                <div className="p-40 text-center space-y-6">
                  <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-12 h-12 text-muted-foreground opacity-30" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black font-headline uppercase">No Team Members Found</h3>
                    <p className="text-muted-foreground font-medium">Try adjusting your filters or search terms.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-10 border-none bg-white dark:bg-zinc-900 shadow-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-headline uppercase tracking-tighter">New <span className="text-primary italic">Recruit</span></DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">Register a new team member to the Ezzy Bites operational directory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Full Legal Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-14 rounded-xl border-muted bg-secondary/20 font-bold" placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-14 pl-12 rounded-xl border-muted bg-secondary/20 font-bold" placeholder="name@ezzybites.com" />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Operational Role</Label>
                <Select value={formData.role} onValueChange={(v: StaffRole) => setFormData({...formData, role: v})}>
                  <SelectTrigger className="h-14 rounded-xl bg-secondary/20 border-muted font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="cashier">Billing Cashier</SelectItem>
                    <SelectItem value="kitchen">Kitchen Chef</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Initial Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="h-14 pl-12 rounded-xl border-muted bg-secondary/20 font-bold" placeholder="••••••••" />
                </div>
              </div>
            </div>
            <Button className="w-full h-18 rounded-2xl font-black text-lg bg-primary mt-4 shadow-xl shadow-primary/20" onClick={handleAddStaff} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin w-6 h-6" /> : 'Confirm Registration'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-10 border-none bg-white dark:bg-zinc-900 shadow-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black font-headline uppercase tracking-tighter">Edit <span className="text-primary italic">Profile</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-8">
             <div className="flex justify-center mb-6">
               <Avatar className="h-24 w-24 rounded-3xl shadow-xl ring-4 ring-primary/10">
                 <AvatarImage src={formData.photoUrl} />
                 <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl">{formData.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
               </Avatar>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Photo URL</Label>
                <Input value={formData.photoUrl} onChange={(e) => setFormData({...formData, photoUrl: e.target.value})} className="h-14 rounded-xl border-muted bg-secondary/20 font-bold" />
             </div>
             <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-14 rounded-xl border-muted bg-secondary/20 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Mobile</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-14 rounded-xl border-muted bg-secondary/20 font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Operational Role</Label>
              <Select value={formData.role} onValueChange={(v: StaffRole) => setFormData({...formData, role: v})}>
                <SelectTrigger className="h-14 rounded-xl bg-secondary/20 border-muted font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="cashier">Billing Cashier</SelectItem>
                  <SelectItem value="kitchen">Kitchen Chef</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-18 rounded-2xl font-black text-lg bg-primary mt-4" onClick={handleUpdateStaff} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin w-6 h-6" /> : 'Update Access Control'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Details Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none bg-white dark:bg-zinc-900 shadow-3xl">
          <DialogHeader className="sr-only"><DialogTitle>Staff Profile - {selectedStaff?.name}</DialogTitle></DialogHeader>
          {selectedStaff && (
            <div className="flex flex-col">
              <div className="relative h-48 bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute -bottom-12 left-10">
                  <Avatar className="h-32 w-32 rounded-[2.5rem] border-8 border-white dark:border-zinc-900 shadow-2xl">
                    <AvatarImage src={selectedStaff.photoUrl} />
                    <AvatarFallback className="bg-primary/20 text-primary font-black text-3xl">{selectedStaff.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <div className="pt-16 px-10 pb-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black font-headline tracking-tighter uppercase">{selectedStaff.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">{selectedStaff.role}</Badge>
                      {getOnlineStatus(selectedStaff.onlineStatus)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase opacity-40">Account ID</p>
                    <p className="font-mono text-xs font-bold">{selectedStaff.id?.slice(0, 10)}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-secondary/20 dark:bg-zinc-800 p-5 rounded-3xl space-y-1">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-2">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <p className="text-[9px] font-black uppercase opacity-40">Orders Handled</p>
                    <p className="text-2xl font-black italic">{selectedStaff.stats?.ordersHandled || 0}</p>
                  </div>
                  <div className="bg-secondary/20 dark:bg-zinc-800 p-5 rounded-3xl space-y-1">
                    <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-2">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <p className="text-[9px] font-black uppercase opacity-40">Bills Generated</p>
                    <p className="text-2xl font-black italic">{selectedStaff.stats?.billsGenerated || 0}</p>
                  </div>
                  <div className="bg-secondary/20 dark:bg-zinc-800 p-5 rounded-3xl space-y-1">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 mb-2">
                      <ChefHat className="w-4 h-4" />
                    </div>
                    <p className="text-[9px] font-black uppercase opacity-40">Kitchen Updates</p>
                    <p className="text-2xl font-black italic">{selectedStaff.stats?.kitchenUpdates || 0}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5" /> Contact Information
                    </h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold opacity-60">Email</span>
                        <span className="font-black">{selectedStaff.email}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold opacity-60">Phone</span>
                        <span className="font-black">{selectedStaff.phone || 'Not Provided'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" /> System Logs
                    </h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold opacity-60">Joined</span>
                        <span className="font-black">{selectedStaff.createdAt?.toDate ? selectedStaff.createdAt.toDate().toLocaleDateString() : 'Initial'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold opacity-60">Last Login</span>
                        <span className="font-black">{selectedStaff.lastLoginAt?.toDate ? selectedStaff.lastLoginAt.toDate().toLocaleTimeString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-3xl bg-white dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tighter flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              Security Check
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-base mt-4 leading-relaxed">
              {alertAction?.type === 'delete' && "You are about to PERMANENTLY delete this staff member. This action cannot be undone and will revoke all access immediately."}
              {alertAction?.type === 'disable' && "Disabling this account will prevent the user from logging in or accessing any dashboard tools until manually re-enabled."}
              {alertAction?.type === 'enable' && "You are re-enabling this account. The user will be able to log in with their existing credentials immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2">Cancel Operation</AlertDialogCancel>
            <AlertDialogAction onClick={handleAlertConfirm} className={cn(
              "h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest",
              alertAction?.type === 'delete' ? "bg-destructive text-white" : "bg-primary text-white"
            )}>
              Confirm & Execute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
