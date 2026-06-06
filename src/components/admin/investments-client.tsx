'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search,
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Coins, 
  Calendar,
  Check
} from 'lucide-react';

export interface InvestmentItem {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  interest_rate: number;
  status: 'active' | 'completed' | 'early_termination_pending' | 'early_terminated';
  start_date: string;
  maturity_date: string;
  auto_reinvest: boolean;
  accrued_interest: number;
  user_email: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  investment_packages: {
    name: string;
    duration_days: number;
    annual_interest_rate: number;
  };
}

interface ProfileItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface PackageItem {
  id: string;
  name: string;
  amount: number;
}

interface InvestmentsClientProps {
  initialInvestments: InvestmentItem[];
  profiles: ProfileItem[];
  packages: PackageItem[];
}

export default function InvestmentsClient({ 
  initialInvestments, 
  profiles, 
  packages 
}: InvestmentsClientProps) {
  const router = useRouter();
  // Initialise once outside render — safe, no effect needed
  const [now] = useState<number>(() => Date.now());

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Selected Investment state
  const [selectedInv, setSelectedInv] = useState<InvestmentItem | null>(null);

  // Form states - Create Manual Investment
  const [createForm, setCreateForm] = useState({
    userId: '',
    packageId: '',
    amount: '',
    status: 'active',
    auto_reinvest: false
  });

  // Form states - Edit Investment
  const [editForm, setEditForm] = useState({
    status: 'active' as InvestmentItem['status'],
    accrued_interest: '',
    auto_reinvest: false
  });

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  // Filter investments based on query
  const filteredInvestments = initialInvestments.filter((inv) => {
    const matchesSearch = 
      `${inv.profiles?.first_name} ${inv.profiles?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.investment_packages?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handlePackageChange = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    setCreateForm({
      ...createForm,
      packageId,
      amount: pkg ? pkg.amount.toString() : ''
    });
  };

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: createForm.userId,
          packageId: createForm.packageId,
          amount: Number(createForm.amount),
          status: createForm.status,
          auto_reinvest: createForm.auto_reinvest
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to manually subscribe user');
      }

      setIsCreateOpen(false);
      setCreateForm({ userId: '', packageId: '', amount: '', status: 'active', auto_reinvest: false });
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred during subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv) return;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/investments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInv.id,
          status: editForm.status,
          accrued_interest: Number(editForm.accrued_interest),
          auto_reinvest: editForm.auto_reinvest
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update investment');
      }

      setIsEditOpen(false);
      setSelectedInv(null);
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred updating investment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investment record? This is a permanent delete from the database.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/investments?id=${id}`, {
        method: 'DELETE',
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to delete investment');
      }

      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred deleting investment');
    }
  };

  const handleApproveTermination = async (inv: InvestmentItem) => {
    const formattedAmt = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(inv.amount);
    
    const payout = inv.amount * 0.9;
    const formattedPayout = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(payout);

    if (!confirm(`Are you sure you want to APPROVE early termination for ${inv.profiles?.first_name} ${inv.profiles?.last_name}'s investment?\n\nOriginal Capital: ${formattedAmt}\nRefund Payout (90%): ${formattedPayout}\nPenalty (10%): ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(inv.amount * 0.1)}\n\nThis will credit their wallet immediately.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/investments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inv.id,
          status: 'early_terminated'
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to approve early termination');
      }

      alert('Early termination approved successfully! User wallet has been credited.');
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred during approval');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (startStr: string, endStr: string, status: string) => {
    if (status !== 'active') return 100;
    if (now === 0) return 0;
    
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();

    if (now >= end) return 100;
    if (now <= start) return 0;

    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.round((elapsed / total) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">User Investments</h1>
          <p className="text-xs text-muted mt-1">Audit, edit parameters, delete, or manually create investment subscriptions for users.</p>
        </div>

        <button 
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Manual Investment</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-card border border-border shadow-md">
        <div className="relative md:col-span-3">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by name, email, package..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter by status"
            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="early_termination_pending">Termination Pending</option>
            <option value="early_terminated">Early Terminated</option>
          </select>
        </div>
      </div>

      {/* Investments Table */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xl overflow-x-auto">
        {filteredInvestments.length === 0 ? (
          <p className="text-xs text-muted text-center py-8">No investment records found.</p>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-muted border-b border-border pb-2">
                <th className="pb-3">Investor</th>
                <th className="pb-3">Package / Amount</th>
                <th className="pb-3">Progress / Yield</th>
                <th className="pb-3">Terms (Start/Maturity)</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvestments.map((inv) => {
                const progress = calculateProgress(inv.start_date, inv.maturity_date, inv.status);
                
                return (
                  <tr key={inv.id} className="align-middle hover:bg-muted/10 transition-colors">
                    <td className="py-4">
                      <div className="font-bold text-foreground">
                        {inv.profiles?.first_name} {inv.profiles?.last_name}
                      </div>
                      <div className="text-[10px] text-muted font-mono mt-0.5">{inv.user_email}</div>
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{inv.investment_packages?.name || 'Manual Offer'}</span>
                      </div>
                      <div className="text-[10px] text-muted font-mono mt-0.5">{formatNaira(inv.amount)}</div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <progress 
                          title="Maturity Progress"
                          className={`w-20 h-1.5 rounded-full overflow-hidden border border-border [&::-webkit-progress-bar]:bg-input [&::-moz-progress-bar]:bg-emerald-400 ${
                            inv.status === 'completed' 
                              ? '[&::-webkit-progress-value]:bg-emerald-500' 
                              : '[&::-webkit-progress-value]:bg-emerald-400'
                          }`} 
                          value={progress} 
                          max="100"
                        />
                        <span className="font-mono text-[9px] text-muted">{progress}%</span>
                      </div>
                      <span className="text-[9px] text-emerald-400 block mt-1 font-semibold">
                        Yield: {formatNaira(inv.accrued_interest)} ({inv.interest_rate}%)
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1 text-[10px] text-muted font-medium">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>S: {new Date(inv.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted font-medium mt-0.5">
                        <Calendar className="w-3 h-3 text-emerald-500" />
                        <span>M: {new Date(inv.maturity_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        inv.status === 'active'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : inv.status === 'completed'
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'bg-destructive/10 border border-destructive/20 text-destructive'
                      }`}>
                        {inv.status === 'early_termination_pending' ? 'Termination Pending' : inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {inv.status === 'early_termination_pending' && (
                          <button
                            onClick={() => handleApproveTermination(inv)}
                            title="Approve early termination request"
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[10px] rounded-lg flex items-center gap-1 transition-all shadow-md shadow-emerald-500/10"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedInv(inv);
                            setEditForm({
                              status: inv.status,
                              accrued_interest: inv.accrued_interest.toString(),
                              auto_reinvest: inv.auto_reinvest
                            });
                            setIsEditOpen(true);
                          }}
                          title="Edit investment parameters"
                          className="p-1.5 rounded-lg bg-input border border-border text-muted hover:text-foreground transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteInvestment(inv.id)}
                          title="Delete investment record"
                          className="p-1.5 rounded-lg bg-input border border-border text-muted hover:text-destructive hover:border-destructive/30 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create Manual Investment */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button 
              onClick={() => setIsCreateOpen(false)}
              title="Close modal"
              className="absolute top-4 right-4 p-1 rounded-lg bg-input border border-border text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-foreground font-heading">Manual Investment Allocation</h3>
              <p className="text-xs text-muted mt-1">Manually subscribe a user to an active package offering.</p>
            </div>

            <form onSubmit={handleCreateInvestment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Select User Account</label>
                <select 
                  required
                  value={createForm.userId}
                  onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
                  title="Select user account"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">-- Choose User --</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Select Package Offering</label>
                <select 
                  required
                  value={createForm.packageId}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  title="Select package offering"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">-- Choose Package --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({formatNaira(pkg.amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Capital Amount (NGN)</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                  placeholder="Subscription price"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Initial Status</label>
                <select 
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  title="Initial status"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="active">Active (Accruing yield)</option>
                  <option value="completed">Completed (Matured)</option>
                  <option value="early_termination_pending">Termination Pending</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-input border border-border rounded-xl">
                <input 
                  type="checkbox" 
                  id="create-reinvest"
                  checked={createForm.auto_reinvest}
                  onChange={(e) => setCreateForm({ ...createForm, auto_reinvest: e.target.checked })}
                  className="rounded border-border text-emerald-500 focus:ring-emerald-500 bg-card w-4 h-4"
                />
                <label htmlFor="create-reinvest" className="text-xs text-foreground font-semibold select-none cursor-pointer">
                  Enable auto-reinvest at maturity
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Allocate Subscription</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Investment */}
      {isEditOpen && selectedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button 
              onClick={() => {
                setIsEditOpen(false);
                setSelectedInv(null);
              }}
              title="Close modal"
              className="absolute top-4 right-4 p-1 rounded-lg bg-input border border-border text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-foreground font-heading">Edit Investment Parameters</h3>
              <p className="text-xs text-muted mt-1">
                Edit yields and status terms for <span className="font-semibold text-foreground">{selectedInv.profiles?.first_name}&apos;s</span> subscription.
              </p>
            </div>

            <form onSubmit={handleEditInvestment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Status</label>
                <select 
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as InvestmentItem['status'] })}
                  title="Status"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="early_termination_pending">Termination Pending</option>
                  <option value="early_terminated">Early Terminated</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Accrued Yield Interest (NGN)</label>
                <input 
                  type="number" 
                  required
                  step="0.0001"
                  min="0"
                  value={editForm.accrued_interest}
                  onChange={(e) => setEditForm({ ...editForm, accrued_interest: e.target.value })}
                  title="Accrued Yield Interest"
                  placeholder="0.0000"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center space-x-3 p-3 bg-input border border-border rounded-xl">
                <input 
                  type="checkbox" 
                  id="edit-reinvest"
                  checked={editForm.auto_reinvest}
                  onChange={(e) => setEditForm({ ...editForm, auto_reinvest: e.target.checked })}
                  className="rounded border-border text-emerald-500 focus:ring-emerald-500 bg-card w-4 h-4"
                />
                <label htmlFor="edit-reinvest" className="text-xs text-foreground font-semibold select-none cursor-pointer">
                  Auto reinvest at maturity
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
