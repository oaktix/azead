'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  AlertOctagon, 
  Check, 
  X, 
  ExternalLink, 
  RefreshCw,
  Sliders,
  Terminal
} from 'lucide-react';

interface KycDoc {
  id: string;
  user_id: string;
  id_number: string;
  id_document_url: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  payout_amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  profiles: {
    first_name: string;
    last_name: string;
    created_at?: string;
  };
}

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
  kycDocs: KycDoc[];
  withdrawals: Withdrawal[];
  panicPaused: boolean;
  auditLogs: AuditLog[];
}

export default function AdminClient({
  metrics,
  kycDocs,
  withdrawals,
  panicPaused,
  auditLogs,
}: AdminClientProps) {
  const router = useRouter();

  // Loading States
  const [kycLoadingId, setKycLoadingId] = useState<string | null>(null);
  const [wthLoadingId, setWthLoadingId] = useState<string | null>(null);
  const [panicLoading, setPanicLoading] = useState(false);
  const [cronLoading, setCronLoading] = useState(false);

  // Rejection notes states
  const [kycRejectId, setKycRejectId] = useState<string | null>(null);
  const [kycReason, setKycReason] = useState('');
  const [wthRejectId, setWthRejectId] = useState<string | null>(null);
  const [wthReason, setWthReason] = useState('');

  // Toggled states
  const [panicState, setPanicState] = useState(panicPaused);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  const handleProcessKYC = async (kycId: string, userId: string, approve: boolean) => {
    setKycLoadingId(kycId);
    try {
      const response = await fetch('/api/admin/kyc/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kycId,
          userId,
          action: approve ? 'approve' : 'reject',
          reason: approve ? null : kycReason
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process KYC document');
      }

      setKycRejectId(null);
      setKycReason('');
      router.refresh();
    } catch {
      alert('Error updating KYC status');
    } finally {
      setKycLoadingId(null);
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: string, approve: boolean) => {
    setWthLoadingId(withdrawalId);
    try {
      const response = await fetch('/api/admin/withdrawals/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          action: approve ? 'approve' : 'reject',
          reason: approve ? null : wthReason
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process withdrawal request');
      }

      setWthRejectId(null);
      setWthReason('');
      router.refresh();
    } catch {
      alert('Error processing withdrawal allocation');
    } finally {
      setWthLoadingId(null);
    }
  };

  const handleTogglePanicButton = async () => {
    setPanicLoading(true);
    const nextState = !panicState;
    try {
      const response = await fetch('/api/admin/settings/panic-button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pause: nextState }),
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header titles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">Admin Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">Platform liquidity monitoring and compliance controls.</p>
        </div>

        {/* Live Fail-Safe Status indicator */}
        <div className={`px-4 py-2 rounded-xl flex items-center space-x-2.5 border ${
          panicState 
            ? 'bg-red-950/20 border-red-500/30 text-red-400' 
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
        }`}>
          <AlertOctagon className={`w-4 h-4 ${panicState ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-bold uppercase tracking-wider">
            {panicState ? 'FAIL-SAFE PAUSE ACTIVE' : 'SYSTEM ONLINE'}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-lg">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Platform Deposits</div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1.5">{formatNaira(metrics.totalDeposits).replace('.00', '')}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-lg">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Platform Payouts</div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1.5">{formatNaira(metrics.totalWithdrawals).replace('.00', '')}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-lg">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Assets (AUM)</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono mt-1.5">{formatNaira(metrics.activeInvestmentsSum).replace('.00', '')}</div>
          <span className="text-[8px] text-slate-500 block mt-1">{metrics.activeInvestmentsCount} active holdings</span>
        </div>
        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-lg">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action Items</div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-500 font-mono mt-1.5">{metrics.pendingKycCount + metrics.pendingWithdrawalsCount} Items</div>
          <span className="text-[8px] text-slate-500 block mt-1">{metrics.pendingKycCount} KYC • {metrics.pendingWithdrawalsCount} Withdrawals</span>
        </div>
      </div>

      {/* Main Admin splits */}
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Left Side: Pending lists */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* KYC Approvals Panel */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white font-heading px-1">Pending KYC Documents ({kycDocs.length})</h3>
            <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl overflow-x-auto">
              {kycDocs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No pending KYC approvals found.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-900 pb-2">
                      <th className="pb-3">Investor</th>
                      <th className="pb-3">ID Details</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {kycDocs.map((doc) => {
                      const isRejecting = kycRejectId === doc.id;
                      
                      return (
                        <tr key={doc.id} className="align-middle">
                          <td className="py-3 font-bold text-slate-200">
                            {doc.profiles?.first_name} {doc.profiles?.last_name}
                          </td>
                          <td className="py-3 font-mono text-[10px] text-slate-400">
                            ID: {doc.id_number}
                            <a href={doc.id_document_url} target="_blank" rel="noreferrer" className="ml-2 text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                              View ID <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="py-3 text-right">
                            {isRejecting ? (
                              <div className="flex items-center justify-end gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Rejection reason"
                                  value={kycReason}
                                  onChange={(e) => setKycReason(e.target.value)}
                                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                                />
                                <button title="Submit Rejection" aria-label="Submit Rejection" onClick={() => handleProcessKYC(doc.id, doc.user_id, false)}
                                  className="p-1 rounded bg-red-950/40 text-red-400"
                                >
                                  Submit
                                </button>
                                <button title="Cancel Rejection" aria-label="Cancel Rejection" onClick={() => setKycRejectId(null)}
                                  className="p-1 rounded bg-slate-900 text-slate-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button title="Approve KYC" aria-label="Approve KYC" onClick={() => handleProcessKYC(doc.id, doc.user_id, true)}
                                  disabled={kycLoadingId !== null}
                                  className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-950 hover:text-white transition-colors"
                                >
                                  {kycLoadingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button title="Reject KYC" aria-label="Reject KYC" onClick={() => setKycRejectId(doc.id)}
                                  disabled={kycLoadingId !== null}
                                  className="p-1.5 rounded bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-950 hover:text-white transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Withdrawal Requests Panel */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white font-heading px-1">Pending Withdrawals ({withdrawals.length})</h3>
            <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl overflow-x-auto">
              {withdrawals.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No pending withdrawal approvals found.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-900 pb-2">
                      <th className="pb-3">Investor</th>
                      <th className="pb-3">Bank details</th>
                      <th className="pb-3 text-right">Amounts</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {withdrawals.map((wth) => {
                      const isRejecting = wthRejectId === wth.id;
                      
                      return (
                        <tr key={wth.id} className="align-middle">
                          <td className="py-3 font-bold text-slate-200">
                            {wth.profiles?.first_name} {wth.profiles?.last_name}
                          </td>
                          <td className="py-3 font-mono text-[10px] text-slate-400">
                            Bank: {wth.bank_name}<br />
                            Acct: {wth.account_number} ({wth.account_name})
                          </td>
                          <td className="py-3 text-right font-mono">
                            Gross: {formatNaira(wth.amount).replace('.00', '')}<br />
                            Net Payout: <strong className="text-emerald-400">{formatNaira(wth.payout_amount)}</strong>
                          </td>
                          <td className="py-3 text-right">
                            {isRejecting ? (
                              <div className="flex items-center justify-end gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Reason"
                                  value={wthReason}
                                  onChange={(e) => setWthReason(e.target.value)}
                                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                                />
                                <button title="Submit Rejection" aria-label="Submit Rejection" onClick={() => handleProcessWithdrawal(wth.id, false)}
                                  className="p-1 rounded bg-red-950/40 text-red-400"
                                >
                                  Submit
                                </button>
                                <button title="Cancel Rejection" aria-label="Cancel Rejection" onClick={() => setWthRejectId(null)}
                                  className="p-1 rounded bg-slate-900 text-slate-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button title="Approve Withdrawal" aria-label="Approve Withdrawal" onClick={() => handleProcessWithdrawal(wth.id, true)}
                                  disabled={wthLoadingId !== null}
                                  className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-950 hover:text-white transition-colors"
                                >
                                  {wthLoadingId === wth.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button title="Reject Withdrawal" aria-label="Reject Withdrawal" onClick={() => setWthRejectId(wth.id)}
                                  disabled={wthLoadingId !== null}
                                  className="p-1.5 rounded bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-950 hover:text-white transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Panic Switch, Manual Cron & Audit Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Platform settings controls */}
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

          {/* Audit Logs panel */}
          <div className="space-y-4">
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

    </div>
  );
}
