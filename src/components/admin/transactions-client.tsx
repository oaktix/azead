'use client';

import React, { useState } from 'react';
import { Search, History, Coins, ArrowUpRight, ArrowDownLeft, Gift, ShieldAlert } from 'lucide-react';

export interface TransactionItem {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'investment_debit' | 'investment_payout' | 'referral_bonus';
  reference: string;
  description: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

interface TransactionsClientProps {
  initialTransactions: TransactionItem[];
}

export default function TransactionsClient({ initialTransactions }: TransactionsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  const getIcon = (type: TransactionItem['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'investment_debit':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'investment_payout':
        return <ArrowDownLeft className="w-4 h-4 text-blue-400" />;
      case 'referral_bonus':
        return <Gift className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeColor = (type: TransactionItem['type']) => {
    switch (type) {
      case 'deposit':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      case 'withdrawal':
        return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'investment_debit':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'investment_payout':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      case 'referral_bonus':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-500';
      default:
        return 'bg-muted/10 border-border text-muted';
    }
  };

  const filteredTransactions = initialTransactions.filter((tx) => {
    const matchesSearch =
      tx.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' ? true : tx.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Calculate Metrics
  const totalDeposits = initialTransactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = initialTransactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalInvested = initialTransactions
    .filter((t) => t.type === 'investment_debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalReferrals = initialTransactions
    .filter((t) => t.type === 'referral_bonus')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading flex items-center gap-2">
          <History className="w-8 h-8 text-emerald-400" />
          <span>Transaction Logs</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Audit and view complete records of all deposits, withdrawals, investment debits, payouts, and referral commission bonuses.
        </p>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-md space-y-2">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total Deposits</span>
          <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
            {formatNaira(totalDeposits)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-md space-y-2">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total Withdrawals</span>
          <div className="text-base sm:text-lg font-bold text-red-400 font-mono">
            {formatNaira(totalWithdrawals)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-md space-y-2">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total Invested Volume</span>
          <div className="text-base sm:text-lg font-bold text-amber-400 font-mono">
            {formatNaira(totalInvested)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-md space-y-2">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Referral Commissions Paid</span>
          <div className="text-base sm:text-lg font-bold text-purple-400 font-mono">
            {formatNaira(totalReferrals)}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-card border border-border shadow-md">
        <div className="relative md:col-span-3">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by investor name, email, reference, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            title="Filter by transaction type"
            className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="investment_debit">Investment Debit</option>
            <option value="investment_payout">Investment Payout</option>
            <option value="referral_bonus">Referral Bonus</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xl overflow-x-auto">
        {filteredTransactions.length === 0 ? (
          <p className="text-xs text-muted text-center py-8">No transaction logs found.</p>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-muted border-b border-border pb-2">
                <th className="pb-3">Investor</th>
                <th className="pb-3">Reference / Date</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Description</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="align-middle hover:bg-muted/10 transition-colors">
                  <td className="py-4">
                    <div className="font-bold text-foreground">{tx.user_name}</div>
                    <div className="text-[10px] text-muted font-mono mt-0.5">{tx.user_email}</div>
                  </td>
                  <td className="py-4">
                    <div className="font-mono font-bold text-foreground">{tx.reference}</div>
                    <div className="text-[10px] text-muted mt-0.5">
                      {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border flex items-center gap-1.5 w-fit ${getTypeColor(tx.type)}`}>
                      {getIcon(tx.type)}
                      <span>{tx.type.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="py-4 max-w-xs truncate text-muted" title={tx.description}>
                    {tx.description}
                  </td>
                  <td className={`py-4 text-right font-mono font-bold text-sm ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}
                    {formatNaira(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
