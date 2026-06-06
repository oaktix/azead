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
    let userId: string | null = null;

    // --- Official Transactpay production webhook format ---
    if (data && data.productName === 'Collection') {
      reference = data.orderReference || data.reference;
      amount = Number(data.totalAmountCharged || data.amount);
      isSuccess = (data.status === 'Successful' || data.status === 'success');
      // The productCustomerEmail or metaData may contain user info but we rely on deposit lookup
    }
    // --- Fallback: mock / sandbox event-based format ---
    else if (event) {
      const successEvents = ['payment.success', 'order.successful', 'charge.completed'];
      if (successEvents.includes(event)) {
        reference = data?.reference || data?.order_reference || data?.orderReference;
        amount = Number(data?.amount || data?.order?.amount || data?.totalAmountCharged);
        const txStatus = (data?.status || '').toLowerCase();
        isSuccess = txStatus !== 'failed' && txStatus !== 'cancelled';
        // Mock simulator may embed userId directly in metadata
        userId = data?.metadata?.userId || data?.userId || null;
      }
    }

    if (!isSuccess || !reference || amount <= 0) {
      console.log('Skipping non-successful or incomplete webhook payload.');
      return NextResponse.json({ success: true, message: 'Skipping unhandled or unsuccessful transaction' });
    }

    const supabase = createAdminClient();

    // --- Look up the deposit record by reference to get the user_id ---
    const { data: deposit, error: lookupError } = await supabase
      .from('deposits')
      .select('id, user_id, status')
      .eq('reference', reference)
      .maybeSingle(); // Use maybeSingle so it doesn't error when no row found

    if (lookupError) {
      console.error('Error looking up deposit by reference:', reference, lookupError);
      return NextResponse.json({ error: 'Database lookup failed' }, { status: 500 });
    }

    // Resolve userId — from deposit record if found, otherwise from webhook metadata
    const resolvedUserId = deposit?.user_id ?? userId;

    if (!resolvedUserId) {
      console.error('Cannot resolve user_id for reference:', reference);
      return NextResponse.json({ error: 'User not identifiable from webhook payload' }, { status: 400 });
    }

    // --- Idempotency: skip if already successfully processed ---
    // The schema uses 'success' (not 'completed') as the terminal success status
    if (deposit?.status === 'success') {
      console.warn(`Deposit ${reference} already successfully processed. Skipping.`);
      return NextResponse.json({ success: true, processed: false, message: 'Already processed' });
    }

    // --- Call the atomic PL/pgSQL function to credit the wallet ---
    const { data: creditSuccess, error: rpcError } = await supabase.rpc('process_successful_deposit', {
      p_user_id: resolvedUserId,
      p_amount: amount,
      p_reference: reference,
      p_raw_response: payload,
    });

    if (rpcError) {
      console.error('RPC error crediting wallet for reference:', reference, rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    console.log(`Deposit ${reference} processed successfully for user ${resolvedUserId}. Amount: ${amount}`);
    return NextResponse.json({ success: true, processed: creditSuccess });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Webhook endpoint failure:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
