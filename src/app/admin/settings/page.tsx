import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import SettingsClient from '@/components/admin/settings-client';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const adminClient = createAdminClient();

  // 1. Fetch platform settings
  const { data: settingsData } = await adminClient
    .from('platform_settings')
    .select('*');

  // 2. Fetch liquidity controls
  const { data: controls } = await adminClient
    .from('liquidity_controls')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single();

  // Map settings array into a key-value object
  const settingsMap: Record<string, number> = {};
  (settingsData || []).forEach((item) => {
    const entry = item as { key: string; value: unknown };
    settingsMap[entry.key] = Number(entry.value);
  });

  return (
    <SettingsClient 
      initialSettings={{
        withdrawal_fee_percentage: settingsMap.withdrawal_fee_percentage ?? 1.9,
        early_termination_penalty_percentage: settingsMap.early_termination_penalty_percentage ?? 10.0,
        referral_bonus_percentage: settingsMap.referral_bonus_percentage ?? 2.5,
        daily_withdrawal_limit: controls?.daily_withdrawal_limit ?? 100000000.00,
        panic_button_paused: controls?.panic_button_paused ?? false
      }}
    />
  );
}
