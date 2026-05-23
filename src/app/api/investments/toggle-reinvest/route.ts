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

    const { investmentId, autoReinvest } = await request.json();
    if (!investmentId) {
      return NextResponse.json({ error: 'Invalid investment ID' }, { status: 400 });
    }

    // Direct update verifying owner
    const { error: updateError } = await supabase
      .from('investments')
      .update({ auto_reinvest: !!autoReinvest })
      .eq('id', investmentId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Toggle auto-reinvest error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
