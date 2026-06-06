import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');
let supabaseUrl = '';
let serviceRoleKey = '';
let transactpaySecret = '';

for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.substring('NEXT_PUBLIC_SUPABASE_URL='.length).trim();
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    serviceRoleKey = line.substring('SUPABASE_SERVICE_ROLE_KEY='.length).trim();
  }
  if (line.startsWith('TRANSACTPAY_SECRET_KEY=')) {
    transactpaySecret = line.substring('TRANSACTPAY_SECRET_KEY='.length).trim();
  }
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testWebhook() {
  console.log('--- STARTING WEBHOOK E2E TEST ---');

  // 1. Get an existing user with a wallet
  const { data: wallets, error: userError } = await supabase
    .from('wallets')
    .select('user_id, balance, profiles(first_name, last_name)')
    .limit(1);

  if (userError || !wallets || wallets.length === 0) {
    console.error('Could not retrieve a user with a wallet from database:', userError);
    return;
  }

  const userId = wallets[0].user_id;
  const profileInfo = wallets[0].profiles as any;
  const fullName = profileInfo ? `${profileInfo.first_name} ${profileInfo.last_name}` : 'Unknown Investor';
  console.log(`Found active investor with wallet for test: ${fullName} (${userId})`);

  const balanceBefore = wallets[0].balance ?? 0;
  console.log(`Wallet Balance BEFORE: ₦${balanceBefore}`);

  // 2. Insert a pending deposit record
  const testRef = 'TEST-WEBHOOK-' + Math.floor(100000 + Math.random() * 900000);
  const testAmount = 250000; // ₦250,000

  console.log(`Inserting pending deposit into DB: Ref=${testRef}, Amount=₦${testAmount}`);
  const { error: insertError } = await supabase
    .from('deposits')
    .insert({
      user_id: userId,
      amount: testAmount,
      reference: testRef,
      status: 'pending',
    });

  if (insertError) {
    console.error('Failed to insert pending deposit:', insertError);
    return;
  }

  // 3. Create Webhook payload and HMAC signature
  const webhookPayload = {
    event: 'payment.success',
    data: {
      orderReference: testRef,
      totalAmountCharged: testAmount,
      status: 'success',
      customer: {
        email: 'test-user@azead.com'
      }
    }
  };

  const payloadString = JSON.stringify(webhookPayload);
  const hmacSignature = crypto
    .createHmac('sha512', transactpaySecret)
    .update(payloadString)
    .digest('hex');

  console.log(`Generated HMAC-SHA512 Signature: ${hmacSignature}`);

  // 4. Send actual HTTP request to local Next.js dev server
  const serverUrl = 'http://localhost:3000/api/webhooks/transactpay';
  console.log(`Sending real HTTP POST to: ${serverUrl}`);

  try {
    const res = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-transactpay-signature': hmacSignature
      },
      body: payloadString
    });

    console.log(`HTTP Response status: ${res.status}`);
    const responseData = await res.json();
    console.log('Server response:', JSON.stringify(responseData, null, 2));
  } catch (fetchErr: any) {
    console.error('Failed to dispatch webhook HTTP request:', fetchErr.message || fetchErr);
    return;
  }

  // 5. Verify the updates
  console.log('Verifying DB modifications...');
  
  // Check deposit status
  const { data: depositAfter } = await supabase
    .from('deposits')
    .select('status')
    .eq('reference', testRef)
    .single();

  console.log(`Deposit record status AFTER webhook: ${depositAfter?.status}`);

  // Check wallet balance
  const { data: walletAfter } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const balanceAfter = walletAfter?.balance ?? 0;
  console.log(`Wallet Balance AFTER: ₦${balanceAfter}`);
  
  const diff = balanceAfter - balanceBefore;
  console.log(`Difference: ₦${diff}`);

  if (depositAfter?.status === 'success' && diff === testAmount) {
    console.log('✅ SUCCESS: Webhook worked perfectly! Deposit marked success and wallet credited.');
  } else {
    console.error('❌ FAILURE: DB did not update as expected.');
  }
}

testWebhook().catch(err => {
  console.error('E2E Webhook test failed:', err);
});
