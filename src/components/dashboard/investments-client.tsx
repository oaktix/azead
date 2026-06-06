'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Award, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  X,
  Coins,
  TrendingUp
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

  // The single customizable package template
  const wealthPlanPkg = packages.find(p => p.id === 'cb92d8bc-c10b-4611-8583-bdd5a1cd0d68') || packages[0];

  // Calculator states
  const [amountInput, setAmountInput] = useState<number>(1000000);
  const [durationYears, setDurationYears] = useState<number>(1);
  const [inputError, setInputError] = useState<string | null>(null);

  // Subscription modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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

  const handleOpenConfirm = () => {
    if (amountInput < 1000000) {
      setInputError('Minimum investment amount is ₦1,000,000');
      return;
    }
    setInputError(null);
    setIsConfirmOpen(true);
  };

  const handlePurchase = async () => {
    if (!wealthPlanPkg) return;
    setPurchaseLoading(true);
    setPurchaseError(null);
    setPurchaseSuccess(false);

    try {
      const response = await fetch('/api/investments/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: wealthPlanPkg.id,
          amount: amountInput,
          durationYears: durationYears,
          autoReinvest: autoReinvestOpt,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to complete subscription');
      }

      setPurchaseSuccess(true);
      setTimeout(() => {
        setIsConfirmOpen(false);
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

  // Calculator outputs
  const annualInterestRate = 25.00;
  const estimatedInterest = amountInput * (annualInterestRate / 100) * durationYears;
  const totalPayout = amountInput + estimatedInterest;

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      
      {/* Overview page titles */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">Structured Investments</h1>
        <p className="text-xs text-muted mt-1 font-sans">Secure your future with the customized Azead Wealth Plan locked at 25.00% APR.</p>
      </div>

      {/* Customizable Investment Calculator */}
      <div className="grid md:grid-cols-5 gap-8 items-start">
        
        {/* Form panel */}
        <div className="md:col-span-3 p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-2 border-b border-border">
            <Coins className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-foreground font-heading">Azead Wealth Plan</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="amount-input" className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                Principal Investment Amount (NGN)
              </label>
              <div className="relative mt-1 rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="text-foreground/70 font-bold font-mono">₦</span>
                </div>
                <input
                  id="amount-input"
                  type="number"
                  name="amount"
                  min="1000000"
                  step="100000"
                  value={amountInput}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAmountInput(val);
                    if (val < 1000000) {
                      setInputError('Minimum investment amount is ₦1,000,000');
                    } else {
                      setInputError(null);
                    }
                  }}
                  className="block w-full rounded-xl border-border bg-secondary/30 py-3.5 pl-9 pr-4 text-foreground font-mono text-sm focus:border-emerald-500 focus:ring-emerald-500 placeholder-muted/50 transition-all border"
                  placeholder="1,000,000"
                />
              </div>
              {inputError ? (
                <p className="text-xs text-red-500 mt-1.5 flex items-center space-x-1">
                  <span>⚠</span> <span>{inputError}</span>
                </p>
              ) : (
                <p className="text-[10px] text-muted mt-1.5 font-sans">Enter an amount of ₦1,000,000 or more.</p>
              )}
            </div>

            <div>
              <label htmlFor="duration-select" className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                Lock-in Term (Duration)
              </label>
              <select
                id="duration-select"
                value={durationYears}
                onChange={(e) => setDurationYears(Number(e.target.value))}
                className="block w-full rounded-xl border-border bg-secondary/30 py-3.5 px-4 text-foreground text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all border"
              >
                <option value={1}>1 Year (365 Days)</option>
                <option value={2}>2 Years (730 Days)</option>
                <option value={3}>3 Years (1095 Days)</option>
                <option value={5}>5 Years (1825 Days)</option>
              </select>
              <p className="text-[10px] text-muted mt-1.5 font-sans">Annual yield rate is fixed at 25.00% APR.</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleOpenConfirm}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <span>Subscribe to Plan</span>
            </button>
          </div>
        </div>

        {/* Calculation summary panel */}
        <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-emerald-950/20 to-slate-950/40 border border-emerald-500/20 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-2 border-b border-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-foreground font-heading">Expected Returns</h2>
          </div>

          <div className="space-y-4 font-sans">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Interest Rate (Fixed)</span>
              <span className="font-bold text-emerald-400 font-mono">25.00% / Year</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Lock-in Duration</span>
              <span className="font-bold text-white">{durationYears} {durationYears === 1 ? 'Year' : 'Years'}</span>
            </div>

            <div className="border-t border-border/30 pt-4 flex justify-between items-center">
              <span className="text-xs text-muted">Principal Capital</span>
              <span className="text-sm font-bold text-foreground font-mono">{formatNaira(amountInput).replace('.00', '')}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Accrued Profit</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">+{formatNaira(estimatedInterest).replace('.00', '')}</span>
            </div>

            <div className="border-t border-emerald-500/20 pt-4 space-y-1 bg-emerald-500/5 p-4 rounded-xl border">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Total Payout at Maturity</span>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-mono leading-none pt-1">
                {formatNaira(totalPayout)}
              </div>
              <p className="text-[9px] text-muted pt-1">Includes both principal and guaranteed interest.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Active & Historical Investments */}
      <div className="space-y-6 border-t border-border pt-10">
        <h2 className="text-lg font-bold text-foreground font-heading px-1">My Active & Completed Positions</h2>
        
        {investments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card/30 border border-border text-center text-muted text-sm">
            You do not currently hold any active investment positions. Use the calculator above to subscribe.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {investments.map((inv) => {
              const pkgName = inv.package_name || inv.investment_packages?.name || 'Azead Wealth Plan';
              const isPendingTermination = inv.status === 'early_termination_pending';
              const isCompleted = inv.status === 'completed';
              const isActive = inv.status === 'active';
              
              const start = new Date(inv.start_date);
              const end = new Date(inv.maturity_date);

              // Calculate actual lock-in years of this record
              const durationDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              const years = Math.max(1, Math.round(durationDays / 365));
              
              return (
                <div key={inv.id} className="p-6 rounded-2xl bg-card border border-border shadow-xl flex flex-col justify-between space-y-6">
                  
                  {/* Row Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-foreground font-heading uppercase">{pkgName}</h4>
                      <div className="text-[10px] text-muted mt-1 font-mono">
                        Reference: {inv.id.substring(0, 8).toUpperCase()} | Term: {years} {years === 1 ? 'Year' : 'Years'}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide ${
                      isActive ? 'bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                      isPendingTermination ? 'bg-amber-500/10 dark:bg-amber-950/60 border border-amber-500/20 text-amber-800 dark:text-amber-400' :
                      isCompleted ? 'bg-blue-500/10 dark:bg-blue-950/60 border border-blue-500/20 text-blue-600 dark:text-blue-400' :
                      'bg-muted/10 border border-border text-muted'
                    }`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Body Numbers */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono text-muted border-t border-b border-border py-4">
                    <div>
                      <span className="text-[10px] text-muted">Principal Capital</span>
                      <div className="text-sm font-bold text-foreground mt-0.5 font-mono">{formatNaira(inv.amount)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted">Yield APR</span>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">{inv.interest_rate}% APR</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted">Start Date</span>
                      <div className="text-foreground mt-0.5">{start.toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted">Maturity Date</span>
                      <div className="text-foreground mt-0.5">{end.toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Actions / Switches */}
                  {isActive && (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-secondary/20 border border-border p-3 rounded-xl">
                      
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
                            inv.auto_reinvest ? 'bg-emerald-500' : 'bg-muted/30'
                          }`} />
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-card transition-transform ${
                            inv.auto_reinvest ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </div>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wide">
                          {toggleLoadingId === inv.id ? 'Updating...' : 'Auto-Reinvest Capital'}
                        </span>
                      </label>

                      {/* Terminate button */}
                      <button
                        onClick={() => {
                          setTerminatingInv(inv);
                          setTerminationError(null);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 text-[10px] font-bold transition-all text-center"
                      >
                        Terminate Early
                      </button>
                    </div>
                  )}

                  {isPendingTermination && (
                    <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-400 flex items-start space-x-2">
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
      {isConfirmOpen && wealthPlanPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200">
            <button 
              title="Close Modal"
              aria-label="Close Modal"
              onClick={() => setIsConfirmOpen(false)}
              className="absolute top-4 right-4 p-1 text-muted hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-950 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Confirm Investment</h3>
              <p className="text-xs text-muted mt-1 font-sans">Subscribe to the premium wealth class</p>
            </div>

            {purchaseError && (
              <div className="p-4 rounded-xl bg-red-500/10 dark:bg-red-950/20 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{purchaseError}</span>
              </div>
            )}

            {purchaseSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Subscription successful! Allocation has started.</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-muted/10 border border-border font-mono text-xs space-y-2.5 text-muted">
              <div className="flex justify-between">
                <span>Selected Plan:</span>
                <span className="text-foreground font-bold uppercase">{wealthPlanPkg.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Capital Required:</span>
                <span className="text-foreground font-bold">{formatNaira(amountInput)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lock-in Duration:</span>
                <span className="text-foreground font-bold">{durationYears} {durationYears === 1 ? 'Year' : 'Years'} ({durationYears * 365} Days)</span>
              </div>
              <div className="flex justify-between">
                <span>Guaranteed Yield Rate:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">25.00% APR</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-muted">
                <span>My Wallet Balance:</span>
                <span className={walletBalance >= amountInput ? 'text-foreground' : 'text-red-500'}>
                  {formatNaira(walletBalance)}
                </span>
              </div>
            </div>

            {walletBalance >= amountInput ? (
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer p-3 bg-secondary/20 border border-border rounded-xl">
                  <input 
                    type="checkbox"
                    className="rounded border-border text-emerald-500 focus:ring-emerald-500 bg-card"
                    checked={autoReinvestOpt}
                    onChange={(e) => setAutoReinvestOpt(e.target.checked)}
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground uppercase">Auto-Reinvest On Maturity</div>
                    <div className="text-[10px] text-muted mt-0.5">Pay accrued interest and roll over capital</div>
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
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-700 dark:text-red-400/80 leading-normal">
                  Your active balance is insufficient to purchase this package. Fund your wallet to allocate this capital.
                </div>
                <button
                  onClick={() => router.push('/dashboard/wallet?action=deposit')}
                  className="w-full py-3.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-bold text-sm transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button 
              title="Close Modal"
              aria-label="Close Modal"
              onClick={() => setTerminatingInv(null)}
              className="absolute top-4 right-4 p-1 text-muted hover:text-foreground rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 dark:bg-red-950/40 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Early Termination Request</h3>
              <p className="text-xs text-muted mt-1">Review penalty and locking waiver conditions</p>
            </div>

            {terminationError && (
              <div className="p-4 rounded-xl bg-red-500/10 dark:bg-red-950/20 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{terminationError}</span>
              </div>
            )}

            {terminationSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Termination requested! Pending admin clearance.</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-muted/10 border border-border font-mono text-xs space-y-2.5 text-muted">
              <div className="flex justify-between">
                <span>Original Capital:</span>
                <span className="text-foreground font-bold">{formatNaira(terminatingInv.amount)}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Early Termination Penalty (10%):</span>
                <span>- {formatNaira(terminatingInv.amount * 0.10)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t border-border pt-2 text-sm">
                <span>Refund Payout to Wallet:</span>
                <span>{formatNaira(terminatingInv.amount * 0.90)}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-400/80 leading-normal space-y-2">
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
              className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
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
