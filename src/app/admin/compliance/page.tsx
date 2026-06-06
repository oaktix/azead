import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import ComplianceClient from '@/components/admin/compliance-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCompliancePage() {
  const adminClient = createAdminClient();

  // 1. Fetch pending KYC documents
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

  // 2. Fetch pending withdrawals
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

  // Map and parse profiles
  const mappedKycDocs = (pendingKycDocs || []).map((d) => {
    const doc = d as { id: string; user_id: string; id_number: string; id_document_url: string; status: string; profiles: unknown };
    const p = doc.profiles as { first_name: string; last_name: string } | null;
    return {
      id: doc.id,
      user_id: doc.user_id,
      id_number: doc.id_number,
      id_document_url: doc.id_document_url,
      status: doc.status,
      profiles: p || { first_name: 'Unknown', last_name: 'Investor' }
    };
  });

  const mappedWithdrawals = (pendingWithdrawals || []).map((wth) => {
    const w = wth as { id: string; user_id: string; amount: number | string; fee: number | string; payout_amount: number | string; status: string; bank_name: string; account_number: string; account_name: string; profiles: unknown };
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
    <ComplianceClient 
      kycDocs={mappedKycDocs}
      withdrawals={mappedWithdrawals}
    />
  );
}
