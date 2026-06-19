import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TransactpayService } from '@/lib/transactpay';
import { sendUserDepositConfirmed, sendAdminNewDeposit } from '@/lib/email';

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

    // Parse body first to extract reference for verification fallback
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(bodyText);
    } catch (parseErr) {
      console.error('Failed to parse webhook body JSON:', parseErr);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { event, data } = payload;
    const rawData = (data || payload.data || payload.Data || payload) as Record<string, unknown>;
    const metadata = rawData.metadata as Record<string, unknown> | undefined;
    const reference = String(
      rawData.orderReference ||
      rawData.OrderReference ||
      rawData.order_reference ||
      rawData.reference ||
      rawData.Reference ||
      rawData.paymentReference ||
      rawData.payment_reference ||
      rawData.PaymentReference ||
      ''
    );

    // Verify callback authenticity
    let isValid = TransactpayService.verifySignature(bodyText, signature);

    if (!isValid && reference) {
      console.log(`Webhook signature failed/missing for reference ${reference}. Attempting secure outbound API verification fallback...`);
      try {
        const apiKey = process.env.TRANSACTPAY_PUBLIC_KEY;
        const apiResponse = await fetch('https://payment-api-service.transactpay.ai/payment/order/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey || ''
          },
          body: JSON.stringify({ reference })
        });
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          console.log(`Transactpay verify status response for ${reference}:`, JSON.stringify(apiData, null, 2));
          
          const apiStatus = (apiData.status || '').toLowerCase();
          const apiStatusCode = (apiData.statusCode || apiData.status_code || '');
          const apiDataStatus = (apiData.data?.status || apiData.data?.orderSummary?.status || '').toLowerCase();

          if (
            apiStatus === 'success' || 
            apiStatus === 'successful' || 
            apiStatusCode === '00' || 
            apiDataStatus === 'success' || 
            apiDataStatus === 'successful'
          ) {
            console.log(`✅ Outbound verification succeeded for reference ${reference}. Overriding signature validation.`);
            isValid = true;
          } else {
            console.warn(`Outbound verification failed for reference ${reference}. Status is not successful.`);
          }
        } else {
          console.error(`Transactpay verify status endpoint returned HTTP error: ${apiResponse.status}`);
        }
      } catch (verifyErr) {
        console.error(`Failed during outbound status check fallback for reference ${reference}:`, verifyErr);
      }
    }

    if (!isValid) {
      console.warn('Invalid Transactpay webhook signature. Request blocked.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Transactpay webhook verified successfully:', JSON.stringify(payload, null, 2));

    let amount = 0;
    let isSuccess = false;
    let userId: string | null = null;

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

    const lowerStatus = String(rawStatus).toLowerCase();
    const rawStatusCode =
      payload.statusCode ||
      payload.StatusCode ||
      rawData.statusCode ||
      rawData.StatusCode ||
      '';

    // Check if webhook is successful
    const successEvents = ['payment.success', 'order.successful', 'charge.completed'];
    const lowerEvent = String(event || payload.event || '').toLowerCase();

    isSuccess =
      lowerStatus === 'success' ||
      lowerStatus === 'successful' ||
      rawStatusCode === '00' ||
      successEvents.includes(lowerEvent);

    // Fallback userId extraction (mainly for mock/sandbox)
    userId = (metadata?.userId || metadata?.user_id || rawData.userId || rawData.user_id || null) as string | null;

    if (!isSuccess || !reference || amount <= 0) {
      console.log(`Skipping webhook payload: reference=${reference}, amount=${amount}, isSuccess=${isSuccess}`);
      return NextResponse.json({ success: true, message: 'Skipping unhandled or unsuccessful transaction' });
    }

    const supabase = createAdminClient();

    // --- Look up the deposit record by reference to get the user_id AND the original amount ---
    const { data: deposit, error: lookupError } = await supabase
      .from('deposits')
      .select('id, user_id, amount, status')
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

    // --- CRITICAL: Use the deposit record amount from the database, NOT the webhook payload ---
    // Transactpay's totalAmountCharged includes gateway fees which inflates the credited amount.
    // The deposit.amount is the original user-requested amount saved at initialization time.
    const creditAmount = deposit ? Number(deposit.amount) : amount;

    if (creditAmount <= 0) {
      console.log(`Skipping webhook: creditAmount resolved to ${creditAmount} for reference ${reference}`);
      return NextResponse.json({ success: true, message: 'Skipping: amount is zero or negative' });
    }

    console.log(`Webhook credit: deposit.amount=${deposit?.amount}, webhook.amount=${amount}, using=${creditAmount}`);

    // --- Call the atomic PL/pgSQL function to credit the wallet ---
    const { data: creditSuccess, error: rpcError } = await supabase.rpc('process_successful_deposit', {
      p_user_id: resolvedUserId,
      p_amount: creditAmount,
      p_reference: reference,
      p_raw_response: payload,
    });

    if (rpcError) {
      console.error('RPC error crediting wallet for reference:', reference, rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    console.log(`Deposit ${reference} processed successfully for user ${resolvedUserId}. Amount: ${creditAmount}`);

    // Send email notifications (fire-and-forget)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', resolvedUserId)
        .maybeSingle();

      const { data: authUser } = await supabase.auth.admin.getUserById(resolvedUserId);
      const userEmail = authUser?.user?.email || '';
      const firstName = profile?.first_name || 'Investor';
      const lastName = profile?.last_name || '';

      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', resolvedUserId)
        .maybeSingle();

      const newBalance = Number(wallet?.balance || 0);

      await Promise.all([
        sendUserDepositConfirmed(userEmail, firstName, creditAmount, reference, newBalance),
        sendAdminNewDeposit(userEmail, `${firstName} ${lastName}`.trim(), creditAmount, reference, resolvedUserId),
      ]);
    } catch (emailErr) {
      console.error('[webhook/transactpay] Email error:', emailErr);
    }

    return NextResponse.json({ success: true, processed: creditSuccess });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Webhook endpoint failure:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
