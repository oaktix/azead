import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ProfileClient from '@/components/dashboard/profile-client';

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone, kyc_status, referral_code')
    .eq('id', user.id)
    .single();

  // 2. Fetch KYC details
  const { data: kycDoc } = await supabase
    .from('kyc_documents')
    .select('id_number, id_document_url, status, admin_notes')
    .eq('user_id', user.id)
    .maybeSingle(); // maybeSingle instead of single to prevent erroring out if row doesn't exist yet

  return (
    <ProfileClient
      profile={profile || { first_name: '', last_name: '', phone: '', kyc_status: 'pending', referral_code: '' }}
      email={user.email || ''}
      kycDoc={kycDoc}
    />
  );
}
