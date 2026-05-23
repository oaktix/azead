import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Verify authenticated session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/signin');
  }

  // Fetch user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      {/* Top Header Command bar */}
      <header className="h-20 bg-[#0b0f19] border-b border-slate-900 sticky top-0 z-40 flex justify-between items-center px-4 sm:px-8 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/5">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white font-heading">
              AZEAD CONTROL
            </span>
            <span className="hidden sm:inline-block ml-2.5 text-[9px] font-bold bg-red-500 text-slate-950 px-1.5 py-0.5 rounded uppercase">Security Core</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>User Dashboard</span>
          </Link>
          <a title="Sign out" aria-label="Sign out" href="/auth/signout" className="p-2 rounded-lg bg-red-950/20 text-red-400 hover:text-red-300 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="sr-only">Sign out</span>
          </a>
        </div>
      </header>

      {/* Main Admin Contents */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
