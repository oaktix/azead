import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TransactpayService } from '@/lib/transactpay';

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    
    // Log all incoming headers to help verify the correct signature header name
    const headersMap: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersMap[key] = value;
    });
    console.log('Incoming webhook headers:', JSON.stringify(headersMap, null, 2));

    const signature = 
      request.headers.get('x-transactpay-signature') || 
      request.headers.get('x-signature') || 
      request.headers.get('X-Signature') || 
      request.headers.get('signature') || 
      '';

    console.log('Extracted webhook signature:', signature);
    console.log('Incoming webhook raw body:', bodyText);

    // Verify callback authenticity
    const isValid = TransactpayService.verifySignature(bodyText, signature);
    if (!isValid) {
      console.warn('Invalid Transactpay webhook signature. Request blocked.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    const { event, data } = payload;

    console.log('Transactpay webhook verified successfully:', JSON.stringify(payload, null, 2));

    let reference = '';
    let amount = 0;
    let isSuccess = false;
    let userId: string | null = null;

    // Support both nested data/Data and top-level payloads
    const rawData = data || payload.data || payload.Data || payload;

    // Resolve reference (check camelCase, PascalCase, snake_case, order, payment and fallback keys)
    reference =
      rawData.orderReference ||
      rawData.OrderReference ||
      rawData.order_reference ||
      rawData.reference ||
      rawData.Reference ||
      rawData.paymentReference ||
      rawData.payment_reference ||
      rawData.PaymentReference ||
      '';

    // Resolve amount
    const rawAmount =
      rawData.totalAmountCharged ||
      rawData.TotalAmountCharged ||
      rawData.amount ||
      rawData.Amount ||
      rawData.orderAmount ||
      rawData.order_amount;

    amount = Number(rawAmount || 0);

    // Resolve status and event
    const rawStatus =
      rawData.status ||
      rawData.Status ||
      payload.status ||
      payload.Status ||
      '';

    const lowerStatus = rawStatus.toLowerCase();
    const rawStatusCode =
      payload.statusCode ||
      payload.StatusCode ||
      rawData.statusCode ||
      rawData.StatusCode ||
      '';

    // Check if webhook is successful
    const successEvents = ['payment.success', 'order.successful', 'charge.completed'];
    const lowerEvent = (event || payload.event || '').toLowerCase();

    isSuccess =
      lowerStatus === 'success' ||
      lowerStatus === 'successful' ||
      rawStatusCode === '00' ||
      successEvents.includes(lowerEvent);

    // Fallback userId extraction (mainly for mock/sandbox)
    userId = rawData.metadata?.userId || rawData.metadata?.user_id || rawData.userId || rawData.user_id || null;

    if (!isSuccess || !reference || amount <= 0) {
      console.log(`Skipping webhook payload: reference=${reference}, amount=${amount}, isSuccess=${isSuccess}`);
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
