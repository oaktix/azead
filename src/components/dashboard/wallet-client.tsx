'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2 
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
  const [transactions] = useState(initialTransactions);
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
          <p className="text-xs text-muted mt-1">Fund your wallet or request manual withdrawals</p>
        </div>
      </div>

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

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground font-heading px-1">Ledger Transaction Logs</h3>
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[360px] overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-xs text-muted text-center py-6">No transactions recorded.</p>
              ) : (
                <div className="space-y-4 divide-y divide-border">
                  {transactions.map((tx, idx) => {
                    const isCredit = Number(tx.amount) > 0;
                    const formattedDate = new Date(tx.created_at).toLocaleString();
                    
                    return (
                      <div key={tx.id} className={`flex justify-between items-center ${idx > 0 ? 'pt-4' : ''}`}>
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${isCredit ? 'bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 dark:bg-red-950/50 text-red-600 dark:text-red-400'}`}>
                            {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-foreground capitalize truncate max-w-[125px]">{tx.description || tx.type.replace('_', ' ')}</div>
                            <div className="text-[8px] text-muted mt-0.5 font-mono">{formattedDate}</div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className={`text-xs font-bold font-mono ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                            {isCredit ? '+' : ''}{formatNaira(tx.amount).replace('.00', '')}
                          </div>
                          <span className="text-[8px] font-mono text-muted uppercase bg-secondary px-1.5 py-0.5 rounded border border-border mt-0.5 inline-block">
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

      </div>
    </div>
  );
}
