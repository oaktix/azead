'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Award, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  X
} from 'lucide-react';

interface Package {
  id: string;
  name: string;
  amount: number;
  annual_interest_rate: number;
  duration_days: number;
}

interface Investment {
  id: string;
  amount: number;
  interest_rate: number;
  status: string;
  start_date: string;
  maturity_date: string;
  auto_reinvest: boolean;
  package_name?: string;
  investment_packages?: {
    name: string;
  };
}

interface InvestmentsClientProps {
  packages: Package[];
  investments: Investment[];
  walletBalance: number;
}

export default function InvestmentsClient({
  packages,
  investments,
  walletBalance,
}: InvestmentsClientProps) {
  const router = useRouter();

  // Selected package for purchase modal
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [autoReinvestOpt, setAutoReinvestOpt] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Selected investment for early termination modal
  const [terminatingInv, setTerminatingInv] = useState<Investment | null>(null);
  const [terminationLoading, setTerminationLoading] = useState(false);
  const [terminationError, setTerminationError] = useState<string | null>(null);
  const [terminationSuccess, setTerminationSuccess] = useState(false);

  // Toggle reinvest state on the fly
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    setPurchaseLoading(true);
    setPurchaseError(null);
    setPurchaseSuccess(false);

    try {
      const response = await fetch('/api/investments/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPkg.id,
          autoReinvest: autoReinvestOpt,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to complete subscription');
      }

      setPurchaseSuccess(true);
      setTimeout(() => {
        setSelectedPkg(null);
        setPurchaseSuccess(false);
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
    const errorObj = err as Error;
      setPurchaseError(errorObj.message || 'An unexpected error occurred.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleToggleAutoReinvest = async (investmentId: string, currentVal: boolean) => {
    setToggleLoadingId(investmentId);
    try {
      const response = await fetch('/api/investments/toggle-reinvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentId,
          autoReinvest: !currentVal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update rollover setting');
      }
      router.refresh();
    } catch {
      alert('Error updating rollover setting');
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleEarlyTermination = async () => {
    if (!terminatingInv) return;
    setTerminationLoading(true);
    setTerminationError(null);
    setTerminationSuccess(false);

    try {
      const response = await fetch('/api/investments/early-terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentId: terminatingInv.id,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to submit early termination');
      }

      setTerminationSuccess(true);
      setTimeout(() => {
        setTerminatingInv(null);
        setTerminationSuccess(false);
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
    const errorObj = err as Error;
      setTerminationError(errorObj.message || 'An unexpected error occurred.');
    } finally {
      setTerminationLoading(false);
    }
  };

  // Helper package class sorting
  const getPackageGradient = (pkgName: string) => {
    switch (pkgName.toLowerCase()) {
      case 'basic': return 'from-slate-700 to-slate-900 border-slate-800';
      case 'standard': return 'from-emerald-800 to-emerald-950 border-emerald-700/50';
      case 'silver': return 'from-blue-900 to-slate-950 border-blue-800/30';
      case 'gold': return 'from-amber-600/30 to-amber-950/70 border-amber-500/50';
      case 'diamond': return 'from-purple-900 to-slate-950 border-purple-800/40';
      case 'vip': return 'from-yellow-600/20 to-stone-900 border-yellow-500/40';
      default: return 'from-slate-800 to-slate-950 border-slate-900';
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      
      {/* Overview page titles */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">Structured Investments</h1>
        <p className="text-xs text-slate-400 mt-1">Select a high-yield locked level or configure active holdings.</p>
      </div>

      {/* Available packages */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white font-heading px-1">Subscription Capital Packages (25.00% APR)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            return (
              <div 
                key={pkg.id} 
                className={`p-6 rounded-2xl bg-gradient-to-b ${getPackageGradient(pkg.name)} border shadow-xl flex flex-col justify-between h-64 group relative`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-300 font-bold uppercase tracking-wide">{pkg.name} Level</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold font-mono">25% APR</span>
                  </div>
                  <div className="mt-4 text-2xl font-extrabold text-white font-mono">
                    {formatNaira(pkg.amount).replace('.00', '')}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Fixed principal allocation requirement</p>
                  
                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Term Lock-In:</span>
                      <span className="font-semibold text-white">1 Year ({pkg.duration_days} days)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Guaranteed Interest:</span>
                      <span className="font-semibold text-emerald-400">{formatNaira(pkg.amount * 0.25)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSelectedPkg(pkg);
                      setAutoReinvestOpt(false);
                      setPurchaseError(null);
                    }}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 text-xs font-bold transition-all"
                  >
                    Subscribe Level
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active & Historical Investments */}
      <div className="space-y-6 border-t border-slate-900 pt-10">
        <h2 className="text-lg font-bold text-white font-heading px-1">My Active & Completed Positions</h2>
        
        {investments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0b0f19]/30 border border-slate-900 text-center text-slate-400 text-sm">
            You do not currently hold any investment positions. Use the packages above to subscribe.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {investments.map((inv) => {
              const pkgName = inv.package_name || inv.investment_packages?.name || 'Structured';
              const isPendingTermination = inv.status === 'early_termination_pending';
              const isCompleted = inv.status === 'completed';
              const isActive = inv.status === 'active';
              
              const start = new Date(inv.start_date);
              const end = new Date(inv.maturity_date);
              
              return (
                <div key={inv.id} className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl flex flex-col justify-between space-y-6">
                  
                  {/* Row Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white font-heading uppercase">{pkgName} Allocation</h4>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        Reference: {inv.id.substring(0, 8).toUpperCase()}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide ${
                      isActive ? 'bg-emerald-950/60 border border-emerald-500/20 text-emerald-400' :
                      isPendingTermination ? 'bg-amber-950/60 border border-amber-500/20 text-amber-400' :
                      isCompleted ? 'bg-blue-950/60 border border-blue-500/20 text-blue-400' :
                      'bg-slate-950/60 border border-slate-800 text-slate-400'
                    }`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Body Numbers */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-400 border-t border-b border-slate-900 py-4">
                    <div>
                      <span className="text-[10px] text-slate-500">Principal Capital</span>
                      <div className="text-sm font-bold text-white mt-0.5">{formatNaira(inv.amount)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Yield APR</span>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">{inv.interest_rate}% APR</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Start Date</span>
                      <div className="text-white mt-0.5">{start.toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Maturity Date</span>
                      <div className="text-white mt-0.5">{end.toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Actions / Switches */}
                  {isActive && (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-950/60 border border-slate-900 p-3 rounded-xl">
                      
                      {/* Auto Roll Toggle */}
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <div className="relative">
                          <input 
                            type="checkbox"
                            className="sr-only"
                            checked={inv.auto_reinvest}
                            disabled={toggleLoadingId === inv.id}
                            onChange={() => handleToggleAutoReinvest(inv.id, inv.auto_reinvest)}
                          />
                          <div className={`w-8 h-4 rounded-full transition-colors ${
                            inv.auto_reinvest ? 'bg-emerald-500' : 'bg-slate-800'
                          }`} />
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-slate-950 transition-transform ${
                            inv.auto_reinvest ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                          {toggleLoadingId === inv.id ? 'Updating...' : 'Auto-Reinvest Capital'}
                        </span>
                      </label>

                      {/* Terminate button */}
                      <button
                        onClick={() => {
                          setTerminatingInv(inv);
                          setTerminationError(null);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold transition-all text-center"
                      >
                        Terminate Early
                      </button>
                    </div>
                  )}

                  {isPendingTermination && (
                    <div className="p-3 rounded-xl bg-amber-950/10 border border-amber-500/20 text-[10px] text-amber-400 flex items-start space-x-2">
                      <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Early termination pending admin review. Principal minus 10% penalty will refund to wallet.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Purchase Confirmation */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button 
              title="Close Modal"
              aria-label="Close Modal"
              onClick={() => setSelectedPkg(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Confirm Investment</h3>
              <p className="text-xs text-slate-400 mt-1">Subscribe to the premium wealth class</p>
            </div>

            {purchaseError && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{purchaseError}</span>
              </div>
            )}

            {purchaseSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Subscription successful! Allocation has started.</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 font-mono text-xs space-y-2.5 text-slate-400">
              <div className="flex justify-between">
                <span>Selected Package:</span>
                <span className="text-white font-bold uppercase">{selectedPkg.name} Level</span>
              </div>
              <div className="flex justify-between">
                <span>Capital Required:</span>
                <span className="text-white font-bold">{formatNaira(selectedPkg.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Guaranteed Yield Rate:</span>
                <span className="text-emerald-400 font-bold">25.00% APR</span>
              </div>
              <div className="flex justify-between border-t border-slate-900 pt-2 text-slate-500">
                <span>My Wallet Balance:</span>
                <span className={walletBalance >= selectedPkg.amount ? 'text-white' : 'text-red-400'}>
                  {formatNaira(walletBalance)}
                </span>
              </div>
            </div>

            {walletBalance >= selectedPkg.amount ? (
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
                  <input 
                    type="checkbox"
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                    checked={autoReinvestOpt}
                    onChange={(e) => setAutoReinvestOpt(e.target.checked)}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-200 uppercase">Auto-Reinvest On Maturity</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Pay accrued interest and roll over capital</div>
                  </div>
                </label>

                <button
                  onClick={handlePurchase}
                  disabled={purchaseLoading}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {purchaseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Execute Subscription</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-red-950/10 border border-red-500/10 text-[10px] text-red-400/80 leading-normal">
                  Your active balance is insufficient to purchase this package. Fund your wallet to allocate this capital.
                </div>
                <button
                  onClick={() => router.push('/dashboard/wallet?action=deposit')}
                  className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
                >
                  Go to Wallet Deposit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Early Termination Confirmation */}
      {terminatingInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button 
              title="Close Modal"
              aria-label="Close Modal"
              onClick={() => setTerminatingInv(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Early Termination Request</h3>
              <p className="text-xs text-slate-400 mt-1">Review penalty and locking waiver conditions</p>
            </div>

            {terminationError && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{terminationError}</span>
              </div>
            )}

            {terminationSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Termination requested! Pending admin clearance.</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 font-mono text-xs space-y-2.5 text-slate-400">
              <div className="flex justify-between">
                <span>Original Capital:</span>
                <span className="text-white font-bold">{formatNaira(terminatingInv.amount)}</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>Early Termination Penalty (10%):</span>
                <span>- {formatNaira(terminatingInv.amount * 0.10)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-900 pt-2 text-sm">
                <span>Refund Payout to Wallet:</span>
                <span>{formatNaira(terminatingInv.amount * 0.90)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/10 border border-amber-500/20 text-[10px] text-amber-400/80 leading-normal space-y-2">
              <p><strong>Lock-In Protocol WAIVER terms:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>A 10.00% capital penalty is immediately deducted from the principal.</li>
                <li>Refund payout is subject to a 30-day processing wait period.</li>
                <li>Accrued interest will be forfeited.</li>
              </ul>
            </div>

            <button
              onClick={handleEarlyTermination}
              disabled={terminationLoading}
              className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {terminationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Accept Terms & Submit Request</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
