import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Validate that request is from an authorized admin
async function validateAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }
  return { adminId: user.id };
}

export async function GET() {
  const authCheck = await validateAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const adminClient = createAdminClient();

    // 1. Fetch profiles
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // 2. Fetch wallets
    const { data: wallets, error: walletsError } = await adminClient
      .from('wallets')
      .select('user_id, balance');

    if (walletsError) throw walletsError;

    // 3. Fetch auth users to get emails
    const { data: { users: authUsers }, error: authUsersError } = await adminClient.auth.admin.listUsers();
    if (authUsersError) throw authUsersError;

    // Map everything together
    const walletMap = new Map(wallets?.map(w => [w.user_id, w.balance]));
    const authMap = new Map(authUsers.map(u => [u.id, u.email]));

    const usersList = profiles.map(p => ({
      ...p,
      email: authMap.get(p.id) || 'N/A',
      balance: Number(walletMap.get(p.id) || 0),
    }));

    return NextResponse.json({ users: usersList });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Fetch users admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authCheck = await validateAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { email, password, first_name, last_name, phone, role } = await request.json();
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (role && !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Create auth user
    const { data: authResult, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, phone }
    });

    if (createError) throw createError;
    const newUserId = authResult.user?.id;

    if (!newUserId) {
      return NextResponse.json({ error: 'Failed to retrieve new user ID' }, { status: 500 });
    }

    // Update profile role and metadata (since handle_new_user trigger defaults to 'user')
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        first_name,
        last_name,
        phone: phone || null,
        role: role || 'user'
      })
      .eq('id', newUserId);

    if (profileError) throw profileError;

    // Log action
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: role === 'admin' ? 'create_staff' : 'create_user',
      details: { email, newUserId, role: role || 'user' }
    });

    return NextResponse.json({ success: true, userId: newUserId });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Create user admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authCheck = await validateAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { userId, first_name, last_name, phone, role, kyc_status } = await request.json();
    if (!userId || !first_name || !last_name) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (role && !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (kyc_status && !['pending', 'verified', 'rejected'].includes(kyc_status)) {
      return NextResponse.json({ error: 'Invalid KYC status' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Update profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        first_name,
        last_name,
        phone: phone || null,
        role: role || 'user',
        kyc_status: kyc_status || 'pending'
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    // Log action
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: 'edit_user_profile',
      details: { userId, first_name, last_name, role, kyc_status }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update user admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authCheck = await validateAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Prevent deleting oneself
    if (userId === authCheck.adminId) {
      return NextResponse.json({ error: 'Cannot delete your own administrative account' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Delete user from auth (profiles table cascades)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    // Log action
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: 'delete_user',
      details: { userId }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Delete user admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
