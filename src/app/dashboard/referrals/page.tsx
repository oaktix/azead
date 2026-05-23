import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ReferralsClient from '@/components/dashboard/referrals-client';

export default async function ReferralsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch user referral code
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single();

  // 2. Fetch referrals with referee name
  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      id,
      created_at,
      referee:profiles!referrals_referee_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  // 3. Fetch rewards with referee name
  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select(`
      id,
      reward_amount,
      status,
      created_at,
      referee:profiles!referral_rewards_referee_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  // Map database response to component expected shapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedReferrals = (referrals || []).map((ref: any) => ({
    id: ref.id,
    created_at: ref.created_at,
    referee_name: ref.referee ? `${ref.referee.first_name} ${ref.referee.last_name || ''}` : 'Referred Investor',
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedRewards = (rewards || []).map((rew: any) => ({
    id: rew.id,
    reward_amount: Number(rew.reward_amount),
    status: rew.status,
    created_at: rew.created_at,
    referee_name: rew.referee ? `${rew.referee.first_name} ${rew.referee.last_name || ''}` : 'Referred Investor',
  }));

  return (
    <ReferralsClient
      referralCode={profile?.referral_code || ''}
      referrals={mappedReferrals}
      rewards={mappedRewards}
    />
  );
}
