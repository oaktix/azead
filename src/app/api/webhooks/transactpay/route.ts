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

    // Handle payment.success event
    if (event === 'payment.success') {
      const { reference, amount, status, metadata } = data;
      const userId = metadata?.userId;

      if (!userId || !reference || !amount) {
        return NextResponse.json({ error: 'Missing webhook fields' }, { status: 400 });
      }

      if (status !== 'success') {
        return NextResponse.json({ message: 'Transaction status not success' }, { status: 200 });
      }

      // Initialize admin client to run database procedure
      const supabase = createAdminClient();

      // Call PL/pgSQL database function to credit wallet atomically and prevent duplicates
      const { data: creditSuccess, error: rpcError } = await supabase.rpc('process_successful_deposit', {
        p_user_id: userId,
        p_amount: Number(amount),
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
