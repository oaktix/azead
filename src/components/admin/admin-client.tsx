'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  AlertOctagon, 
  RefreshCw,
  Sliders,
  Terminal,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  details?: Record<string, unknown>;
  created_at: string;
}

interface AdminClientProps {
  metrics: {
    totalDeposits: number;
    totalWithdrawals: number;
    activeInvestmentsCount: number;
    activeInvestmentsSum: number;
    pendingKycCount: number;
    pendingWithdrawalsCount: number;
  };
  panicPaused: boolean;
  auditLogs: AuditLog[];
}

export default function AdminClient({
  metrics,
  panicPaused,
  auditLogs,
}: AdminClientProps) {
  const router = useRouter();

  // Loading States
  const [panicLoading, setPanicLoading] = useState(false);
  const [cronLoading, setCronLoading] = useState(false);

  // Toggled states
  const [panicState, setPanicState] = useState(panicPaused);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  const handleTogglePanicButton = async () => {
    setPanicLoading(true);
    const nextState = !panicState;
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panic_button_paused: nextState }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle fail-safe status');
      }

      setPanicState(nextState);
      router.refresh();
    } catch {
      alert('Error updating panic fail-safe settings');
    } finally {
      setPanicLoading(false);
    }
  };

  const handleRunCron = async () => {
    setCronLoading(true);
    setCronResult(null);
    try {
      const response = await fetch('/api/admin/cron', {
        method: 'POST',
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to process maturation script');
      }

      setCronResult(`Success! Matured packages processed: ${resData.processedCount}`);
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      setCronResult(`Error running cron: ${errorObj.message}`);
    } finally {
      setCronLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header titles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">Control Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Platform liquidity monitoring, system controls, and recent audits.</p>
        </div>

        {/* Live Fail-Safe Status indicator */}
        <div className={`px-4 py-2 rounded-xl flex items-center space-x-2.5 border ${
          panicState 
            ? 'bg-red-950/20 border-red-500/30 text-red-400' 
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
        }`}>
          <AlertOctagon className={`w-4 h-4 ${panicState ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-bold uppercase tracking-wider">
            {panicState ? 'FAIL-SAFE ACTIVE (PAUSED)' : 'SYSTEM ONLINE'}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-lg relative overflow-hidden group hover:border-slate-800 transition-colors">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Platform Deposits</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1.5">{formatNaira(metrics.totalDeposits).replace('.00', '')}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-lg relative overflow-hidden group hover:border-slate-800 transition-colors">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Platform Payouts</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1.5">{formatNaira(metrics.totalWithdrawals).replace('.00', '')}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-lg relative overflow-hidden group hover:border-slate-800 transition-colors">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Active Assets (AUM)</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono mt-1.5">{formatNaira(metrics.activeInvestmentsSum).replace('.00', '')}</div>
          <span className="text-[8px] text-slate-500 block mt-1">{metrics.activeInvestmentsCount} active holdings</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-lg relative overflow-hidden group hover:border-slate-800 transition-colors">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Action Items</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-500 font-mono mt-1.5">{metrics.pendingKycCount + metrics.pendingWithdrawalsCount} Items</div>
          <span className="text-[8px] text-slate-500 block mt-1">{metrics.pendingKycCount} KYC • {metrics.pendingWithdrawalsCount} Withdrawals</span>
        </div>
      </div>

      {/* Control Split */}
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left Side: Panic Switch & Manual Cron */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl space-y-6">
            <h4 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Platform Controls</span>
            </h4>

            {/* Panic Switch */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-200">Panic Button Pause</span>
                  <p className="text-[9px] text-slate-500 mt-0.5">Freezes user checkout and withdrawal submissions</p>
                </div>
                <button
                  onClick={handleTogglePanicButton}
                  disabled={panicLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    panicState 
                      ? 'bg-red-500 text-slate-950 hover:bg-red-600' 
                      : 'bg-slate-900 border border-slate-800 text-red-400 hover:bg-red-950/30'
                  }`}
                >
                  {panicLoading ? 'Updating...' : panicState ? 'Unpause System' : 'ACTIVATE PAUSE'}
                </button>
              </div>
            </div>

            {/* Maturity Manual Audit trigger */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-200">Audit Maturing Positions</span>
                <p className="text-[9px] text-slate-500 mt-0.5">Executes maturity logic payout calculations for active positions</p>
              </div>
              <button
                onClick={handleRunCron}
                disabled={cronLoading}
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {cronLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Trigger Maturity Cron</span>
              </button>
              {cronResult && (
                <div className="p-2 rounded bg-slate-900 text-[10px] text-emerald-400 font-mono text-center">
                  {cronResult}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Audit Logs */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-sm font-bold text-white font-heading px-1 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Admin Operation Audits</span>
          </h3>
          <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl max-h-[350px] overflow-y-auto space-y-4">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No audit records found.</p>
            ) : (
              <div className="space-y-3 divide-y divide-slate-900 text-[10px]">
                {auditLogs.map((log, idx) => (
                  <div key={log.id} className={`space-y-1 ${idx > 0 ? 'pt-3' : ''}`}>
                    <div className="flex justify-between font-mono text-[9px] text-slate-500">
                      <span>Op: {log.action}</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-300 font-mono text-[9px] leading-normal break-all">
                      {JSON.stringify(log.details)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
