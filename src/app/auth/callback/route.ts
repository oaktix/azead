import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendUserWelcome, sendAdminNewUserSignup } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && sessionData?.user) {
      const user = sessionData.user;

      // Fire-and-forget: send welcome + admin notification emails
      try {
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();

        const firstName = profile?.first_name || user.user_metadata?.first_name || 'Investor';
        const lastName = profile?.last_name || user.user_metadata?.last_name || '';
        const userEmail = user.email || '';

        // Send in parallel — failures are swallowed inside each function
        await Promise.all([
          sendUserWelcome(userEmail, firstName),
          sendAdminNewUserSignup(userEmail, firstName, lastName, user.id),
        ]);
      } catch (emailErr) {
        console.error('[auth/callback] Email send error:', emailErr);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to signin page if error
  return NextResponse.redirect(`${origin}/auth/signin?error=Could not verify email`);
}
