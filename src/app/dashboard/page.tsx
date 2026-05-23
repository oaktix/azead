import React from 'react';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, kyc_status, referral_code')
    .eq('id', user.id)
    .single();

  // 2. Fetch user wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', user.id)
    .single();

  // 3. Fetch active & completed investments
  const { data: investments } = await supabase
    .from('investments')
    .select(`
      id,
      amount,
      interest_rate,
      status,
      start_date,
      maturity_date,
      last_accrual_date,
      accrued_interest,
      investment_packages (
        name
      )
    `)
    .eq('user_id', user.id)
    .order('start_date', { ascending: false });

  // 4. Fetch recent transactions
  interface LedgerTransaction {
    id: string;
    amount: number | string;
    type: string;
    description?: string;
    created_at: string;
  }
  let transactions: LedgerTransaction[] = [];
  if (wallet) {
    const { data: txs } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(6);
    transactions = (txs as LedgerTransaction[]) || [];
  }

  // 5. Fetch referral count
  const { count } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id);

  // Cast investment packages join structure correctly
  const mappedInvestments = (investments || []).map((inv: unknown) => {
    const i = inv as { id: string; amount: string | number; interest_rate: string | number; status: string; start_date: string; maturity_date: string; last_accrual_date: string; accrued_interest: string | number; investment_packages: { name: string } | null };
    const { investment_packages, ...rest } = i;
    return {
      ...rest,
      amount: Number(i.amount),
      interest_rate: Number(i.interest_rate),
      accrued_interest: Number(i.accrued_interest),
      package_name: investment_packages?.name || 'Structured Plan',
      investment_packages: investment_packages || undefined
    };
  });

  return (
    <DashboardClient
      initialProfile={profile || { first_name: 'User', last_name: '', kyc_status: 'pending', referral_code: '' }}
      initialWallet={wallet || { balance: 0.00 }}
      initialInvestments={mappedInvestments}
      initialTransactions={transactions}
      initialReferralCount={count || 0}
    />
  );
}
