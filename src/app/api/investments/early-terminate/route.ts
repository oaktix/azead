import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendUserEarlyWithdrawalInitiated, sendAdminEarlyWithdrawalRequest } from '@/lib/email';

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

    // Send email notifications (fire-and-forget)
    try {
      const adminClient = createAdminClient();

      // Fetch investment details for the email
      const { data: investment } = await adminClient
        .from('investments')
        .select('amount')
        .eq('id', investmentId)
        .maybeSingle();

      const { data: profile } = await adminClient
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      const { data: authUser } = await adminClient.auth.admin.getUserById(user.id);
      const userEmail = authUser?.user?.email || user.email || '';
      const firstName = profile?.first_name || 'Investor';
      const lastName = profile?.last_name || '';
      const principalAmount = Number(investment?.amount || 0);
      const penaltyAmount = Math.round(principalAmount * 0.10 * 100) / 100;
      const netPayout = principalAmount - penaltyAmount;

      await Promise.all([
        sendUserEarlyWithdrawalInitiated(userEmail, firstName, principalAmount, penaltyAmount, netPayout),
        sendAdminEarlyWithdrawalRequest(userEmail, `${firstName} ${lastName}`.trim(), principalAmount, penaltyAmount, investmentId),
      ]);
    } catch (emailErr) {
      console.error('[investments/early-terminate] Email error:', emailErr);
    }

    return NextResponse.json({ success });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Request early termination error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
