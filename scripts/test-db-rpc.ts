import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');
let supabaseUrl = '';
let serviceRoleKey = '';

for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.substring('NEXT_PUBLIC_SUPABASE_URL='.length).trim();
  }
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    serviceRoleKey = line.substring('SUPABASE_SERVICE_ROLE_KEY='.length).trim();
  }
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const userId = '055027eb-b060-458c-9d4f-0c5b62dec1a4';
  const amount = 1000000;
  const reference = 'DEP-E251F867';
  const payload = {
    event: 'payment.success',
    data: {
      reference,
      amount,
      status: 'success',
      customer: { email: 'customer@example.com' }
    }
  };

  console.log(`Calling process_successful_deposit RPC with:`);
  console.log(`userId: ${userId}`);
  console.log(`amount: ${amount}`);
  console.log(`reference: ${reference}`);

  const { data, error } = await supabase.rpc('process_successful_deposit', {
    p_user_id: userId,
    p_amount: amount,
    p_reference: reference,
    p_raw_response: payload
  });

  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success response:', data);
  }
}

run();
