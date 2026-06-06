import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import TransactionsClient, { TransactionItem } from '@/components/admin/transactions-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminTransactionsPage() {
  const adminClient = createAdminClient();

  // 1. Fetch all transactions
  const { data: transactions, error } = await adminClient
    .from('wallet_transactions')
    .select(`
      id,
      amount,
      type,
      reference,
      description,
      created_at,
      wallets (
        user_id,
        profiles (
          first_name,
          last_name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
  }

  // 2. Fetch auth users to map emails
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();
  const authMap = new Map(authUsers?.map(u => [u.id, u.email]));

  // Map elements safely
  const mappedTransactions: TransactionItem[] = (transactions || []).map((t) => {
    // Cast appropriately
    const rawWallet = t.wallets as unknown as { user_id: string; profiles: { first_name: string; last_name: string } | null } | null;
    const profile = rawWallet?.profiles;
    const userId = rawWallet?.user_id || 'N/A';
    
    return {
      id: t.id,
      amount: Number(t.amount),
      type: t.type as TransactionItem['type'],
      reference: t.reference,
      description: t.description,
      created_at: t.created_at,
      user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Investor',
      user_email: authMap.get(userId) || 'N/A',
    };
  });

  return <TransactionsClient initialTransactions={mappedTransactions} />;
}
