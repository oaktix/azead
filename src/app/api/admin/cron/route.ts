import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendUserInvestmentMatured } from '@/lib/email';

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

    // Send maturity emails to affected users (fire-and-forget)
    if (processedCount && processedCount > 0) {
      try {
        // Query investments that just matured (within the past 10 minutes)
        const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: maturedInvestments } = await adminClient
          .from('investments')
          .select('id, user_id, amount, interest_rate, accrued_interest')
          .eq('status', 'completed')
          .gte('maturity_date', cutoff) // safety window: matured recently
          .lte('maturity_date', new Date().toISOString());

        if (maturedInvestments && maturedInvestments.length > 0) {
          for (const inv of maturedInvestments) {
            try {
              const { data: profile } = await adminClient
                .from('profiles')
                .select('first_name')
                .eq('id', inv.user_id)
                .maybeSingle();

              const { data: authUser } = await adminClient.auth.admin.getUserById(inv.user_id);
              const userEmail = authUser?.user?.email || '';
              const firstName = profile?.first_name || 'Investor';
              const principal = Number(inv.amount);
              const interestEarned = Number(inv.accrued_interest || 0);
              const totalPayout = principal + interestEarned;

              await sendUserInvestmentMatured(userEmail, firstName, principal, interestEarned, totalPayout);
            } catch (singleEmailErr) {
              console.error(`[cron] Maturity email error for investment ${inv.id}:`, singleEmailErr);
            }
          }
        }
      } catch (emailErr) {
        console.error('[cron] Maturity email batch error:', emailErr);
      }
    }

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
