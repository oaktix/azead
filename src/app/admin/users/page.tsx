import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import UsersClient from '@/components/admin/users-client';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const adminClient = createAdminClient();

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: wallets } = await adminClient
    .from('wallets')
    .select('user_id, balance');

  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();

  const walletMap = new Map(wallets?.map(w => [w.user_id, w.balance]));
  const authMap = new Map(authUsers?.map(u => [u.id, u.email]));

  const usersList = (profiles || []).map(p => ({
    ...p,
    email: authMap.get(p.id) || 'N/A',
    balance: Number(walletMap.get(p.id) || 0),
  }));

  return <UsersClient initialUsers={usersList} />;
}
