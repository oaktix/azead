'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Edit, 
  X, 
  Loader2, 
  Tag,
  CheckCircle,
  XCircle,
  Percent,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface PackageItem {
  id: string;
  name: string;
  amount: number;
  annual_interest_rate: number;
  duration_days: number;
  is_active: boolean;
}

interface PackagesClientProps {
  initialPackages: PackageItem[];
}

export default function PackagesClient({ initialPackages }: PackagesClientProps) {
  const router = useRouter();

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Selected Package state
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);

  // Form states - Edit Package
  const [editForm, setEditForm] = useState({
    name: '',
    amount: '',
    annual_interest_rate: '',
    duration_days: '',
    is_active: true
  });

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  const handleEditPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPackage.id,
          name: editForm.name,
          amount: Number(editForm.amount),
          annual_interest_rate: Number(editForm.annual_interest_rate),
          duration_days: Number(editForm.duration_days),
          is_active: editForm.is_active
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update plan settings');
      }

      setIsEditOpen(false);
      setSelectedPackage(null);
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred updating plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">Unified Investment Plan</h1>
          <p className="text-xs text-muted mt-1">Configure plan parameters for the customizable Azead Wealth Plan.</p>
        </div>
      </div>

      {/* Info notice about unified custom plans */}
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start space-x-3 text-xs text-foreground">
        <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-bold">Unified Customizable Plan Active</p>
          <p className="text-muted leading-relaxed font-sans">
            The platform is running on a customizable wealth structure. Users set their own principal amount (minimum ₦100,000.00 NGN) and choose lock-in duration in years (1, 2, 3, or 5 years) at the fixed interest rate specified below. Adding new packages or deleting the standard plan is disabled to maintain system integrity.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-4 rounded-xl bg-card border border-border shadow-md">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Plan Mode</span>
          <div className="text-xl font-bold text-foreground mt-1">Custom Principal</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-md">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Interest Rate</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">25.00% APR</div>
        </div>
      </div>

      {/* Package listings */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-muted border-b border-border pb-2">
              <th className="pb-3">Plan Name</th>
              <th className="pb-3">Default Minimum Principal</th>
              <th className="pb-3">Fixed Interest Rate</th>
              <th className="pb-3">Base Cycle Term</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initialPackages.map((p) => (
              <tr key={p.id} className="align-middle hover:bg-muted/10 transition-colors">
                <td className="py-4 font-bold text-foreground flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{p.name}</span>
                </td>
                <td className="py-4 font-mono font-semibold text-foreground">
                  {formatNaira(p.amount)}
                </td>
                <td className="py-4 font-mono font-semibold text-emerald-400 flex items-center gap-0.5">
                  <Percent className="w-3 h-3" /> {p.annual_interest_rate}%
                </td>
                <td className="py-4 font-semibold text-muted flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {p.duration_days} Days (Base)
                </td>
                <td className="py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1 w-fit ${
                    p.is_active 
                      ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' 
                      : 'bg-input border border-border text-muted'
                  }`}>
                    {p.is_active ? (
                      <>
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-2.5 h-2.5" />
                        <span>Inactive</span>
                      </>
                    )}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setSelectedPackage(p);
                        setEditForm({
                          name: p.name,
                          amount: p.amount.toString(),
                          annual_interest_rate: p.annual_interest_rate.toString(),
                          duration_days: p.duration_days.toString(),
                          is_active: p.is_active
                        });
                        setIsEditOpen(true);
                      }}
                      title="Edit Plan Parameters"
                      className="p-1.5 rounded-lg bg-input border border-border text-muted hover:text-foreground transition-all flex items-center gap-1 px-3"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Parameters</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Edit Package */}
      {isEditOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button 
              onClick={() => {
                setIsEditOpen(false);
                setSelectedPackage(null);
              }}
              title="Close modal"
              className="absolute top-4 right-4 p-1 rounded-lg bg-input border border-border text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-foreground font-heading">Edit Plan Parameters</h3>
              <p className="text-xs text-muted mt-1 font-sans">Modify parameters for the customizable `{selectedPackage.name}`.</p>
            </div>

            <form onSubmit={handleEditPackage} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Plan Name</label>
                <input 
                  type="text" 
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  title="Plan Name"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Default Minimum Principal (NGN)</label>
                <input 
                  type="number" 
                  required
                  min={100000}
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  title="Default Minimum Principal"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Annual Interest (%)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0"
                    value={editForm.annual_interest_rate}
                    onChange={(e) => setEditForm({ ...editForm, annual_interest_rate: e.target.value })}
                    title="Annual Interest Percentage"
                    className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Base Cycle (Days)</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={editForm.duration_days}
                    onChange={(e) => setEditForm({ ...editForm, duration_days: e.target.value })}
                    title="Base Cycle in Days"
                    className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-input border border-border rounded-xl">
                <input 
                  type="checkbox" 
                  id="edit-active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded border-border text-emerald-500 focus:ring-emerald-500 bg-card w-4 h-4"
                />
                <label htmlFor="edit-active" className="text-xs text-foreground font-semibold select-none cursor-pointer">
                  Activate Plan (Visible to users)
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Plan Parameters</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
