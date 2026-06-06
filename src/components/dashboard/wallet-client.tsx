'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Lock,
  ShieldCheck,
  X,
  Copy,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Gift,
  ShieldAlert,
  Filter,
  Search,
  BarChart3,
  Zap
} from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  reference: string;
  description: string;
  created_at: string;
}

interface WalletClientProps {
  initialBalance: number;
  transactions: Transaction[];
}

export default function WalletClient({
  initialBalance,
  transactions: initialTransactions,
}: WalletClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [balance, setBalance] = useState(initialBalance);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>(
    searchParams.get('action') === 'withdraw' ? 'withdraw' : 'deposit'
  );
  
  // Deposit States
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Withdrawal States
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Transaction details modal states
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Real-time notification
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  // ─── Supabase Real-Time Listener ───
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('user-wallet-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
        },
        (payload) => {
          const newTx = payload.new as Transaction;
          // Add to front of list with animation trigger
          setTransactions((prev) => [newTx, ...prev]);
          setBalance((prev) => prev + Number(newTx.amount));
          setRealtimeNotice(`New ${newTx.type.replace(/_/g, ' ')}: ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(newTx.amount)}`);
          setTimeout(() => setRealtimeNotice(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const copyToReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Fee calculation (1.9% of withdrawal amount)
  const numWithdrawAmount = Number(withdrawAmount) || 0;
  const withdrawFee = numWithdrawAmount * 0.019;
  const netPayout = Math.max(0, numWithdrawAmount - withdrawFee);

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  // ─── Analytics ───
  const totalIn = useMemo(() =>
    transactions.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  );
  const totalOut = useMemo(() =>
    transactions.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
    [transactions]
  );
  const maxBar = Math.max(totalIn, totalOut, 1);

  // ─── Filtered Transactions ───
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        tx.reference.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q);

      const matchesType = typeFilter === 'all' || tx.type === typeFilter;

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && new Date(tx.created_at) >= new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        matchesDate = matchesDate && new Date(tx.created_at) < end;
      }

      let matchesAmount = true;
      const absAmt = Math.abs(Number(tx.amount));
      if (minAmount) matchesAmount = matchesAmount && absAmt >= Number(minAmount);
      if (maxAmount) matchesAmount = matchesAmount && absAmt <= Number(maxAmount);

      return matchesSearch && matchesType && matchesDate && matchesAmount;
    });
  }, [transactions, searchQuery, typeFilter, startDate, endDate, minAmount, maxAmount]);

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || startDate || endDate || minAmount || maxAmount;

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
  };

  // ─── CSV Export ───
  const handleExportCSV = () => {
    const params = new URLSearchParams();
    params.set('scope', 'user');
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (searchQuery) params.set('search', searchQuery);
    if (minAmount) params.set('minAmount', minAmount);
    if (maxAmount) params.set('maxAmount', maxAmount);
    window.open(`/api/ledger/export?${params.toString()}`, '_blank');
  };

  // ─── Print ───
  const handlePrint = () => {
    window.print();
  };

  // ─── Type helpers ───
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-3.5 h-3.5" />;
      case 'withdrawal': return <ArrowUpRight className="w-3.5 h-3.5" />;
      case 'investment_debit': return <TrendingDown className="w-3.5 h-3.5" />;
      case 'investment_payout': return <TrendingUp className="w-3.5 h-3.5" />;
      case 'referral_bonus': return <Gift className="w-3.5 h-3.5" />;
      default: return <ShieldAlert className="w-3.5 h-3.5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'withdrawal': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'investment_debit': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'investment_payout': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'referral_bonus': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-muted bg-muted/10 border-border';
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    setDepositError(null);

    const amountNum = Number(depositAmount);
    if (!amountNum || amountNum <= 0) {
      setDepositError('Please enter a valid deposit amount.');
      setDepositLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/deposits/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNum }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to initialize deposit');
      }

      if (resData.checkoutUrl) {
        // Redirect to external Transactpay checkout page
        window.location.href = resData.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: unknown) {
    const errorObj = err as Error;
      setDepositError(errorObj.message || 'An unexpected error occurred.');
      setDepositLoading(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawError(null);
    setWithdrawSuccess(false);

    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount.');
      setWithdrawLoading(false);
      return;
    }

    if (amountNum > balance) {
      setWithdrawError('Insufficient balance in wallet.');
      setWithdrawLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/withdrawals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          bankName,
          accountNumber,
          accountName,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to request withdrawal');
      }

      setWithdrawSuccess(true);
      setBalance(prev => prev - amountNum);
      
      // Clear inputs
      setWithdrawAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      
      // Refresh router data
      router.refresh();
    } catch (err: unknown) {
    const errorObj = err as Error;
      setWithdrawError(errorObj.message || 'An unexpected error occurred.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">Wallet Ledger</h1>
          <p className="text-xs text-muted mt-1">Fund your wallet, request withdrawals, and track all financial activity</p>
        </div>
      </div>

      {/* Real-time notification banner */}
      {realtimeNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
          <Zap className="w-4 h-4" />
          <span>{realtimeNotice}</span>
          <button onClick={() => setRealtimeNotice(null)} className="ml-auto p-0.5 rounded hover:bg-emerald-500/20 transition-colors" title="Dismiss notification">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Left Side: Deposit / Withdrawal Forms */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-1 rounded-xl bg-secondary/40 border border-border flex">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'deposit' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              Deposit Funds
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'withdraw' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              Request Withdrawal
            </button>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xl">
            {activeTab === 'deposit' ? (
              <form onSubmit={handleDeposit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground font-heading">Credit Wallet</h3>
                  <p className="text-xs text-muted mt-1">Payments are processed instantly and credited automatically using Transactpay.</p>
                </div>

                {depositError && (
                  <div className="p-4 rounded-xl bg-red-500/10 dark:bg-red-950/20 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{depositError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Deposit Amount (NGN)
                  </label>
                  <input
                    type="number"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground text-sm font-mono focus:outline-none focus:border-primary"
                    placeholder="Enter amount (e.g. 500000)"
                    min="1000"
                  />
                  <div className="flex gap-2 mt-2">
                    {[100000, 500000, 1000000].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setDepositAmount(String(amt))}
                        className="text-[10px] bg-secondary hover:bg-secondary/80 text-muted hover:text-foreground border border-border px-2.5 py-1 rounded transition-colors"
                      >
                        {formatNaira(amt).replace('.00', '')}
                      </button>
                    ))}
                  </div>

                  {Number(depositAmount) > 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border/80 font-sans text-xs space-y-2 text-muted animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex justify-between">
                        <span>Gateway Processor Fee:</span>
                        <span className="font-semibold text-foreground">Free (₦0.00)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Settlement Speed:</span>
                        <span className="font-semibold text-emerald-400 font-bold">Instant Credit</span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-2 text-foreground font-bold">
                        <span>Amount to Credit:</span>
                        <span className="font-mono text-emerald-400">{formatNaira(Number(depositAmount))}</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={depositLoading}
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {depositLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Initialize Checkout Link</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleWithdrawal} className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-foreground font-heading">Withdraw Funds</h3>
                  <p className="text-xs text-muted mt-1">Withdrawals are processed manually within 24 hours. A transaction fee of 1.9% applies.</p>
                </div>

                {withdrawError && (
                  <div className="p-4 rounded-xl bg-red-500/10 dark:bg-red-950/20 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{withdrawError}</span>
                  </div>
                )}

                {withdrawSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Withdrawal request submitted successfully! Funds will credit upon admin approval.</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                      Amount to Withdraw (NGN)
                    </label>
                    <input
                      type="number"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-mono focus:outline-none focus:border-primary"
                      placeholder="e.g. 50000"
                      min="500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
                      placeholder="Access Bank"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                      Account Number (10 digits)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      pattern="\d{10}"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-mono focus:outline-none focus:border-primary"
                      placeholder="0123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                      Account Name
                    </label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {numWithdrawAmount > 0 && (
                  <div className="p-4 rounded-xl bg-muted/10 border border-border space-y-2 font-mono text-xs text-muted">
                    <div className="flex justify-between">
                      <span>Requested Gross Amount:</span>
                      <span className="text-foreground">{formatNaira(numWithdrawAmount)}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>Processing Fee (1.9%):</span>
                      <span>- {formatNaira(withdrawFee)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t border-border pt-2 text-sm">
                      <span>Estimated Payout:</span>
                      <span>{formatNaira(netPayout)}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawLoading}
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {withdrawLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Submit Withdrawal Request</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Ledger Balance & Statement */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xl text-center space-y-2.5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Account Active Balance</div>
            <div className="text-3xl font-extrabold text-foreground font-mono">{formatNaira(balance)}</div>
            <p className="text-[9px] text-muted leading-normal max-w-xs mx-auto">
              This balance is backed by auditable ledger records and updates in real-time on verified transactions.
            </p>
          </div>

          {/* Cash Flow Analytics Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-muted" />
              <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Cash Flow Summary</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted font-semibold w-[50px] shrink-0">Cash In</span>
                <div className="flex-1 h-3 bg-secondary/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700 bar-fill"
                    {...{ style: { '--bar-w': `${Math.max(2, (totalIn / maxBar) * 100)}%` } as React.CSSProperties }}
                  />
                </div>
                <span className="text-[9px] font-mono font-bold text-emerald-400 w-[80px] text-right shrink-0">
                  {formatNaira(totalIn)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted font-semibold w-[50px] shrink-0">Cash Out</span>
                <div className="flex-1 h-3 bg-secondary/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-700 bar-fill"
                    {...{ style: { '--bar-w': `${Math.max(2, (totalOut / maxBar) * 100)}%` } as React.CSSProperties }}
                  />
                </div>
                <span className="text-[9px] font-mono font-bold text-red-400 w-[80px] text-right shrink-0">
                  {formatNaira(totalOut)}
                </span>
              </div>
            </div>
          </div>

          {/* Ledger Logs Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-foreground font-heading">Ledger Transaction Logs</h3>
              <div className="flex gap-1.5">
                <button
                  onClick={handleExportCSV}
                  className="p-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-muted hover:text-foreground transition-colors"
                  title="Export as CSV"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Search & Filters for Ledger */}
            <div className="p-3 rounded-xl bg-card border border-border shadow-sm space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2 w-3 h-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg pl-7 pr-3 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  title="Filter type"
                  className="bg-input border border-border rounded-lg px-2 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="all">All</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="investment_debit">Invest</option>
                  <option value="investment_payout">Payout</option>
                  <option value="referral_bonus">Referral</option>
                </select>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary/40 border-border text-muted'
                  }`}
                  title="Advanced filters"
                >
                  <Filter className="w-3 h-3" />
                </button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label htmlFor="user-filter-start-date" className="block text-[8px] text-muted font-bold uppercase mb-1">
                      <Calendar className="w-2.5 h-2.5 inline mr-0.5" />From
                    </label>
                    <input id="user-filter-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="user-filter-end-date" className="block text-[8px] text-muted font-bold uppercase mb-1">
                      <Calendar className="w-2.5 h-2.5 inline mr-0.5" />To
                    </label>
                    <input id="user-filter-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[8px] text-muted font-bold uppercase mb-1">
                      <DollarSign className="w-2.5 h-2.5 inline mr-0.5" />Min ₦
                    </label>
                    <input type="number" placeholder="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-[10px] text-foreground font-mono focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[8px] text-muted font-bold uppercase mb-1">
                      <DollarSign className="w-2.5 h-2.5 inline mr-0.5" />Max ₦
                    </label>
                    <input type="number" placeholder="∞" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-[10px] text-foreground font-mono focus:outline-none focus:border-primary" />
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters}
                      className="col-span-2 text-[9px] font-bold text-red-500 hover:text-red-400 transition-colors py-1">
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Results Count */}
            {hasActiveFilters && (
              <div className="text-[9px] text-muted font-semibold px-1">
                {filteredTransactions.length} of {transactions.length} records
              </div>
            )}

            {/* Transaction List */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[400px] overflow-y-auto">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-secondary/40 border border-border flex items-center justify-center">
                    <Search className="w-4 h-4 text-muted/50" />
                  </div>
                  <p className="text-xs font-bold text-foreground">No matching records</p>
                  <p className="text-[10px] text-muted">
                    {hasActiveFilters ? 'Try adjusting your filters.' : 'No transactions recorded yet.'}
                  </p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-[10px] text-primary font-bold hover:underline">
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-border">
                  {filteredTransactions.map((tx, idx) => {
                    const isCredit = Number(tx.amount) > 0;
                    const formattedDate = new Date(tx.created_at).toLocaleString();
                    
                    return (
                      <div 
                        key={tx.id} 
                        onClick={() => setSelectedTx(tx)}
                        className={`flex justify-between items-center cursor-pointer hover:bg-secondary/40 p-2 -mx-2 rounded-xl transition-all ${idx > 0 ? 'mt-2' : ''}`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${isCredit ? 'bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 dark:bg-red-950/50 text-red-600 dark:text-red-400'}`}>
                            {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-foreground capitalize truncate max-w-[125px]">{tx.description || tx.type.replace(/_/g, ' ')}</div>
                            <div className="text-[8px] text-muted mt-0.5 font-mono">{formattedDate}</div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className={`text-xs font-bold font-mono ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                            {isCredit ? '+' : ''}{formatNaira(tx.amount).replace('.00', '')}
                          </div>
                          <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border mt-0.5 inline-block ${getTypeColor(tx.type)}`}>
                            {tx.type.replace(/_/g, ' ')}
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

      </div>

      {depositLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm p-8 rounded-2xl bg-card border border-border/80 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border-2 border-t-emerald-400 animate-spin" />
              <Lock className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground font-heading">Securing Connection...</h3>
              <p className="text-xs text-muted leading-relaxed">
                Opening an encrypted checkout tunnel to Transactpay. Please do not close or reload this page.
              </p>
            </div>

            <div className="py-2.5 px-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-center space-x-2 text-[10px] text-muted font-mono tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSL SECURE HANDSHAKE ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* ====== USER TRANSACTION RECEIPT MODAL ====== */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-250 no-print">
          <div 
            ref={receiptRef}
            className="w-full max-w-sm p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200 print-receipt"
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
              <span className="text-[60px] font-black font-heading text-foreground tracking-widest rotate-[-30deg]">AZEAD</span>
            </div>

            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-border relative z-10">
              <div>
                <h3 className="text-sm font-bold text-foreground font-heading">Transaction Receipt</h3>
                <p className="text-[9px] text-muted font-mono uppercase tracking-wider mt-0.5">ID: {selectedTx.id}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handlePrint}
                  className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted hover:text-foreground transition-colors"
                  title="Print receipt"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted hover:text-foreground transition-colors"
                  title="Close receipt"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Receipt Amount Header */}
            <div className="text-center py-6 bg-secondary/20 rounded-2xl border border-border relative z-10">
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border flex items-center gap-1 w-fit ${getTypeColor(selectedTx.type)}`}>
                  {getTypeIcon(selectedTx.type)}
                  <span>{selectedTx.type.replace(/_/g, ' ')}</span>
                </span>
              </div>
              <span className="text-[10px] text-muted uppercase tracking-wider font-bold block mb-1">Transaction Value</span>
              <div className={`text-2xl font-black font-mono tracking-tight ${Number(selectedTx.amount) >= 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                {Number(selectedTx.amount) >= 0 ? '+' : ''}{formatNaira(selectedTx.amount)}
              </div>
            </div>

            {/* Audit Properties */}
            <div className="space-y-4 text-xs relative z-10">
              <div className="grid grid-cols-3 py-2 border-b border-border/50">
                <span className="text-muted font-semibold">Classification</span>
                <span className="col-span-2 text-foreground font-bold text-right uppercase tracking-wider font-mono text-[10px]">{selectedTx.type.replace(/_/g, ' ')}</span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-border/50 items-center">
                <span className="text-muted font-semibold">Reference</span>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className="text-foreground font-mono font-bold">{selectedTx.reference}</span>
                  <button 
                    onClick={() => copyToReference(selectedTx.reference)}
                    className="p-1 rounded bg-secondary hover:bg-secondary/80 text-muted hover:text-foreground transition-colors no-print"
                    title="Copy reference code"
                  >
                    {copiedRef ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-border/50">
                <span className="text-muted font-semibold">Processed Date</span>
                <span className="col-span-2 text-foreground text-right">{new Date(selectedTx.created_at).toLocaleString()}</span>
              </div>
              <div className="py-2 space-y-1">
                <span className="text-muted font-semibold block">Memo Description</span>
                <p className="p-3 bg-secondary/30 border border-border/80 rounded-xl text-foreground/95 font-sans leading-normal">
                  {selectedTx.description || selectedTx.type.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {/* Security stamp */}
            <div className="flex items-center justify-center gap-2 text-[9px] text-muted/60 font-mono uppercase tracking-widest relative z-10 pt-2 border-t border-border/30">
              <ShieldAlert className="w-3 h-3" />
              <span>AZEAD • Wallet Receipt • Verified</span>
            </div>

            {/* Close action button */}
            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-2xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-xs transition-all shadow-md relative z-10 no-print"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
