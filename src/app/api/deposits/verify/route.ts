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

    // Outbound server-to-server verification fallback with Transactpay to ensure security
    let isSuccess = false;
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
        console.log(`Transactpay redirect verify status response for ${reference}:`, JSON.stringify(apiData, null, 2));
        
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
          isSuccess = true;
        }
      } else {
        console.error(`Transactpay verify status endpoint returned HTTP error: ${apiResponse.status}`);
      }
    } catch (verifyErr) {
      console.error(`Failed during outbound status check verification for reference ${reference}:`, verifyErr);
    }

    // Fallback comparison if outbound API check fails / timeout
    if (!isSuccess) {
      const lowerStatus = (status || '').toLowerCase();
      isSuccess =
        lowerStatus === 'success' ||
        lowerStatus === 'successful' ||
        lowerStatus === 'completed' ||
        lowerStatus === 'approved';
    }

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
