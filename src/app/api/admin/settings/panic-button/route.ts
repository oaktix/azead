import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Validate session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { pause } = await request.json();
    if (typeof pause !== 'boolean') {
      return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Update liquidity controls row (seeded in SQL schema)
    const { error: updateError } = await adminClient
      .from('liquidity_controls')
      .update({ panic_button_paused: pause, updated_at: new Date().toISOString() })
      .eq('id', '00000000-0000-0000-0000-000000000001');

    if (updateError) {
      throw updateError;
    }

    // Log admin action
    await adminClient.from('admin_logs').insert({
      admin_id: user.id,
      action: pause ? 'panic_button_activated' : 'panic_button_deactivated',
      details: { pause }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Panic button toggle error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
