import React from 'react';
import { createClient } from '@/lib/supabase/server';
import InvestmentsClient from '@/components/dashboard/investments-client';

export default async function InvestmentsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch active packages
  const { data: packages } = await supabase
    .from('investment_packages')
    .select('*')
    .eq('is_active', true)
    .order('amount', { ascending: true });

  // 2. Fetch user investments
  const { data: investments } = await supabase
    .from('investments')
    .select(`
      id,
      amount,
      interest_rate,
      status,
      start_date,
      maturity_date,
      auto_reinvest,
      investment_packages (
        name
      )
    `)
    .eq('user_id', user.id)
    .order('start_date', { ascending: false });

  // 3. Fetch user wallet balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedInvestments = (investments || []).map((inv: any) => ({
    ...inv,
    package_name: inv.investment_packages?.name || 'Structured Plan',
  }));

  return (
    <InvestmentsClient
      packages={packages || []}
      investments={mappedInvestments}
      walletBalance={wallet?.balance || 0.00}
    />
  );
}
