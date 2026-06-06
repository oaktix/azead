// scripts/create-admin.ts
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
  console.warn('Failed to parse .env.local manually:', e);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Create admin auth user
  const { data: user, error: signUpError } = await supabase.auth.admin.createUser({
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL!,
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD!,
    email_confirm: true,
  });

  if (signUpError) {
    console.error('Admin user creation error:', signUpError);
    process.exit(1);
  }

  // Insert profile with admin role
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: user?.user?.id, role: 'admin' });

  if (profileError) {
    console.error('Profile insert error:', profileError);
    process.exit(1);
  }

  console.log('✅ Admin user created successfully.');
}

main().catch((e) => console.error('Unexpected error:', e));
