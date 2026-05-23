"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function AdminSignInPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Development shortcut removed - use Supabase admin credentials

    // Attempt normal sign‑in
    let { error: signInError, data: authData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If sign‑in fails and credentials match our dev admin defaults, create the admin user
    if (signInError && email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      // Create admin user with role metadata in auth
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: 'admin' as any } },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      // Insert admin profile record
      if (signUpData?.user?.id) {
        await supabase.from('profiles').insert({ id: signUpData.user.id, role: 'admin' });
      }
      // Sign‑in the newly created admin
      const { error: retryError, data: retryData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (retryError) {
        setError(retryError.message);
        setLoading(false);
        return;
      }
      // Use retryData for role check below
      authData = retryData;
    } else if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData?.user?.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      setError('Access denied: admin account required.');
      await supabase.auth.signOut();
    } else {
      router.push('/admin');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030712]">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-slate-900 p-8 text-white">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <h2 className="text-2xl font-bold">Admin Sign In</h2>
        </div>
        {error && (
          <div className="flex items-center space-x-2 rounded bg-red-950/20 p-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-sm text-white focus:border-emerald-500"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-sm text-white focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded bg-emerald-500 py-2 font-bold text-slate-950 hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{loading ? 'Signing in…' : 'Sign In as Admin'}</span>
          </button>
        </form>
        <p className="text-center text-xs text-slate-400">
          Not an admin?{' '}
          <Link href="/auth/signin" className="text-emerald-400 underline">
            User Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
