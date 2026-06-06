import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

async function validateAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }
  return { adminId: user.id };
}

export async function POST(request: Request) {
  const authCheck = await validateAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { userId, amount, description } = await request.json();
    if (!userId || amount === undefined || isNaN(Number(amount)) || !description) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (numAmount === 0) {
      return NextResponse.json({ error: 'Adjustment amount cannot be zero' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch user wallet
    const { data: wallet, error: walletError } = await adminClient
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'User wallet not found' }, { status: 404 });
    }

    const currentBalance = Number(wallet.balance);
    const newBalance = currentBalance + numAmount;

    if (newBalance < 0) {
      return NextResponse.json({ error: 'Insufficient balance: adjustment would result in a negative balance' }, { status: 400 });
    }

    // 2. Update wallet balance
    const { error: updateError } = await adminClient
      .from('wallets')
      .update({
        balance: newBalance,
        ledger_version: adminClient.rpc('increment_ledger_version'), // we can also fetch and manually increment
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (updateError) {
      // Fallback update if RPC isn't found
      const { error: fallbackError } = await adminClient
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);
      
      if (fallbackError) throw fallbackError;
    }

    // 3. Create wallet transaction ledger entry
    const isCredit = numAmount > 0;
    const type = isCredit ? 'deposit' : 'withdrawal';
    const reference = `ADJ-${isCredit ? 'CR' : 'DB'}-${uuidv4().substring(0, 8).toUpperCase()}`;

    const { error: transactionError } = await adminClient
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        amount: numAmount,
        type,
        reference,
        description: `Admin manual override: ${description}`,
      });

    if (transactionError) throw transactionError;

    // 4. Create notification for the user
    const amountStr = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(Math.abs(numAmount));

    await adminClient
      .from('notifications')
      .insert({
        user_id: userId,
        title: `Account Balance ${isCredit ? 'Credited' : 'Debited'}`,
        message: `An administrator has manually ${isCredit ? 'credited' : 'debited'} your account by ${amountStr}. Reason: ${description}`
      });

    // 5. Log in admin activity logs
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: 'adjust_wallet_balance',
      details: { userId, walletId: wallet.id, adjustmentAmount: numAmount, description }
    });

    return NextResponse.json({ success: true, newBalance });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Adjust wallet balance admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
