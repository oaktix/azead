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

  // 4. Fetch pending KYC documents count
  const { count: pendingKycCount } = await adminClient
    .from('kyc_documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // 5. Fetch pending withdrawals count
  const { count: pendingWithdrawalsCount } = await adminClient
    .from('withdrawals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

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

  return (
    <AdminClient
      metrics={{
        totalDeposits,
        totalWithdrawals,
        activeInvestmentsCount,
        activeInvestmentsSum,
        pendingKycCount: pendingKycCount || 0,
        pendingWithdrawalsCount: pendingWithdrawalsCount || 0,
      }}
      panicPaused={panicPaused}
      auditLogs={auditLogs || []}
    />
  );
}
