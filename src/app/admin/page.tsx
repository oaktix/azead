import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminClient from '@/components/admin/admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const adminClient = createAdminClient();

  // 1. Fetch platform deposits sum (verified success)
  const { data: depositsData } = await adminClient
    .from('deposits')
    .select('amount')
    .eq('status', 'success');
  const totalDeposits = (depositsData || []).reduce((sum, d) => sum + Number(d.amount), 0);

  // 2. Fetch platform withdrawals sum (verified approved)
  const { data: withdrawalsData } = await adminClient
    .from('withdrawals')
    .select('amount')
    .eq('status', 'approved');
  const totalWithdrawals = (withdrawalsData || []).reduce((sum, w) => sum + Number(w.amount), 0);

  // 3. Fetch active investments details
  const { data: activeInvestments } = await adminClient
    .from('investments')
    .select('amount')
    .eq('status', 'active');
  const activeInvestmentsCount = activeInvestments?.length || 0;
  const activeInvestmentsSum = (activeInvestments || []).reduce((sum, i) => sum + Number(i.amount), 0);

  // 4. Fetch pending KYC documents count and data
  const { data: pendingKycDocs } = await adminClient
    .from('kyc_documents')
    .select(`
      id,
      user_id,
      id_number,
      id_document_url,
      status,
      profiles (
        first_name,
        last_name
      )
    `)
    .eq('status', 'pending')
    .order('updated_at', { ascending: false });
  const pendingKycCount = pendingKycDocs?.length || 0;

  // 5. Fetch pending withdrawals count and data
  const { data: pendingWithdrawals } = await adminClient
    .from('withdrawals')
    .select(`
      id,
      user_id,
      amount,
      fee,
      payout_amount,
      status,
      bank_name,
      account_number,
      account_name,
      profiles (
        first_name,
        last_name
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  const pendingWithdrawalsCount = pendingWithdrawals?.length || 0;

  // 6. Fetch fail-safe status
  const { data: controls } = await adminClient
    .from('liquidity_controls')
    .select('panic_button_paused')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();
  const panicPaused = controls?.panic_button_paused || false;

  // 7. Fetch recent audit logs
  const { data: auditLogs } = await adminClient
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Parse types
  const mappedKycDocs = (pendingKycDocs || []).map((doc: unknown) => {
    const d = doc as { id: string; user_id: string; id_number: string; id_document_url: string; status: string; profiles: unknown };
    const p = d.profiles as { first_name: string; last_name: string } | null;
    return {
      id: d.id,
      user_id: d.user_id,
      id_number: d.id_number,
      id_document_url: d.id_document_url,
      status: d.status,
      profiles: p || { first_name: 'Unknown', last_name: 'Investor' }
    };
  });

  const mappedWithdrawals = (pendingWithdrawals || []).map((wth: unknown) => {
    const w = wth as { id: string; user_id: string; amount: string | number; fee: string | number; payout_amount: string | number; status: string; bank_name: string; account_number: string; account_name: string; profiles: unknown };
    const p = w.profiles as { first_name: string; last_name: string } | null;
    return {
      id: w.id,
      user_id: w.user_id,
      amount: Number(w.amount),
      fee: Number(w.fee),
      payout_amount: Number(w.payout_amount),
      status: w.status,
      bank_name: w.bank_name,
      account_number: w.account_number,
      account_name: w.account_name,
      profiles: p || { first_name: 'Unknown', last_name: 'Investor' }
    };
  });

  return (
    <AdminClient
      metrics={{
        totalDeposits,
        totalWithdrawals,
        activeInvestmentsCount,
        activeInvestmentsSum,
        pendingKycCount,
        pendingWithdrawalsCount,
      }}
      kycDocs={mappedKycDocs}
      withdrawals={mappedWithdrawals}
      panicPaused={panicPaused}
      auditLogs={auditLogs || []}
    />
  );
}
