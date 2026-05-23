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

    return NextResponse.json({ success: true, withdrawalId });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Withdrawal request error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
