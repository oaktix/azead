import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import PackagesClient from '@/components/admin/packages-client';

export const dynamic = 'force-dynamic';

export default async function AdminPackagesPage() {
  const adminClient = createAdminClient();

  const { data: packages, error } = await adminClient
    .from('investment_packages')
    .select('*')
    .order('amount', { ascending: true });

  if (error) {
    console.error('Fetch packages error:', error);
  }

  return <PackagesClient initialPackages={packages || []} />;
}
