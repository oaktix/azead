import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/deposits/verify
 *
 * Called from the payment callback page immediately after Transactpay redirects
 * the user back. Uses the payment reference to look up the pending deposit record,
 * then calls the atomic process_successful_deposit RPC to credit the wallet.
 *
 * This is the IMMEDIATE confirmation path — it does not wait for a webhook.
 * Webhooks are still supported as a secondary/backup confirmation mechanism.
 */
export async function POST(request: Request) {
  try {
    const { reference, status } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    // Accept any "success-like" status from Transactpay's redirect params
    const isSuccess =
      status === 'success' ||
      status === 'successful' ||
      status === 'Successful' ||
      status === 'completed' ||
      status === 'approved';

    if (!isSuccess) {
      return NextResponse.json({
        success: false,
        message: `Payment status is '${status}' — not crediting wallet.`,
      });
    }

    const supabase = createAdminClient();

    // 1. Look up the pending deposit record by reference
    const { data: deposit, error: lookupError } = await supabase
      .from('deposits')
      .select('id, user_id, amount, status')
      .eq('reference', reference)
      .maybeSingle();

    if (lookupError) {
      console.error('Deposit lookup error:', lookupError);
      return NextResponse.json({ error: 'Database error during deposit lookup' }, { status: 500 });
    }

    if (!deposit) {
      console.error('No deposit record found for reference:', reference);
      return NextResponse.json({ error: 'Deposit record not found' }, { status: 404 });
    }

    // 2. Idempotency: already credited
    if (deposit.status === 'success') {
      console.log(`Deposit ${reference} already processed. Returning success.`);
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    // 3. Call the atomic PL/pgSQL function to credit the wallet
    const { data: credited, error: rpcError } = await supabase.rpc('process_successful_deposit', {
      p_user_id: deposit.user_id,
      p_amount: deposit.amount,
      p_reference: reference,
      p_raw_response: { source: 'callback_verify', reference, status },
    });

    if (rpcError) {
      console.error('RPC process_successful_deposit error:', rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    console.log(`✅ Deposit ${reference} credited ₦${deposit.amount} to user ${deposit.user_id}`);
    return NextResponse.json({ success: true, credited, amount: deposit.amount });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Deposit verify endpoint error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
