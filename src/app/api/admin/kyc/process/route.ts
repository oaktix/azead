import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendUserKYCApproved, sendUserKYCRejected, sendAdminKYCSubmission } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Validate session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { kycId, userId, action, reason } = await request.json();
    if (!kycId || !userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    if (action === 'approve') {
      // Update kyc document status to approved
      await adminClient
        .from('kyc_documents')
        .update({ status: 'approved', admin_notes: null })
        .eq('id', kycId);

      // Update user profile kyc_status to verified
      await adminClient
        .from('profiles')
        .update({ kyc_status: 'verified' })
        .eq('id', userId);

      // Log admin action
      await adminClient.from('admin_logs').insert({
        admin_id: user.id,
        action: 'approve_kyc',
        details: { kycId, userId }
      });

      // Notify user
      await adminClient.from('notifications').insert({
        user_id: userId,
        title: 'KYC Verification Approved!',
        message: 'Your account identity verification has been successfully verified.'
      });

      // Send approval email (fire-and-forget)
      try {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('first_name')
          .eq('id', userId)
          .maybeSingle();
        const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
        const userEmail = authUser?.user?.email || '';
        const firstName = profile?.first_name || 'Investor';
        await sendUserKYCApproved(userEmail, firstName);
      } catch (emailErr) {
        console.error('[admin/kyc] KYC approval email error:', emailErr);
      }
    } else {
      // Update kyc document status to rejected
      await adminClient
        .from('kyc_documents')
        .update({ status: 'rejected', admin_notes: reason || 'Invalid documents' })
        .eq('id', kycId);

      // Update user profile kyc_status to rejected
      await adminClient
        .from('profiles')
        .update({ kyc_status: 'rejected' })
        .eq('id', userId);

      // Log admin action
      await adminClient.from('admin_logs').insert({
        admin_id: user.id,
        action: 'reject_kyc',
        details: { kycId, userId, reason }
      });

      // Notify user
      await adminClient.from('notifications').insert({
        user_id: userId,
        title: 'KYC Verification Rejected',
        message: `Your identity verification was rejected. Reason: ${reason || 'None provided'}`
      });

      // Send rejection email (fire-and-forget)
      try {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('first_name')
          .eq('id', userId)
          .maybeSingle();
        const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
        const userEmail = authUser?.user?.email || '';
        const firstName = profile?.first_name || 'Investor';
        await sendUserKYCRejected(userEmail, firstName, reason || 'Invalid or unclear documents');
      } catch (emailErr) {
        console.error('[admin/kyc] KYC rejection email error:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Process KYC admin error:', error);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
