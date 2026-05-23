import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { 
  TrendingUp, 
  Home, 
  Wallet, 
  Layers, 
  Users, 
  User as UserIcon, 
  LogOut,
  AlertCircle
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/signin');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, kyc_status')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-[#0b0f19] border-r border-slate-900">
        <div className="flex items-center space-x-3 px-6 h-20 border-b border-slate-900">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <TrendingUp className="w-5 h-5 text-[#030712]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-heading">
            AZEAD
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-between py-6 px-4">
          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-900 hover:text-white transition-colors text-slate-300">
              <Home className="w-4 h-4 text-emerald-400" />
              <span>Overview</span>
            </Link>
            <Link href="/dashboard/wallet" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-900 hover:text-white transition-colors text-slate-300">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Wallet & Transactions</span>
            </Link>
            <Link href="/dashboard/investments" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-900 hover:text-white transition-colors text-slate-300">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>My Investments</span>
            </Link>
            <Link href="/dashboard/referrals" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-900 hover:text-white transition-colors text-slate-300">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Referrals</span>
            </Link>
            <Link href="/dashboard/profile" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-900 hover:text-white transition-colors text-slate-300">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span>Profile & KYC</span>
            </Link>
          </nav>

          <div className="space-y-4">
            {profile?.kyc_status !== 'verified' && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-400 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>KYC Pending verification. Upload documents.</span>
              </div>
            )}
            
            <div className="border-t border-slate-900 pt-4 flex flex-col space-y-2">
              <div className="px-4">
                <div className="text-xs text-slate-400">Signed in as</div>
                <div className="text-sm font-semibold text-white truncate">{profile?.first_name} {profile?.last_name}</div>
                {profile?.role === 'admin' && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded uppercase">Admin</span>
                )}
              </div>
              
              {profile?.role === 'admin' && (
                <Link href="/admin" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-600 transition-colors">
                  <UserIcon className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <a title="Sign out" aria-label="Sign out" href="/auth/signout" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/20 transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-slate-900 bg-[#0b0f19] flex justify-between items-center px-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#030712]" />
            </div>
            <span className="font-bold tracking-tight text-white font-heading">
              AZEAD
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {profile?.role === 'admin' && (
              <Link href="/admin" className="px-2 py-1 text-xs font-bold bg-emerald-500 text-slate-950 rounded">Admin</Link>
            )}
            <Link title="Profile" aria-label="Profile" href="/dashboard/profile" className="text-slate-300 hover:text-white">
              <UserIcon className="w-5 h-5" />
            </Link>
            <a title="Sign out" aria-label="Sign out" href="/auth/signout" className="text-red-400 hover:text-red-300">
              <LogOut className="w-5 h-5" />
            </a>
          </div>
        </header>

        {/* Mobile Submenu Bar */}
        <nav className="md:hidden h-12 bg-[#0b0f19] border-b border-slate-900 flex justify-around items-center text-[10px] uppercase font-bold text-slate-400 flex-shrink-0 px-2">
          <Link href="/dashboard" className="hover:text-white">Overview</Link>
          <Link href="/dashboard/wallet" className="hover:text-white">Wallet</Link>
          <Link href="/dashboard/investments" className="hover:text-white">Investments</Link>
          <Link href="/dashboard/referrals" className="hover:text-white">Referrals</Link>
          <Link href="/dashboard/profile" className="hover:text-white">KYC</Link>
        </nav>

        {/* Child Router Screens */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
