import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function validateAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }
  return { adminId: user.id };
}

export async function POST(request: Request) {
  const authCheck = await validateAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { 
      withdrawal_fee_percentage, 
      early_termination_penalty_percentage, 
      referral_bonus_percentage,
      daily_withdrawal_limit,
      panic_button_paused
    } = await request.json();

    const adminClient = createAdminClient();

    // 1. Update platform_settings
    if (withdrawal_fee_percentage !== undefined) {
      const { error: err } = await adminClient
        .from('platform_settings')
        .upsert({ 
          key: 'withdrawal_fee_percentage', 
          value: Number(withdrawal_fee_percentage),
          updated_at: new Date().toISOString()
        });
      if (err) throw err;
    }

    if (early_termination_penalty_percentage !== undefined) {
      const { error: err } = await adminClient
        .from('platform_settings')
        .upsert({ 
          key: 'early_termination_penalty_percentage', 
          value: Number(early_termination_penalty_percentage),
          updated_at: new Date().toISOString()
        });
      if (err) throw err;
    }

    if (referral_bonus_percentage !== undefined) {
      const { error: err } = await adminClient
        .from('platform_settings')
        .upsert({ 
          key: 'referral_bonus_percentage', 
          value: Number(referral_bonus_percentage),
          updated_at: new Date().toISOString()
        });
      if (err) throw err;
    }

    // 2. Update liquidity_controls
    const updateData: {
      daily_withdrawal_limit?: number;
      panic_button_paused?: boolean;
      updated_at?: string;
    } = {};
    if (daily_withdrawal_limit !== undefined) {
      updateData.daily_withdrawal_limit = Number(daily_withdrawal_limit);
    }
    if (panic_button_paused !== undefined) {
      updateData.panic_button_paused = Boolean(panic_button_paused);
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
      const { error: err } = await adminClient
        .from('liquidity_controls')
        .update(updateData)
        .eq('id', '00000000-0000-0000-0000-000000000001');
      if (err) throw err;
    }

    // 3. Log action in admin activity logs
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: 'update_platform_settings',
      details: { 
        withdrawal_fee_percentage, 
        early_termination_penalty_percentage, 
        referral_bonus_percentage,
        daily_withdrawal_limit,
        panic_button_paused
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update settings admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
