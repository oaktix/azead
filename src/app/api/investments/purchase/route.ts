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

    const { packageId, autoReinvest } = await request.json();
    if (!packageId) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 });
    }

    // Call PL/pgSQL atomic purchase function
    const { data: investmentId, error: rpcError } = await supabase.rpc('purchase_investment', {
      p_user_id: user.id,
      p_package_id: packageId,
      p_auto_reinvest: !!autoReinvest
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, investmentId });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Purchase investment error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
