'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Wallet, 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface Investment {
  id: string;
  amount: number;
  interest_rate: number;
  status: string;
  start_date: string;
  maturity_date: string;
  last_accrual_date: string;
  accrued_interest: number;
  package_name?: string;
  investment_packages?: {
    name: string;
  };
}

interface LedgerTransaction {
  id: string;
  amount: number | string;
  type: string;
  description?: string;
  created_at: string;
}

interface DashboardClientProps {
  initialProfile: {
    first_name: string;
    last_name: string;
    kyc_status: string;
    referral_code: string;
  };
  initialWallet: {
    balance: number;
  };
  initialInvestments: Investment[];
  initialTransactions: LedgerTransaction[];
  initialReferralCount: number;
}

export default function DashboardClient({
  initialProfile,
  initialWallet,
  initialInvestments,
  initialTransactions,
  initialReferralCount,
}: DashboardClientProps) {
  const [walletBalance] = useState(initialWallet.balance);
  const [investments] = useState<Investment[]>(initialInvestments);
  const [transactions] = useState<LedgerTransaction[]>(initialTransactions);
  
  // Real-time accrual ticking state
  const [liveAccrual, setLiveAccrual] = useState<number>(0);
  const requestRef = useRef<number | null>(null);

  // Calculate live accrual across all active investments
  const tickAccrual = React.useCallback(function tick() {
    let totalLive = 0;
    const nowMs = Date.now();

    investments.forEach((inv) => {
      if (inv.status !== 'active') return;

      const lastAccrualMs = new Date(inv.last_accrual_date).getTime();
      const maturityDateMs = new Date(inv.maturity_date).getTime();
      
      const ratePerMs = (inv.interest_rate / 100) / (365 * 24 * 3600 * 1000);
      
      let effectiveNowMs = nowMs;
      if (nowMs > maturityDateMs) {
        effectiveNowMs = maturityDateMs; // cap at maturity
      }

      const elapsedMs = Math.max(0, effectiveNowMs - lastAccrualMs);
      const additionalAccrual = inv.amount * ratePerMs * elapsedMs;
      const totalInvAccrual = Number(inv.accrued_interest) + additionalAccrual;
      
      totalLive += totalInvAccrual;
    });

    setLiveAccrual(totalLive);
    requestRef.current = requestAnimationFrame(tick);
  }, [investments]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tickAccrual);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [tickAccrual]);

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 4,
    }).format(val);
  };

  const formatNairaTwoDecimals = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Helper calculations
  const totalActiveInvestmentsAmount = investments
    .filter(inv => inv.status === 'active')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Alert if KYC is not verified */}
      {initialProfile.kyc_status !== 'verified' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 text-sm text-amber-800 dark:text-amber-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Identity Verification (KYC) Required</div>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">Please upload your government-issued ID to activate withdrawal approvals and full portfolio management.</p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors flex-shrink-0">
            Submit ID Details
          </Link>
        </div>
      )}

      {/* Main Grid: Balance Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Wallet Balance */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl flex flex-col justify-between h-44 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Wallet Balance</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
              {formatNairaTwoDecimals(walletBalance)}
            </div>
            <div className="text-[10px] text-muted mt-1">Available for investments or withdrawal</div>
          </div>
          <div className="flex space-x-3 pt-2">
            <Link href="/dashboard/wallet?action=deposit" className="flex-1 text-center py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-colors">
              Deposit
            </Link>
            <Link href="/dashboard/wallet?action=withdraw" className="flex-1 text-center py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border text-xs font-semibold transition-colors">
              Withdraw
            </Link>
          </div>
        </div>

        {/* Live Accrual */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl flex flex-col justify-between h-44 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Accruing Interest (Live)</span>
            <div className="p-2 rounded-lg bg-teal-500/10 dark:bg-teal-950/50 border border-teal-500/20 text-teal-600 dark:text-teal-400 animate-pulse">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight accrual-glow">
              {formatNaira(liveAccrual)}
            </div>
            <div className="text-[10px] text-muted mt-1">Interest accrues progressive per millisecond</div>
          </div>
          <div className="text-[10px] text-muted flex items-center space-x-1.5 pt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Payout occurs automatically on maturity date</span>
          </div>
        </div>

        {/* Portfolio Assets */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl flex flex-col justify-between h-44 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Total Active Capital</span>
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-950/50 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
              {formatNairaTwoDecimals(totalActiveInvestmentsAmount)}
            </div>
            <div className="text-[10px] text-muted mt-1">Locked in structured packages</div>
          </div>
          <Link href="/dashboard/investments" className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center space-x-1 pt-2">
            <span>Configure Investments</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* Main Grid Bottom: Investments & Ledger Transactions */}
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Left Side: Active Packages */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-foreground font-heading">Active Portfolio Subscriptions</h3>
            <Link href="/dashboard/investments" className="text-xs text-muted hover:text-foreground">
              Manage all ({investments.length})
            </Link>
          </div>

          {investments.filter(inv => inv.status === 'active').length === 0 ? (
            <div className="p-8 rounded-2xl bg-card/30 border border-border text-center space-y-4">
              <p className="text-sm text-muted">You do not have any active investment packages.</p>
              <Link href="/dashboard/investments" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors">
                Subscribe to a Package
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {investments
                .filter(inv => inv.status === 'active')
                .map((inv) => {
                  const pkgName = inv.investment_packages?.name || 'Structured Plan';
                  const yieldEarned = Number(inv.accrued_interest);
                  
                  return (
                    <div key={inv.id} className="p-5 rounded-2xl bg-card border border-border shadow-lg flex justify-between items-center">
                      <div>
                        <div className="text-sm font-bold text-foreground font-heading uppercase">{pkgName} Level</div>
                        <div className="text-[10px] text-muted mt-1 font-mono">
                          Maturity: {new Date(inv.maturity_date).toLocaleDateString()}
                        </div>
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          <span>25% APR</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground font-mono">
                          {formatNairaTwoDecimals(inv.amount)}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">Principal Capital</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                          + {formatNairaTwoDecimals(yieldEarned)}
                        </div>
                        <div className="text-[9px] text-muted mt-0.5">Accrued to Ledger</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right Side: Ledger Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-foreground font-heading">Ledger Transactions</h3>
            <Link href="/dashboard/wallet" className="text-xs text-muted hover:text-foreground">
              Full Statement
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            {transactions.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No ledger logs found for this wallet.</p>
            ) : (
              <div className="space-y-4 divide-y divide-border">
                {transactions.map((tx, idx) => {
                  const isCredit = Number(tx.amount) > 0;
                  const formattedDate = new Date(tx.created_at).toLocaleDateString();
                  
                  return (
                    <div key={tx.id} className={`flex justify-between items-center ${idx > 0 ? 'pt-4' : ''}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isCredit ? 'bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 dark:bg-red-950/50 text-red-600 dark:text-red-400'}`}>
                          {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground capitalize truncate max-w-[130px]">
                            {tx.description || tx.type.replace('_', ' ')}
                          </div>
                          <div className="text-[9px] text-muted mt-0.5 font-mono">{formattedDate}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xs font-bold font-mono ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                          {isCredit ? '+' : ''}{formatNairaTwoDecimals(Number(tx.amount))}
                        </div>
                        <span className="text-[8px] font-mono text-muted bg-secondary px-1.5 py-0.5 rounded border border-border uppercase">
                          {tx.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Referral & KYC mini grid */}
      <div className="grid md:grid-cols-2 gap-6 pt-4">
        
        {/* Referral Card */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Referrals & Affiliates</h4>
            <div className="text-2xl font-extrabold text-foreground mt-1.5">{initialReferralCount} Users</div>
            <p className="text-[10px] text-muted mt-1">2.5% one-time bonus on referee purchases</p>
          </div>
          <Link href="/dashboard/referrals" className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border text-xs font-semibold transition-colors flex items-center gap-1.5">
            <span>Referrals Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* KYC Document Card */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xl flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider">KYC Compliance</h4>
            <div className="mt-1.5 flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                initialProfile.kyc_status === 'verified' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                initialProfile.kyc_status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-semibold capitalize text-foreground">{initialProfile.kyc_status}</span>
            </div>
            <p className="text-[10px] text-muted mt-1">NIN or Government ID submission</p>
          </div>
          <Link href="/dashboard/profile" className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border text-xs font-semibold transition-colors flex items-center gap-1.5">
            <span>Upload Document</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

    </div>
  );
}
