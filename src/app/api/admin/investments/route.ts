import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const { data: investments, error: queryError } = await adminClient
      .from('investments')
      .select(`
        *,
        profiles (
          first_name,
          last_name
        ),
        investment_packages (
          name,
          duration_days,
          annual_interest_rate
        )
      `)
      .order('start_date', { ascending: false });

    if (queryError) throw queryError;

    // Fetch user emails to show in lists
    const { data: { users: authUsers }, error: authUsersError } = await adminClient.auth.admin.listUsers();
    if (authUsersError) throw authUsersError;
    const authMap = new Map(authUsers.map(u => [u.id, u.email]));

    const mappedInvestments = (investments || []).map((inv) => ({
      ...inv,
      user_email: authMap.get((inv as { user_id: string }).user_id) || 'N/A'
    }));

    return NextResponse.json({ investments: mappedInvestments });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Fetch investments admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authCheck = await validateAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { userId, packageId, amount, auto_reinvest, status } = await request.json();
    if (!userId || !packageId || amount === undefined || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch package details to populate default rate and calculate maturity date
    const { data: pkg, error: pkgError } = await adminClient
      .from('investment_packages')
      .select('name, annual_interest_rate, duration_days')
      .eq('id', packageId)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Investment package not found' }, { status: 404 });
    }

    const startDate = new Date();
    const durationDays = Number(pkg.duration_days);
    const maturityDate = new Date(startDate);
    maturityDate.setDate(maturityDate.getDate() + durationDays);

    // 2. Insert manual investment
    const { data: newInv, error: insertError } = await adminClient
      .from('investments')
      .insert({
        user_id: userId,
        package_id: packageId,
        amount: Number(amount),
        interest_rate: Number(pkg.annual_interest_rate),
        status: status || 'active',
        start_date: startDate.toISOString(),
        maturity_date: maturityDate.toISOString(),
        last_accrual_date: startDate.toISOString(),
        accrued_interest: 0,
        auto_reinvest: auto_reinvest ?? false
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. Notify user
    const formattedAmt = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(Number(amount));

    await adminClient.from('notifications').insert({
      user_id: userId,
      title: 'Manual Investment Subscribed',
      message: `An administrator has manually subscribed you to the ${pkg.name} package for ${formattedAmt}.`
    });

    // 4. Log in admin activity logs
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: 'create_user_investment_manually',
      details: { userId, packageId, amount: Number(amount), investmentId: newInv?.id }
    });

    return NextResponse.json({ success: true, investment: newInv });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Create investment manually error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authCheck = await validateAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { id, status, auto_reinvest, accrued_interest } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing investment ID' }, { status: 400 });
    }

    if (status && !['active', 'completed', 'early_termination_pending', 'early_terminated'].includes(status)) {
      return NextResponse.json({ error: 'Invalid investment status' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error: updateError } = await adminClient
      .from('investments')
      .update({
        status: status || undefined,
        auto_reinvest: auto_reinvest !== undefined ? auto_reinvest : undefined,
        accrued_interest: accrued_interest !== undefined ? Number(accrued_interest) : undefined,
        last_accrual_date: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log action
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: 'update_user_investment',
      details: { id, status, auto_reinvest, accrued_interest }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update investment admin error:', error);
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
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing investment ID' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error: deleteError } = await adminClient
      .from('investments')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Log action
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: 'delete_user_investment',
      details: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Delete investment admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
