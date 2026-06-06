'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, History, ArrowUpRight, ArrowDownLeft, Gift, ShieldAlert, 
  X, Copy, CheckCircle2, Download, Printer, Calendar, DollarSign,
  TrendingUp, TrendingDown, BarChart3, Filter, ChevronDown
} from 'lucide-react';

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
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Amount range filters
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const receiptRef = useRef<HTMLDivElement>(null);

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  const copyToReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const getIcon = (type: TransactionItem['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'investment_debit':
        return <TrendingDown className="w-4 h-4 text-amber-400" />;
      case 'investment_payout':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
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

  // --- Filtered Transactions (with all new filters) ---
  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((tx) => {
      // Search
      const matchesSearch =
        tx.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Type
      const matchesType = typeFilter === 'all' ? true : tx.type === typeFilter;

      // Date range
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(tx.created_at) >= new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        matchesDate = matchesDate && new Date(tx.created_at) < end;
      }

      // Amount range
      let matchesAmount = true;
      const absAmount = Math.abs(tx.amount);
      if (minAmount) {
        matchesAmount = matchesAmount && absAmount >= Number(minAmount);
      }
      if (maxAmount) {
        matchesAmount = matchesAmount && absAmount <= Number(maxAmount);
      }

      return matchesSearch && matchesType && matchesDate && matchesAmount;
    });
  }, [initialTransactions, searchQuery, typeFilter, startDate, endDate, minAmount, maxAmount]);

  // --- Paginated Results ---
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTx = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // --- Aggregate Metrics ---
  const totalDeposits = initialTransactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = initialTransactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalInvested = initialTransactions
    .filter((t) => t.type === 'investment_debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalPayouts = initialTransactions
    .filter((t) => t.type === 'investment_payout')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReferrals = initialTransactions
    .filter((t) => t.type === 'referral_bonus')
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalDeposits + totalPayouts + totalReferrals - totalWithdrawals - totalInvested;

  // --- Volume bar widths ---
  const maxVolume = Math.max(totalDeposits, totalWithdrawals, totalInvested, totalPayouts, totalReferrals, 1);
  const barWidth = (val: number) => `${Math.max(2, (val / maxVolume) * 100)}%`;

  // --- CSV Export ---
  const handleExportCSV = () => {
    const params = new URLSearchParams();
    params.set('scope', 'admin');
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (searchQuery) params.set('search', searchQuery);
    if (minAmount) params.set('minAmount', minAmount);
    if (maxAmount) params.set('maxAmount', maxAmount);

    window.open(`/api/ledger/export?${params.toString()}`, '_blank');
  };

  // --- Print Receipt ---
  const handlePrint = () => {
    window.print();
  };

  // --- Clear all filters ---
  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || startDate || endDate || minAmount || maxAmount;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading flex items-center gap-2">
            <History className="w-8 h-8 text-emerald-400" />
            <span>Transaction Ledger</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Comprehensive audit trail for all platform financial activity. Click any row for a detailed receipt.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all"
            title="Export filtered results as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-md space-y-2 group hover:border-emerald-500/30 transition-colors">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total Deposits</span>
          <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
            {formatNaira(totalDeposits)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-md space-y-2 group hover:border-red-500/30 transition-colors">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total Withdrawals</span>
          <div className="text-base sm:text-lg font-bold text-red-400 font-mono">
            {formatNaira(totalWithdrawals)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-md space-y-2 group hover:border-amber-500/30 transition-colors">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total Invested</span>
          <div className="text-base sm:text-lg font-bold text-amber-400 font-mono">
            {formatNaira(totalInvested)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-md space-y-2 group hover:border-purple-500/30 transition-colors">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Referral Commissions</span>
          <div className="text-base sm:text-lg font-bold text-purple-400 font-mono">
            {formatNaira(totalReferrals)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-md space-y-2 group hover:border-blue-500/30 transition-colors">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Net Liquidity Flow</span>
          <div className={`text-base sm:text-lg font-bold font-mono ${netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netFlow >= 0 ? '+' : ''}{formatNaira(netFlow)}
          </div>
        </div>
      </div>

      {/* Volume Analytics Bars */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-md space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-muted" />
          <span className="text-xs font-bold text-foreground">Aggregate Volume Breakdown</span>
        </div>
        
        {[
          { label: 'Deposits', value: totalDeposits, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
          { label: 'Withdrawals', value: totalWithdrawals, color: 'bg-red-500', textColor: 'text-red-400' },
          { label: 'Investments', value: totalInvested, color: 'bg-amber-500', textColor: 'text-amber-400' },
          { label: 'Payouts', value: totalPayouts, color: 'bg-blue-500', textColor: 'text-blue-400' },
          { label: 'Referrals', value: totalReferrals, color: 'bg-purple-500', textColor: 'text-purple-400' },
        ].map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="text-[10px] text-muted font-semibold w-[75px] shrink-0">{bar.label}</span>
            <div className="flex-1 h-4 bg-secondary/40 rounded-full overflow-hidden relative">
              <div
                className={`h-full ${bar.color} rounded-full transition-all duration-700 ease-out bar-fill`}
                {...{ style: { '--bar-w': barWidth(bar.value) } as React.CSSProperties }}
              />
            </div>
            <span className={`text-[10px] font-mono font-bold w-[100px] text-right shrink-0 ${bar.textColor}`}>
              {formatNaira(bar.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, reference, description..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); handleFilterChange(); }}
              className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); handleFilterChange(); }}
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

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                showFilters
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-secondary/40 border-border text-muted hover:text-foreground'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Advanced</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters (collapsible) */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label htmlFor="admin-filter-start-date" className="block text-[9px] text-muted font-bold uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Start Date
              </label>
              <input
                id="admin-filter-start-date"
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); handleFilterChange(); }}
                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="admin-filter-end-date" className="block text-[9px] text-muted font-bold uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                End Date
              </label>
              <input
                id="admin-filter-end-date"
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); handleFilterChange(); }}
                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[9px] text-muted font-bold uppercase tracking-wider mb-1.5">
                <DollarSign className="w-3 h-3 inline mr-1" />
                Min Amount (₦)
              </label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => { setMinAmount(e.target.value); handleFilterChange(); }}
                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[9px] text-muted font-bold uppercase tracking-wider mb-1.5">
                <DollarSign className="w-3 h-3 inline mr-1" />
                Max Amount (₦)
              </label>
              <input
                type="number"
                placeholder="∞"
                value={maxAmount}
                onChange={(e) => { setMaxAmount(e.target.value); handleFilterChange(); }}
                className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
              />
            </div>

            {/* Validation: start > end */}
            {startDate && endDate && new Date(startDate) > new Date(endDate) && (
              <div className="col-span-full text-[10px] text-red-500 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Start date cannot be after end date.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-[10px] text-muted font-semibold px-1">
        <span>
          Showing {paginatedTx.length} of {filteredTransactions.length} records
          {hasActiveFilters && ` (${initialTransactions.length} total)`}
        </span>
        <span>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Transactions Table */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xl overflow-x-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/40 border border-border flex items-center justify-center">
              <Search className="w-7 h-7 text-muted/50" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">No matching transactions</p>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                No transaction records match your current filters. Try adjusting the date range, amount limits, or search query.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
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
              {paginatedTx.map((tx) => (
                <tr 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className="align-middle hover:bg-muted/30 cursor-pointer transition-colors"
                >
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
                      <span>{tx.type.replace(/_/g, ' ')}</span>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-secondary/40 border border-border text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page: number;
            if (totalPages <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-xs font-bold rounded-lg border transition-all ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/40 border-border text-muted hover:text-foreground'
                }`}
              >
                {page}
              </button>
            );
          })}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-secondary/40 border border-border text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}

      {/* ====== TRANSACTION DETAILS MODAL (AUDIT RECEIPT) ====== */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-250 no-print">
          <div 
            ref={receiptRef}
            className="w-full max-w-lg p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200 print-receipt"
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
              <span className="text-[80px] font-black font-heading text-foreground tracking-widest rotate-[-30deg]">AZEAD</span>
            </div>

            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-border relative z-10">
              <div>
                <h3 className="text-sm font-bold text-foreground font-heading">Ledger Audit Certificate</h3>
                <p className="text-[10px] text-muted font-mono uppercase tracking-wider mt-0.5">ID: {selectedTx.id}</p>
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
                  title="Close modal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Receipt Amount Header */}
            <div className="text-center py-6 bg-secondary/20 rounded-2xl border border-border relative z-10">
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border flex items-center gap-1 w-fit ${getTypeColor(selectedTx.type)}`}>
                  {getIcon(selectedTx.type)}
                  <span>{selectedTx.type.replace(/_/g, ' ')}</span>
                </span>
              </div>
              <span className="text-[10px] text-muted uppercase tracking-wider font-bold block mb-1">Transaction Value</span>
              <div className={`text-3xl font-black font-mono tracking-tight ${selectedTx.amount >= 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                {selectedTx.amount >= 0 ? '+' : ''}{formatNaira(selectedTx.amount)}
              </div>
            </div>

            {/* Audit Properties */}
            <div className="space-y-4 text-xs relative z-10">
              <div className="grid grid-cols-3 py-2 border-b border-border/50">
                <span className="text-muted font-semibold">Investor Name</span>
                <span className="col-span-2 text-foreground font-bold text-right">{selectedTx.user_name}</span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-border/50">
                <span className="text-muted font-semibold">Investor Email</span>
                <span className="col-span-2 text-foreground font-mono text-right">{selectedTx.user_email}</span>
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
                <span className="text-muted font-semibold block">Audit Memo / Description</span>
                <p className="p-3 bg-secondary/30 border border-border/80 rounded-xl text-foreground/90 font-sans leading-normal">
                  {selectedTx.description}
                </p>
              </div>
            </div>

            {/* Security stamp */}
            <div className="flex items-center justify-center gap-2 text-[9px] text-muted/60 font-mono uppercase tracking-widest relative z-10 pt-2 border-t border-border/30">
              <ShieldAlert className="w-3 h-3" />
              <span>AZEAD • Platform Ledger Audit • Verified</span>
            </div>

            {/* Close action button */}
            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-2xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-xs transition-all shadow-md relative z-10 no-print"
            >
              Acknowledge Audit Info
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
