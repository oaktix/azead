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
  const { data: deposits, error } = await supabase
    .from('deposits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching deposits:', error);
    return;
  }

  console.log('Recent Deposits:');
  console.log(JSON.stringify(deposits, null, 2));
}

run();
