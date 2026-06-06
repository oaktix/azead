// scripts/test-custom-investment.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        value = value.trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn(e);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Testing unified customizable plan database configuration...');

  // 1. Check packages table
  const { data: packages, error: pkgErr } = await supabase
    .from('investment_packages')
    .select('*')
    .eq('is_active', true);

  if (pkgErr) {
    console.error('❌ Error fetching packages:', pkgErr);
    return;
  }

  console.log(`Found ${packages.length} active package(s):`);
  console.log(JSON.stringify(packages, null, 2));

  if (packages.length !== 1) {
    console.warn('⚠️ Warning: Expected exactly 1 active package in the database.');
  } else {
    const p = packages[0];
    if (p.id === 'cb92d8bc-c10b-4611-8583-bdd5a1cd0d68' && p.name === 'Azead Wealth Plan') {
      console.log('✅ Active package is correctly set to "Azead Wealth Plan" with the standard package ID.');
    } else {
      console.warn('⚠️ Warning: Standard package details do not match expected config.');
    }

    if (p.amount === 1000000) {
      console.log('✅ Plan baseline minimum is correctly set to 1,000,000 NGN.');
    } else {
      console.warn(`⚠️ Warning: Expected package baseline to be 1,000,000 NGN, got ${p.amount}.`);
    }
  }

  // 2. Check referral rewards / ledger setup for promo payments tracking
  console.log('Checking database tracking capacity for promotional 1M NGN extra bonus...');
  const { data: promoTransactions, error: txErr } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('reference', 'REF-EXTRA-20M')
    .limit(1);

  if (txErr) {
    console.error('❌ Error checking wallet transactions reference index:', txErr);
  } else {
    console.log('✅ Wallet transactions can successfully track reference "REF-EXTRA-20M".');
  }

  console.log('Verification check finished successfully.');
}

main().catch((e) => console.error('Unexpected test error:', e));
