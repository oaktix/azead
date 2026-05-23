import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investmentId } = await request.json();
    if (!investmentId) {
      return NextResponse.json({ error: 'Invalid investment ID' }, { status: 400 });
    }

    // Call early termination trigger RPC
    const { data: success, error: rpcError } = await supabase.rpc('request_early_termination', {
      p_user_id: user.id,
      p_investment_id: investmentId
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    return NextResponse.json({ success });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Request early termination error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
