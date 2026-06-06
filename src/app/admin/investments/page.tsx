import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import InvestmentsClient, { InvestmentItem } from '@/components/admin/investments-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminInvestmentsPage() {
  const adminClient = createAdminClient();

  // 1. Fetch investments
  const { data: investments } = await adminClient
    .from('investments')
    .select(`
      *,
      profiles (
        first_name,
        last_name
      ),
      investment_packages (
        name,
        duration_days,
        annual_interest_rate
      )
    `)
    .order('start_date', { ascending: false });

  // 2. Fetch profiles for selection
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name')
    .order('first_name', { ascending: true });

  // 3. Fetch packages for selection
  const { data: packages } = await adminClient
    .from('investment_packages')
    .select('id, name, amount')
    .eq('is_active', true)
    .order('amount', { ascending: true });

  // 4. Fetch auth users to map emails
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();

  const authMap = new Map(authUsers?.map(u => [u.id, u.email]));

  const mappedInvestments: InvestmentItem[] = (investments || []).map((i) => {
    const inv = i as unknown as Omit<InvestmentItem, 'user_email'>;
    return {
      ...inv,
      user_email: authMap.get(inv.user_id) || 'N/A'
    } as InvestmentItem;
  });

  const mappedProfiles = (profiles || []).map((prof) => {
    const p = prof as { id: string; first_name: string; last_name: string };
    return {
      ...p,
      email: authMap.get(p.id) || 'N/A'
    };
  });

  return (
    <InvestmentsClient 
      initialInvestments={mappedInvestments} 
      profiles={mappedProfiles}
      packages={packages || []}
    />
  );
}
