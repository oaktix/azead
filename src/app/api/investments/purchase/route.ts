import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendUserInvestmentPurchased, sendAdminNewInvestment } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId, amount, durationYears, autoReinvest } = await request.json();
    if (!packageId) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 100000) {
      return NextResponse.json({ error: 'Minimum investment amount is 100,000 NGN' }, { status: 400 });
    }

    const parsedDuration = parseInt(durationYears, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      return NextResponse.json({ error: 'Duration must be at least 1 year' }, { status: 400 });
    }

    // Call PL/pgSQL atomic purchase function
    const { data: investmentId, error: rpcError } = await supabase.rpc('purchase_investment', {
      p_user_id: user.id,
      p_package_id: packageId,
      p_amount: parsedAmount,
      p_duration_years: parsedDuration,
      p_auto_reinvest: !!autoReinvest
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    // Send email notifications (fire-and-forget)
    try {
      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      const { data: authUser } = await adminClient.auth.admin.getUserById(user.id);
      const userEmail = authUser?.user?.email || user.email || '';
      const firstName = profile?.first_name || 'Investor';
      const lastName = profile?.last_name || '';

      const maturityDate = new Date();
      maturityDate.setFullYear(maturityDate.getFullYear() + parsedDuration);
      const expectedPayout = parsedAmount + (parsedAmount * 0.25 * parsedDuration);

      await Promise.all([
        sendUserInvestmentPurchased(userEmail, firstName, parsedAmount, parsedDuration, maturityDate, expectedPayout),
        sendAdminNewInvestment(userEmail, `${firstName} ${lastName}`.trim(), parsedAmount, parsedDuration, String(investmentId)),
      ]);
    } catch (emailErr) {
      console.error('[investments/purchase] Email error:', emailErr);
    }

    return NextResponse.json({ success: true, investmentId });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Purchase investment error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
