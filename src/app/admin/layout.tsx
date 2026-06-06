import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import AdminNav from '@/components/admin/admin-nav';

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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header Command bar */}
      <header className="h-20 bg-card border-b border-border sticky top-0 z-40 flex justify-between items-center px-4 sm:px-8 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/5">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-foreground font-heading">
              AZEAD CONTROL
            </span>
            <span className="hidden sm:inline-block ml-2.5 text-[9px] font-bold bg-red-500 text-slate-950 px-1.5 py-0.5 rounded uppercase">Security Core</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-input border border-border text-foreground hover:bg-card transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>User Dashboard</span>
          </Link>
          <a title="Sign out" aria-label="Sign out" href="/auth/signout" className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="sr-only">Sign out</span>
          </a>
        </div>
      </header>

      {/* Main layout area with Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        <AdminNav />
        
        {/* Main Admin Contents */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
