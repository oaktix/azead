import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendUserWithdrawalPending, sendAdminWithdrawalRequest } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, bankName, accountNumber, accountName } = await request.json();
    
    // Basic validation
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 });
    }
    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'Missing banking credentials' }, { status: 400 });
    }

    // Call atomic SQL RPC procedure
    const { data: withdrawalId, error: rpcError } = await supabase.rpc('request_withdrawal', {
      p_user_id: user.id,
      p_amount: amount,
      p_bank_name: bankName,
      p_account_number: accountNumber,
      p_account_name: accountName
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

      // Calculate fee (1.9%) and payout — mirrors DB logic for display
      const fee = Math.round(amount * 0.019 * 100) / 100;
      const payoutAmount = Math.round((amount - fee) * 100) / 100;

      await Promise.all([
        sendUserWithdrawalPending(userEmail, firstName, amount, fee, payoutAmount, bankName, accountNumber),
        sendAdminWithdrawalRequest(
          userEmail, `${firstName} ${lastName}`.trim(),
          amount, payoutAmount, bankName, accountNumber, accountName,
          String(withdrawalId)
        ),
      ]);
    } catch (emailErr) {
      console.error('[withdrawals/create] Email error:', emailErr);
    }

    return NextResponse.json({ success: true, withdrawalId });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Withdrawal request error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
