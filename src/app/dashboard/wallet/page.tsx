import React from 'react';
import { createClient } from '@/lib/supabase/server';
import WalletClient from '@/components/dashboard/wallet-client';

export default async function WalletPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch user wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', user.id)
    .single();

  // 2. Fetch all wallet transactions
  interface Transaction {
    id: string;
    amount: number;
    type: string;
    reference: string;
    description: string;
    created_at: string;
  }
  let transactions: Transaction[] = [];
  if (wallet) {
    const { data: txs } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false });
    transactions = (txs as unknown as Transaction[]) || [];
  }

  return (
    <WalletClient
      initialBalance={wallet?.balance || 0.00}
      transactions={transactions}
    />
  );
}
