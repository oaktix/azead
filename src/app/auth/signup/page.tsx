'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Lock, Mail, User, Phone, Loader2, AlertCircle, Award } from 'lucide-react';

function SignUpForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referredBy, setReferredBy] = useState(searchParams.get('ref') || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const selectedPkg = searchParams.get('package');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Use NEXT_PUBLIC_APP_URL explicitly so the Supabase confirmation email
    // always links to the production URL, not localhost.
    // Set NEXT_PUBLIC_APP_URL=https://yourdomain.com in your environment variables.
    const appBase = process.env.NEXT_PUBLIC_APP_URL
      || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const redirectTo = `${appBase}/auth/callback`;

    // Call Supabase signup and pass custom metadata
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          referred_by: referredBy || null,
        },
        emailRedirectTo: redirectTo,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 text-emerald-400">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-heading mb-3">
          Verification Required
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          We have sent a verification link to <span className="text-white font-medium">{email}</span>. Please click the link to confirm your account and start investing.
        </p>
        <Link href="/auth/signin" className="w-full block py-3 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 transition-colors">
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4">
          <TrendingUp className="w-6 h-6 text-[#030712]" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-heading">
          Create Azead Account
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Open a premium high-yield investment portal
        </p>
      </div>

      {selectedPkg && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center space-x-3 text-emerald-400 text-xs">
          <Award className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>Selected: Subscribing to <strong className="uppercase">{selectedPkg}</strong> package after signup</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex items-start space-x-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              First Name
            </label>
            <input 
              type="text" 
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Last Name
            </label>
            <input 
              type="text" 
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="+234..."
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Password (Min. 6 chars)
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Referral Code (Optional)
          </label>
          <div className="relative">
            <User className="absolute left-4 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="e.g. 5d92a10"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3.5 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-emerald-400 font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030712] justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/10 via-slate-950 to-slate-950 -z-10" />
      <Suspense fallback={
        <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl p-8 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      }>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
