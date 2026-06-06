'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Search, 
  SlidersHorizontal, 
  Wallet, 
  AlertCircle, 
  UserCheck, 
  UserX, 
  User,
  Phone,
  Mail,
  Lock
} from 'lucide-react';

interface UserItem {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'user' | 'admin';
  kyc_status: 'pending' | 'verified' | 'rejected';
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  email: string;
  balance: number;
}

interface UsersClientProps {
  initialUsers: UserItem[];
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const router = useRouter();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [kycFilter, setKycFilter] = useState<string>('all');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Global actions loading
  const [loading, setLoading] = useState(false);

  // Add User Form state
  const [addForm, setAddForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user' as 'user' | 'admin'
  });

  // Edit User Form state
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user' as 'user' | 'admin',
    kyc_status: 'pending' as 'pending' | 'verified' | 'rejected'
  });

  // Wallet Adjustment Form state
  const [walletForm, setWalletForm] = useState({
    amount: '',
    type: 'credit' as 'credit' | 'debit',
    description: ''
  });

  // Helper formats
  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = initialUsers.length;
    const staff = initialUsers.filter(u => u.role === 'admin').length;
    const totalBalances = initialUsers.reduce((sum, u) => sum + u.balance, 0);
    const pendingKyc = initialUsers.filter(u => u.kyc_status === 'pending').length;

    return { total, staff, totalBalances, pendingKyc };
  }, [initialUsers]);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return initialUsers.filter(u => {
      const matchesSearch = 
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone && u.phone.includes(search)) ||
        u.referral_code.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesKyc = kycFilter === 'all' || u.kyc_status === kycFilter;

      return matchesSearch && matchesRole && matchesKyc;
    });
  }, [initialUsers, search, roleFilter, kycFilter]);

  // Add User Handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create user');

      setIsAddOpen(false);
      setAddForm({ email: '', password: '', first_name: '', last_name: '', phone: '', role: 'user' });
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred during account creation');
    } finally {
      setLoading(false);
    }
  };

  // Edit User Handler
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...editForm
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update user profile');

      setIsEditOpen(false);
      setSelectedUser(null);
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred during profile update');
    } finally {
      setLoading(false);
    }
  };

  // Wallet Adjustment Handler
  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    try {
      const amountVal = Number(walletForm.amount);
      const adjustmentAmount = walletForm.type === 'credit' ? amountVal : -amountVal;

      const response = await fetch('/api/admin/users/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: adjustmentAmount,
          description: walletForm.description
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to adjust wallet balance');

      setIsWalletOpen(false);
      setWalletForm({ amount: '', type: 'credit', description: '' });
      setSelectedUser(null);
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred adjusting user wallet balance');
    } finally {
      setLoading(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (user: UserItem) => {
    const doubleConfirm = confirm(`Are you sure you want to completely DELETE the account for ${user.first_name} ${user.last_name} (${user.email})? This action will permanently remove their profile and authentication login details.`);
    if (!doubleConfirm) return;

    try {
      const response = await fetch(`/api/admin/users?userId=${user.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete user');

      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred during account deletion');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">Users & Staff</h1>
          <p className="text-xs text-muted mt-1">Manage investor accounts, administrative roles, KYC statuses, and wallet ledger overrides.</p>
        </div>

        <button 
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add User/Staff</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-md">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total Members</span>
          <div className="text-2xl font-extrabold text-foreground font-mono mt-1">{stats.total}</div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border shadow-md">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Staff / Admins</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">{stats.staff}</div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border shadow-md">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total Wallet Balances</span>
          <div className="text-2xl font-extrabold text-foreground font-mono mt-1">{formatNaira(stats.totalBalances).replace('.00', '')}</div>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border shadow-md">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Pending KYC Checks</span>
          <div className="text-2xl font-extrabold text-amber-500 font-mono mt-1">{stats.pendingKyc}</div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by name, email, referral code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-muted text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Role Dropdown */}
          <select 
            title="Filter by Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-input border border-border text-xs text-foreground rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          >
            <option value="all">All Roles</option>
            <option value="user">Investors (Users)</option>
            <option value="admin">Administrators</option>
          </select>

          {/* KYC Status Dropdown */}
          <select 
            title="Filter by KYC Status"
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="bg-input border border-border text-xs text-foreground rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          >
            <option value="all">All KYC Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xl overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <p className="text-xs text-muted text-center py-8">No matching user records found.</p>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-muted border-b border-border pb-2">
                <th className="pb-3 pr-2">User / Email</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">KYC Status</th>
                <th className="pb-3">Referral Info</th>
                <th className="pb-3">Balance</th>
                <th className="pb-3">Joined</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="align-middle hover:bg-muted/10 transition-colors">
                  {/* Name and email */}
                  <td className="py-4 pr-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-input border border-border flex items-center justify-center font-bold text-emerald-400 text-xs flex-shrink-0 uppercase">
                        {(user.first_name?.[0] || '') + (user.last_name?.[0] || '') || 'U'}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-foreground truncate">{user.first_name} {user.last_name}</span>
                        <span className="block text-[10px] text-muted truncate">{user.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-4 text-foreground font-mono">
                    {user.phone || <span className="text-slate-600">—</span>}
                  </td>

                  {/* Role */}
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      user.role === 'admin' 
                        ? 'bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400' 
                        : 'bg-input border border-border text-muted'
                    }`}>
                      {user.role}
                    </span>
                  </td>

                  {/* KYC Status */}
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1 w-fit ${
                      user.kyc_status === 'verified' 
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : user.kyc_status === 'rejected'
                        ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {user.kyc_status === 'verified' ? <UserCheck className="w-2.5 h-2.5" /> : <UserX className="w-2.5 h-2.5" />}
                      <span>{user.kyc_status}</span>
                    </span>
                  </td>

                  {/* Referral code */}
                  <td className="py-4 font-mono text-muted">
                    <span className="block text-foreground font-bold">{user.referral_code}</span>
                    {user.referred_by && <span className="block text-[8px] text-muted">Referred</span>}
                  </td>

                  {/* Balance */}
                  <td className="py-4 font-mono font-semibold text-foreground">
                    {formatNaira(user.balance)}
                  </td>

                  {/* Created At */}
                  <td className="py-4 text-muted">
                    {formatDate(user.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Wallet override */}
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setWalletForm({ amount: '', type: 'credit', description: '' });
                          setIsWalletOpen(true);
                        }}
                        title="Adjust Wallet Balance"
                        className="p-1.5 rounded-lg bg-input border border-border text-muted hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit details */}
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setEditForm({
                            first_name: user.first_name,
                            last_name: user.last_name,
                            phone: user.phone || '',
                            role: user.role,
                            kyc_status: user.kyc_status
                          });
                          setIsEditOpen(true);
                        }}
                        title="Edit User Profile"
                        className="p-1.5 rounded-lg bg-input border border-border text-muted hover:text-foreground transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete account */}
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        title="Delete User Account"
                        className="p-1.5 rounded-lg bg-input border border-border text-muted hover:text-destructive hover:border-destructive/30 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Add User / Staff */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsAddOpen(false)}
              title="Close Modal"
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-input border border-border text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-foreground font-heading">Register User or Staff</h3>
              <p className="text-xs text-muted mt-1">Create a new auth user and setup role configurations.</p>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={addForm.first_name}
                      onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                      title="First Name"
                      className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                      placeholder="e.g. John"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={addForm.last_name}
                      onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                      title="Last Name"
                      className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                      placeholder="e.g. Doe"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input 
                    type="email" 
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    title="Email Address"
                    className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. user@domain.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input 
                    type="password" 
                    required
                    minLength={6}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    title="Password"
                    className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input 
                    type="text" 
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    title="Phone Number"
                    className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. +2348012345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Account Role Designation</label>
                <select 
                  title="Account Role"
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as 'user' | 'admin' })}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="user">Investor (User)</option>
                  <option value="admin">Administrator (Staff)</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Create Account</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User Profile */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => {
                setIsEditOpen(false);
                setSelectedUser(null);
              }}
              title="Close Modal"
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-input border border-border text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-foreground font-heading">Edit User Profile</h3>
              <p className="text-xs text-muted mt-1">Modify account details and system clearance level for `{selectedUser.email}`.</p>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    title="First Name"
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    title="Last Name"
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  title="Phone Number"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="e.g. +2348012345678"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">System Role</label>
                  <select 
                    title="Account Role"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'user' | 'admin' })}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="user">Investor (User)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">KYC Clearance</label>
                  <select 
                    title="KYC Clearance Status"
                    value={editForm.kyc_status}
                    onChange={(e) => setEditForm({ ...editForm, kyc_status: e.target.value as 'pending' | 'verified' | 'rejected' })}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected / Suspend</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Wallet Balance */}
      {isWalletOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => {
                setIsWalletOpen(false);
                setSelectedUser(null);
              }}
              title="Close Modal"
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-input border border-border text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-foreground font-heading">Manual Wallet Adjustment</h3>
              <p className="text-xs text-muted mt-1">
                Inject or debit funds manually on behalf of <span className="text-foreground font-semibold">{selectedUser.first_name} {selectedUser.last_name}</span>.
              </p>
            </div>

            {/* Current details */}
            <div className="p-4 rounded-xl bg-input border border-border flex justify-between items-center text-xs">
              <span className="text-muted">Current Balance:</span>
              <span className="font-mono font-bold text-emerald-400">{formatNaira(selectedUser.balance)}</span>
            </div>

            <form onSubmit={handleWalletAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Adjustment Type</label>
                  <select 
                    title="Adjustment Type"
                    value={walletForm.type}
                    onChange={(e) => setWalletForm({ ...walletForm, type: e.target.value as 'credit' | 'debit' })}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-bold"
                  >
                    <option value="credit" className="text-emerald-400 font-bold">Credit (+) Deposit</option>
                    <option value="debit" className="text-red-400 font-bold">Debit (-) Withdrawal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Adjustment Value (NGN)</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={walletForm.amount}
                    onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
                    title="Amount"
                    className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Auditable Reason / Explanation</label>
                <textarea 
                  required
                  rows={3}
                  value={walletForm.description}
                  onChange={(e) => setWalletForm({ ...walletForm, description: e.target.value })}
                  title="Reason"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary placeholder-slate-600 leading-normal"
                  placeholder="Explain why this ledger override is taking place. This will be shown to the user and saved in administration audit logs."
                />
              </div>

              {/* Warning label */}
              <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[9px] text-red-300/80 leading-normal">
                  Manual adjustments impact platform financial audits directly. Be absolutely sure the credit/debit values match actual wire/cash transactions.
                </p>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Perform Ledger Override</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}