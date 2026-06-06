// scripts/create-admin.ts
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

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
