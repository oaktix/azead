import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
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

    const adminClient = createAdminClient();

    // Call database procedure to check for mature positions and run roll-overs
    const { data: processedCount, error: rpcError } = await adminClient.rpc('process_matured_investments');

    if (rpcError) {
      throw rpcError;
    }

    // Log admin action
    await adminClient.from('admin_logs').insert({
      admin_id: user.id,
      action: 'run_cron_maturation',
      details: { processedCount }
    });

    return NextResponse.json({ success: true, processedCount });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Maturation cron error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
export async function GET(request: Request) {
  // Allow GET requests for server-side cron triggers with secret check
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: count, error } = await adminClient.rpc('process_matured_investments');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, processedCount: count });
}
