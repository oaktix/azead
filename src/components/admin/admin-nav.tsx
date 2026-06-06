'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  TrendingUp, 
  ShieldAlert, 
  Settings 
} from 'lucide-react';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Users & Staff', href: '/admin/users', icon: Users },
    { name: 'Packages', href: '/admin/packages', icon: Briefcase },
    { name: 'Investments', href: '/admin/investments', icon: TrendingUp },
    { name: 'Compliance', href: '/admin/compliance', icon: ShieldAlert },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-[#0b0f19] border-r border-slate-900 min-h-[calc(100vh-80px)] flex-shrink-0">
        <div className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile Submenu Navigation (horizontal slider) */}
      <nav className="md:hidden h-14 bg-[#0b0f19] border-b border-slate-900 flex items-center overflow-x-auto space-x-2 px-4 py-2 sticky top-20 z-30 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive 
                  ? 'bg-emerald-500 text-slate-950' 
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
