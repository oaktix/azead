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

export async function POST(request: Request) {
  const authCheck = await validateAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { name, amount, annual_interest_rate, duration_days, is_active } = await request.json();
    if (!name || amount === undefined || annual_interest_rate === undefined || duration_days === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error: insertError } = await adminClient
      .from('investment_packages')
      .insert({
        name,
        amount: Number(amount),
        annual_interest_rate: Number(annual_interest_rate),
        duration_days: Number(duration_days),
        is_active: is_active ?? true
      });

    if (insertError) throw insertError;

    // Log action
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: 'create_investment_package',
      details: { name, amount, annual_interest_rate, duration_days, is_active }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Create investment package admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authCheck = await validateAdmin();
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { id, name, amount, annual_interest_rate, duration_days, is_active } = await request.json();
    if (!id || !name || amount === undefined || annual_interest_rate === undefined || duration_days === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error: updateError } = await adminClient
      .from('investment_packages')
      .update({
        name,
        amount: Number(amount),
        annual_interest_rate: Number(annual_interest_rate),
        duration_days: Number(duration_days),
        is_active: is_active ?? true
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log action
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: 'update_investment_package',
      details: { id, name, amount, annual_interest_rate, duration_days, is_active }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update investment package admin error:', error);
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
      return NextResponse.json({ error: 'Missing package ID' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error: deleteError } = await adminClient
      .from('investment_packages')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Log action
    await adminClient.from('admin_logs').insert({
      admin_id: authCheck.adminId,
      action: 'delete_investment_package',
      details: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Delete investment package admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
