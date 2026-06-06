'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Tag,
  CheckCircle,
  XCircle,
  Percent,
  Calendar
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Selected Package state
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);

  // Form states - Create Package
  const [createForm, setCreateForm] = useState({
    name: '',
    amount: '',
    annual_interest_rate: '25.00',
    duration_days: '365',
    is_active: true
  });

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

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          amount: Number(createForm.amount),
          annual_interest_rate: Number(createForm.annual_interest_rate),
          duration_days: Number(createForm.duration_days),
          is_active: createForm.is_active
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to create package');
      }

      setIsCreateOpen(false);
      setCreateForm({ name: '', amount: '', annual_interest_rate: '25.00', duration_days: '365', is_active: true });
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred during package creation');
    } finally {
      setLoading(false);
    }
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
        throw new Error(resData.error || 'Failed to update package');
      }

      setIsEditOpen(false);
      setSelectedPackage(null);
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred updating package');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the investment package "${name}"? Existing user subscriptions referencing this package ID will remain, but users will no longer be able to select it.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/packages?id=${id}`, {
        method: 'DELETE',
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to delete package');
      }

      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred deleting package');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">Investment Packages</h1>
          <p className="text-xs text-slate-400 mt-1">Configure and release investment packages for normal users to subscribe to.</p>
        </div>

        <button 
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Package</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-4 rounded-xl bg-[#0b0f19] border border-slate-900 shadow-md">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Packages</span>
          <div className="text-xl font-bold text-slate-200 mt-1">{initialPackages.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#0b0f19] border border-slate-900 shadow-md">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Offerings</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{initialPackages.filter(p => p.is_active).length}</div>
        </div>
      </div>

      {/* Package listings */}
      <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl overflow-x-auto">
        {initialPackages.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No investment packages configured yet.</p>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900 pb-2">
                <th className="pb-3">Package name</th>
                <th className="pb-3">Subscription Amount</th>
                <th className="pb-3">Annual Interest</th>
                <th className="pb-3">Duration terms</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {initialPackages.map((p) => (
                <tr key={p.id} className="align-middle hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 font-bold text-slate-200 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{p.name}</span>
                  </td>
                  <td className="py-4 font-mono font-semibold text-slate-300">
                    {formatNaira(p.amount)}
                  </td>
                  <td className="py-4 font-mono font-semibold text-emerald-400 flex items-center gap-0.5">
                    <Percent className="w-3 h-3" /> {p.annual_interest_rate}%
                  </td>
                  <td className="py-4 font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {p.duration_days} Days
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1 w-fit ${
                      p.is_active 
                        ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' 
                        : 'bg-slate-900 border border-slate-800 text-slate-500'
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
                        title="Edit Package"
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeletePackage(p.id, p.name)}
                        title="Delete Package"
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
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

      {/* Modal: Create Package */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button 
              onClick={() => setIsCreateOpen(false)}
              title="Close modal"
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white font-heading">Create Package Offer</h3>
              <p className="text-xs text-slate-400 mt-1">Configure subscription cost, return rate, and maturation cycles.</p>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Package Name</label>
                <input 
                  type="text" 
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  title="Package Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. VIP Plus"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subscription Price (NGN)</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  title="Subscription Price"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="250000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Annual Interest (%)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0"
                    value={createForm.annual_interest_rate}
                    onChange={(e) => setCreateForm({ ...createForm, annual_interest_rate: e.target.value })}
                    title="Annual Interest Percentage"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="25.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration (Days)</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={createForm.duration_days}
                    onChange={(e) => setCreateForm({ ...createForm, duration_days: e.target.value })}
                    title="Duration in Days"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="365"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-950 border border-slate-900 rounded-xl">
                <input 
                  type="checkbox" 
                  id="create-active"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
                />
                <label htmlFor="create-active" className="text-xs text-slate-300 font-semibold select-none cursor-pointer">
                  Activate Package (Visible to users)
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Package</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Package */}
      {isEditOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <button 
              onClick={() => {
                setIsEditOpen(false);
                setSelectedPackage(null);
              }}
              title="Close modal"
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white font-heading">Edit Package Details</h3>
              <p className="text-xs text-slate-400 mt-1">Modify configuration parameters for `{selectedPackage.name}`.</p>
            </div>

            <form onSubmit={handleEditPackage} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Package Name</label>
                <input 
                  type="text" 
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  title="Package Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subscription Price (NGN)</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  title="Subscription Price"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Annual Interest (%)</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0"
                    value={editForm.annual_interest_rate}
                    onChange={(e) => setEditForm({ ...editForm, annual_interest_rate: e.target.value })}
                    title="Annual Interest Percentage"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration (Days)</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={editForm.duration_days}
                    onChange={(e) => setEditForm({ ...editForm, duration_days: e.target.value })}
                    title="Duration in Days"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-950 border border-slate-900 rounded-xl">
                <input 
                  type="checkbox" 
                  id="edit-active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 w-4 h-4"
                />
                <label htmlFor="edit-active" className="text-xs text-slate-300 font-semibold select-none cursor-pointer">
                  Activate Package (Visible to users)
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
