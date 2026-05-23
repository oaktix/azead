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

    const { withdrawalId, action, reason } = await request.json();
    if (!withdrawalId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    if (action === 'approve') {
      // Execute database function to approve withdrawal
      const { data: success, error: rpcError } = await adminClient.rpc('approve_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_admin_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      return NextResponse.json({ success });
    } else {
      // Execute database function to reject withdrawal and refund wallet
      const { data: success, error: rpcError } = await adminClient.rpc('reject_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_admin_id: user.id,
        p_rejection_reason: reason || 'Audit check failed'
      });

      if (rpcError) {
        throw rpcError;
      }

      return NextResponse.json({ success });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Process withdrawal admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
