'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sliders, 
  Loader2, 
  Check, 
  Percent, 
  Coins, 
  ShieldAlert,
  AlertOctagon
} from 'lucide-react';

interface PlatformSettings {
  withdrawal_fee_percentage: number;
  early_termination_penalty_percentage: number;
  referral_bonus_percentage: number;
  daily_withdrawal_limit: number;
  panic_button_paused: boolean;
}

interface SettingsClientProps {
  initialSettings: PlatformSettings;
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [form, setForm] = useState<PlatformSettings>(initialSettings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to update settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'An error occurred saving platform settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">Platform Settings</h1>
        <p className="text-xs text-muted mt-1">Configure global pricing multipliers, commission fees, panic triggers, and liquidity boundaries.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Fees and commissions */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-foreground font-heading flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-400" />
            <span>Fees & Commissions</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Withdrawal Fee (%)
              </label>
              <p className="text-[9px] text-muted mb-2">Transaction fee charged gross upon user payouts.</p>
              <div className="relative">
                <input 
                  type="number" 
                  required
                  step="0.01"
                  min="0"
                  max="100"
                  title="Withdrawal fee percentage"
                  placeholder="e.g. 2.5"
                  value={form.withdrawal_fee_percentage}
                  onChange={(e) => setForm({ ...form, withdrawal_fee_percentage: Number(e.target.value) })}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                />
                <span className="absolute right-3 top-3 text-[10px] font-bold text-muted">%</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Early Termination Penalty (%)
              </label>
              <p className="text-[9px] text-muted mb-2">Yield cancellation fine for early investment liquidations.</p>
              <div className="relative">
                <input 
                  type="number" 
                  required
                  step="0.01"
                  min="0"
                  max="100"
                  title="Early termination penalty percentage"
                  placeholder="e.g. 10"
                  value={form.early_termination_penalty_percentage}
                  onChange={(e) => setForm({ ...form, early_termination_penalty_percentage: Number(e.target.value) })}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                />
                <span className="absolute right-3 top-3 text-[10px] font-bold text-muted">%</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Referral Reward Bonus (%)
              </label>
              <p className="text-[9px] text-muted mb-2">Yield commission percentage awarded on referee&apos;s initial investment.</p>
              <div className="relative">
                <input 
                  type="number" 
                  required
                  step="0.01"
                  min="0"
                  max="100"
                  title="Referral bonus percentage"
                  placeholder="e.g. 5"
                  value={form.referral_bonus_percentage}
                  onChange={(e) => setForm({ ...form, referral_bonus_percentage: Number(e.target.value) })}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                />
                <span className="absolute right-3 top-3 text-[10px] font-bold text-muted">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liquidity thresholds */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-foreground font-heading flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>Liquidity Controls</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                Daily Withdrawal Limit (NGN)
              </label>
              <p className="text-[9px] text-muted mb-2">Maximum withdrawal allocation allowed platform-wide per calendar day.</p>
              <input 
                type="number" 
                required
                min="0"
                title="Daily withdrawal limit in NGN"
                placeholder="e.g. 5000000"
                value={form.daily_withdrawal_limit}
                onChange={(e) => setForm({ ...form, daily_withdrawal_limit: Number(e.target.value) })}
                className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Emergency pause controls */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-foreground font-heading flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Emergency Fail-Safe Settings</span>
          </h4>

          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start space-x-3.5">
            <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-foreground">System Emergency Lock (Panic Button)</span>
              <p className="text-[9px] text-muted mt-1">
                Activating this locks all outgoing withdrawal transactions and freezes package checkouts for normal users immediately. Use only in event of emergency audits.
              </p>
              
              <div className="flex items-center space-x-3 mt-4">
                <input 
                  type="checkbox" 
                  id="panic-toggle"
                  checked={form.panic_button_paused}
                  onChange={(e) => setForm({ ...form, panic_button_paused: e.target.checked })}
                  className="rounded border-border text-red-500 focus:ring-red-500 bg-input w-4 h-4"
                />
                <label htmlFor="panic-toggle" className="text-xs font-bold text-red-400 select-none cursor-pointer">
                  Activate System Emergency Lock (Pause Platform Checkout & Payouts)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex items-center justify-between gap-4">
          {success && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-950/20 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
              <Check className="w-4 h-4" />
              <span>Platform settings updated successfully.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ml-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
            <span>Save Configuration</span>
          </button>
        </div>

      </form>
    </div>
  );
}
