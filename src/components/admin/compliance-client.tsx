'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  Check, 
  X, 
  ExternalLink, 
  Inbox,
  UserCheck,
  CreditCard
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
  };
}

interface ComplianceClientProps {
  kycDocs: KycDoc[];
  withdrawals: Withdrawal[];
}

export default function ComplianceClient({
  kycDocs,
  withdrawals,
}: ComplianceClientProps) {
  const router = useRouter();

  // Loading States
  const [kycLoadingId, setKycLoadingId] = useState<string | null>(null);
  const [wthLoadingId, setWthLoadingId] = useState<string | null>(null);

  // Rejection notes states
  const [kycRejectId, setKycRejectId] = useState<string | null>(null);
  const [kycReason, setKycReason] = useState('');
  const [wthRejectId, setWthRejectId] = useState<string | null>(null);
  const [wthReason, setWthReason] = useState('');

  // Preview Modal States
  const [activePreviewDoc, setActivePreviewDoc] = useState<KycDoc | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to process KYC document');
      }

      setKycRejectId(null);
      setKycReason('');
      setIsPreviewOpen(false);
      setActivePreviewDoc(null);
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'Error updating KYC status');
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

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to process withdrawal request');
      }

      setWthRejectId(null);
      setWthReason('');
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as Error;
      alert(errorObj.message || 'Error processing withdrawal allocation');
    } finally {
      setWthLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">Compliance Reviews</h1>
        <p className="text-xs text-slate-400 mt-1">Approve investor KYC identity verifications and process pending bank withdrawals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Pending KYC Panel */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white font-heading px-1 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>KYC Verification Queue ({kycDocs.length})</span>
          </h3>

          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl overflow-x-auto min-h-[200px] flex flex-col justify-between">
            {kycDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                <Inbox className="w-8 h-8 text-slate-600" />
                <p className="text-xs">All KYC verifications processed.</p>
              </div>
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
                        <td className="py-3.5 font-bold text-slate-200">
                          {doc.profiles?.first_name} {doc.profiles?.last_name}
                        </td>
                        <td className="py-3.5 font-mono text-[10px] text-slate-400">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => {
                                setActivePreviewDoc(doc);
                                setIsPreviewOpen(true);
                              }}
                              className="w-12 h-10 rounded border border-slate-800 bg-slate-950 overflow-hidden flex-shrink-0 cursor-pointer hover:border-emerald-500/50 transition-colors flex items-center justify-center"
                              title="Click to preview ID"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={doc.id_document_url} alt="ID Document Thumbnail" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-slate-200">ID: {doc.id_number}</span>
                              <button 
                                onClick={() => {
                                  setActivePreviewDoc(doc);
                                  setIsPreviewOpen(true);
                                }}
                                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 mt-0.5"
                              >
                                Preview Document <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-right">
                          {isRejecting ? (
                            <div className="flex items-center justify-end gap-2">
                              <input 
                                type="text" 
                                placeholder="Reason"
                                value={kycReason}
                                onChange={(e) => setKycReason(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                              />
                              <button 
                                title="Submit Rejection" 
                                onClick={() => handleProcessKYC(doc.id, doc.user_id, false)}
                                className="p-1 rounded bg-red-950/40 text-red-400 text-[10px] font-semibold px-2 py-1"
                              >
                                Submit
                              </button>
                              <button title="Cancel Rejection" onClick={() => setKycRejectId(null)}
                                className="p-1 rounded bg-slate-900 text-slate-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button title="Approve KYC" onClick={() => handleProcessKYC(doc.id, doc.user_id, true)}
                                disabled={kycLoadingId !== null}
                                className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-950 hover:text-white transition-colors"
                              >
                                {kycLoadingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button title="Reject KYC" onClick={() => setKycRejectId(doc.id)}
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

        {/* Right: Pending Withdrawals Panel */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white font-heading px-1 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Withdrawals Approval Queue ({withdrawals.length})</span>
          </h3>

          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl overflow-x-auto min-h-[200px] flex flex-col justify-between">
            {withdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                <Inbox className="w-8 h-8 text-slate-600" />
                <p className="text-xs">No pending withdrawal payouts.</p>
              </div>
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
                        <td className="py-3.5 font-bold text-slate-200">
                          {wth.profiles?.first_name} {wth.profiles?.last_name}
                        </td>
                        <td className="py-3.5 font-mono text-[10px] text-slate-400">
                          Bank: {wth.bank_name}<br />
                          Acct: {wth.account_number} ({wth.account_name})
                        </td>
                        <td className="py-3.5 text-right font-mono">
                          Gross: {formatNaira(wth.amount).replace('.00', '')}<br />
                          Net: <strong className="text-emerald-400">{formatNaira(wth.payout_amount)}</strong>
                        </td>
                        <td className="py-3.5 text-right">
                          {isRejecting ? (
                            <div className="flex items-center justify-end gap-2">
                              <input 
                                type="text" 
                                placeholder="Reason"
                                value={wthReason}
                                onChange={(e) => setWthReason(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                              />
                              <button 
                                title="Submit Rejection" 
                                onClick={() => handleProcessWithdrawal(wth.id, false)}
                                className="p-1 rounded bg-red-950/40 text-red-400 text-[10px] font-semibold px-2 py-1"
                              >
                                Submit
                              </button>
                              <button title="Cancel Rejection" onClick={() => setWthRejectId(null)}
                                className="p-1 rounded bg-slate-900 text-slate-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button title="Approve Withdrawal" onClick={() => handleProcessWithdrawal(wth.id, true)}
                                disabled={wthLoadingId !== null}
                                className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-950 hover:text-white transition-colors"
                              >
                                {wthLoadingId === wth.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button title="Reject Withdrawal" onClick={() => setWthRejectId(wth.id)}
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

      {/* Verification Preview Modal */}
      {isPreviewOpen && activePreviewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => {
                setIsPreviewOpen(false);
                setActivePreviewDoc(null);
                setKycRejectId(null);
                setKycReason('');
              }}
              title="Close Modal"
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white font-heading">KYC Verification Review</h3>
              <p className="text-xs text-slate-400 mt-1">
                Please examine the uploaded document image carefully to verify the applicant&apos;s details.
              </p>
            </div>

            {/* Document display */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[300px] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={activePreviewDoc.id_document_url} 
                alt="Uploaded ID Document" 
                className="max-h-[400px] object-contain rounded" 
              />
            </div>

            {/* Applicant details */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-900 font-mono text-xs">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Applicant</span>
                <span className="text-slate-200 font-bold mt-1 block">
                  {activePreviewDoc.profiles?.first_name} {activePreviewDoc.profiles?.last_name}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">ID / NIN Document Number</span>
                <span className="text-emerald-400 font-bold mt-1 block">
                  {activePreviewDoc.id_number}
                </span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex flex-col gap-4 border-t border-slate-900 pt-4">
              {kycRejectId === activePreviewDoc.id ? (
                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-slate-300">Explain rejection reason:</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Document image blurry or details mismatch"
                      value={kycReason}
                      onChange={(e) => setKycReason(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                    <button 
                      onClick={async () => {
                        await handleProcessKYC(activePreviewDoc.id, activePreviewDoc.user_id, false);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-slate-950 font-bold text-xs transition-colors"
                    >
                      Submit Rejection
                    </button>
                    <button 
                      onClick={() => {
                        setKycRejectId(null);
                        setKycReason('');
                      }}
                      className="px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setKycRejectId(activePreviewDoc.id)}
                    disabled={kycLoadingId !== null}
                    className="flex-1 py-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-950 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Verification</span>
                  </button>
                  <button
                    onClick={async () => {
                      await handleProcessKYC(activePreviewDoc.id, activePreviewDoc.user_id, true);
                    }}
                    disabled={kycLoadingId !== null}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    {kycLoadingId === activePreviewDoc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Approve & Verify</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
