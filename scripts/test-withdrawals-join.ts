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
  const { data: withdrawals, error } = await supabase
    .from('withdrawals')
    .select(`
      id,
      user_id,
      amount,
      fee,
      payout_amount,
      status,
      bank_name,
      account_number,
      account_name,
      profiles!withdrawals_user_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching withdrawals:', error);
    return;
  }

  console.log(`Found ${withdrawals.length} withdrawals with profiles:`);
  console.log(JSON.stringify(withdrawals, null, 2));
}

run();
