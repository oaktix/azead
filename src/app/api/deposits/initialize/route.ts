import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TransactpayService } from '@/lib/transactpay';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
    }

    // Generate unique reference
    const reference = `DEP-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create pending deposit log in database
    const { error: depositError } = await supabase
      .from('deposits')
      .insert({
        user_id: user.id,
        amount,
        reference,
        provider: 'transactpay',
        status: 'pending'
      });

    if (depositError) {
      throw depositError;
    }

    // Initialize Transactpay payment session
    const checkoutUrl = await TransactpayService.initializePayment({
      userId: user.id,
      email: user.email!,
      amount,
      reference
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Deposit initiation error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
