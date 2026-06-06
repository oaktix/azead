import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TransactpayService } from '@/lib/transactpay';

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-transactpay-signature') || '';

    // Verify callback authenticity
    const isValid = TransactpayService.verifySignature(bodyText, signature);
    if (!isValid) {
      console.warn('Invalid Transactpay webhook signature. Request blocked.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    const { event, data } = payload;

    console.log('Transactpay webhook received:', event, JSON.stringify(data, null, 2));

    // Handle successful payment events (Transactpay may use different event names)
    const successEvents = ['payment.success', 'order.successful', 'charge.completed'];
    if (successEvents.includes(event)) {
      const reference = data?.reference || data?.order_reference;
      const amount = data?.amount || data?.order?.amount;
      const txStatus = (data?.status || '').toLowerCase();

      if (!reference) {
        return NextResponse.json({ error: 'Missing reference in webhook' }, { status: 400 });
      }

      if (txStatus === 'failed' || txStatus === 'cancelled') {
        return NextResponse.json({ message: 'Transaction not successful, skipping' }, { status: 200 });
      }

      // Initialize admin client
      const supabase = createAdminClient();

      // Look up the deposit record by reference to get the user_id
      const { data: deposit, error: lookupError } = await supabase
        .from('deposits')
        .select('user_id, status')
        .eq('reference', reference)
        .single();

      if (lookupError || !deposit) {
        console.error('Deposit not found for reference:', reference, lookupError);
        return NextResponse.json({ error: 'Deposit record not found' }, { status: 404 });
      }

      // Prevent double-processing
      if (deposit.status === 'completed') {
        console.warn(`Deposit ${reference} already completed. Skipping.`);
        return NextResponse.json({ success: true, processed: false, message: 'Already processed' });
      }

      const userId = deposit.user_id;
      const creditAmount = Number(amount);

      if (!creditAmount || creditAmount <= 0) {
        return NextResponse.json({ error: 'Invalid amount in webhook' }, { status: 400 });
      }

      // Call PL/pgSQL database function to credit wallet atomically
      const { data: creditSuccess, error: rpcError } = await supabase.rpc('process_successful_deposit', {
        p_user_id: userId,
        p_amount: creditAmount,
        p_reference: reference,
        p_raw_response: payload
      });

      if (rpcError) {
        console.error('Ledger database error during deposit crediting:', rpcError);
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
      }

      if (!creditSuccess) {
        console.warn(`Deposit already processed or wallet missing for user: ${userId}`);
      }

      return NextResponse.json({ success: true, processed: creditSuccess });
    }

    return NextResponse.json({ success: true, message: `Unhandled event: ${event}` });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Webhook endpoint failure:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

