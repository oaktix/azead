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
  let adminUserId: string | undefined;

  // Create admin auth user
  const { data: user, error: signUpError } = await supabase.auth.admin.createUser({
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL!,
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD!,
    email_confirm: true,
  });

  if (signUpError) {
    if (signUpError.message.includes('already been registered') || signUpError.message.includes('already exists') || (signUpError as { code?: string }).code === 'email_exists') {
      console.log('ℹ️ Admin user already registered in auth. Retrieving user ID...');
      
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Failed to list users to locate existing admin:', listError);
        process.exit(1);
      }
      
      const existingUser = usersData.users.find(u => u.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL!);
      if (!existingUser) {
        console.error('Could not find existing user with email:', process.env.NEXT_PUBLIC_ADMIN_EMAIL!);
        process.exit(1);
      }
      
      adminUserId = existingUser.id;
    } else {
      console.error('Admin user creation error:', signUpError);
      process.exit(1);
    }
  } else {
    adminUserId = user?.user?.id;
  }

  if (!adminUserId) {
    console.error('Failed to resolve Admin User ID');
    process.exit(1);
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', adminUserId)
    .maybeSingle();

  if (!existingProfile) {
    // If no profile exists, insert a new one with default admin details
    const randomRef = lowerHex(adminUserId.replace(/-/g, '').substring(0, 8));
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: adminUserId,
        role: 'admin',
        first_name: 'System',
        last_name: 'Admin',
        referral_code: randomRef,
      });

    if (insertError) {
      console.error('Profile insert error:', insertError);
      process.exit(1);
    }
  } else {
    // Profile exists (likely created by trigger), just update the role to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', adminUserId);

    if (updateError) {
      console.error('Profile role update error:', updateError);
      process.exit(1);
    }
  }

  console.log('✅ Admin user created/updated successfully.');
}

function lowerHex(val: string) {
  return val.toLowerCase();
}

main().catch((e) => console.error('Unexpected error:', e));
