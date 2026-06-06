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

    console.log('Transactpay webhook received:', JSON.stringify(payload, null, 2));

    let reference = '';
    let amount = 0;
    let isSuccess = false;

    // Check if it's the official Transactpay webhook format
    if (data && data.productName === 'Collection') {
      reference = data.orderReference || data.reference;
      amount = Number(data.totalAmountCharged || data.amount);
      isSuccess = (data.status === 'Successful' || data.status === 'success');
    } 
    // Fallback to mock/sandbox event format
    else if (event) {
      const successEvents = ['payment.success', 'order.successful', 'charge.completed'];
      if (successEvents.includes(event)) {
        reference = data?.reference || data?.order_reference || data?.orderReference;
        amount = Number(data?.amount || data?.order?.amount || data?.totalAmountCharged);
        const txStatus = (data?.status || '').toLowerCase();
        isSuccess = txStatus !== 'failed' && txStatus !== 'cancelled';
      }
    }

    if (isSuccess && reference && amount > 0) {
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
      const creditAmount = amount;

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

    return NextResponse.json({ success: true, message: `Skipping unhandled or unsuccessful transaction status` });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Webhook endpoint failure:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

