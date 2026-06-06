import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'user'; // 'admin' or 'user'
    const type = searchParams.get('type') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const search = searchParams.get('search') || '';
    const minAmount = searchParams.get('minAmount') || '';
    const maxAmount = searchParams.get('maxAmount') || '';

    let transactions: Record<string, unknown>[] = [];

    if (scope === 'admin') {
      // Admin: use admin client, return ALL transactions with user info
      const supabase = createAdminClient();

      let query = supabase
        .from('wallet_transactions')
        .select(`
          id,
          amount,
          type,
          reference,
          description,
          created_at,
          wallets (
            user_id,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }
      if (endDate) {
        // Add 1 day to include the end date fully
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        query = query.lt('created_at', end.toISOString());
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Fetch auth users to map emails
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
      const authMap = new Map(authUsers?.map(u => [u.id, u.email]));

      transactions = (data || []).map((t) => {
        const rawWallet = t.wallets as unknown as { user_id: string; profiles: { first_name: string; last_name: string } | null } | null;
        const profile = rawWallet?.profiles;
        const userId = rawWallet?.user_id || '';

        return {
          id: t.id,
          amount: Number(t.amount),
          type: t.type,
          reference: t.reference,
          description: t.description,
          created_at: t.created_at,
          user_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
          user_email: authMap.get(userId) || 'N/A',
        };
      });

    } else {
      // User: use authenticated server client, return only their transactions
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!wallet) {
        return NextResponse.json({ error: 'No wallet found' }, { status: 404 });
      }

      let query = supabase
        .from('wallet_transactions')
        .select('id, amount, type, reference, description, created_at')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false });

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        query = query.lt('created_at', end.toISOString());
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      transactions = (data || []).map((t) => ({
        ...t,
        amount: Number(t.amount),
        user_name: '',
        user_email: user.email || '',
      }));
    }

    // Apply client-side filters for search and amount range
    let filtered = transactions;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((tx) =>
        String(tx.reference || '').toLowerCase().includes(q) ||
        String(tx.description || '').toLowerCase().includes(q) ||
        String(tx.user_name || '').toLowerCase().includes(q) ||
        String(tx.user_email || '').toLowerCase().includes(q)
      );
    }

    if (minAmount) {
      const min = Number(minAmount);
      filtered = filtered.filter((tx) => Math.abs(Number(tx.amount)) >= min);
    }

    if (maxAmount) {
      const max = Number(maxAmount);
      filtered = filtered.filter((tx) => Math.abs(Number(tx.amount)) <= max);
    }

    // Build CSV
    const isAdmin = scope === 'admin';
    const headers = isAdmin
      ? ['Date', 'Reference', 'Type', 'Description', 'Amount (NGN)', 'Investor Name', 'Investor Email']
      : ['Date', 'Reference', 'Type', 'Description', 'Amount (NGN)'];

    const escapeCSV = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = filtered.map((tx) => {
      const base = [
        new Date(String(tx.created_at)).toLocaleString('en-GB'),
        String(tx.reference || ''),
        String(tx.type || ''),
        String(tx.description || ''),
        String(tx.amount),
      ];
      if (isAdmin) {
        base.push(String(tx.user_name || ''), String(tx.user_email || ''));
      }
      return base.map(escapeCSV).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="azead-ledger-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('CSV Export error:', err);
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
