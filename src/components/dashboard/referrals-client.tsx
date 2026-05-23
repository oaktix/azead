'use client';

import React, { useState } from 'react';
import { Award, Copy, Check } from 'lucide-react';

interface Referral {
  id: string;
  referee_name: string;
  created_at: string;
}

interface Reward {
  id: string;
  referee_name: string;
  reward_amount: number;
  status: string;
  created_at: string;
}

interface ReferralsClientProps {
  referralCode: string;
  referrals: Referral[];
  rewards: Reward[];
}

export default function ReferralsClient({
  referralCode,
  referrals,
  rewards,
}: ReferralsClientProps) {
  const [copied, setCopied] = useState(false);

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/signup?ref=${referralCode}` 
    : `https://azead.com/auth/signup?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  const totalRewardsAmount = rewards.reduce((sum, r) => sum + Number(r.reward_amount), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Overview Titles */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">Referral System</h1>
        <p className="text-xs text-slate-400 mt-1">Earn 2.5% commission on your referee&apos;s first package purchase.</p>
      </div>

      {/* Main Referral Info Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Referral Link Card */}
        <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">My Referral Link</h3>
            <p className="text-xs text-slate-500 mt-1">Share this unique link to refer new investors to Azead.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <input title="Referral Link" aria-label="Referral Link" type="text" readOnly value={referralLink} 
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-mono select-all focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Link</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Rewards Summary */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl flex flex-col justify-between h-44 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Commission Paid</span>
            <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/20 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-emerald-400">
              {formatNaira(totalRewardsAmount)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Credited directly to wallet ledger</div>
          </div>
        </div>

      </div>

      {/* Referrals lists splits */}
      <div className="grid lg:grid-cols-2 gap-8 pt-4">
        
        {/* Referred Friends */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white font-heading px-1">Referred Users ({referrals.length})</h3>
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl min-h-[250px] max-h-[400px] overflow-y-auto space-y-4">
            {referrals.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">No users referred yet. Send your referral link to friends.</p>
            ) : (
              <div className="divide-y divide-slate-900 space-y-4">
                {referrals.map((ref, idx) => (
                  <div key={ref.id} className={`flex justify-between items-center ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold font-mono">
                        {ref.referee_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{ref.referee_name}</div>
                        <div className="text-[8px] text-slate-500 font-mono mt-0.5">Joined: {new Date(ref.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                      Registered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Commissions Reward History */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white font-heading px-1">Affiliate Commissions ({rewards.length})</h3>
          <div className="p-6 rounded-2xl bg-[#0b0f19] border border-slate-900 shadow-xl min-h-[250px] max-h-[400px] overflow-y-auto space-y-4">
            {rewards.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">No commissions received yet. Rewards generate upon referee&apos;s first purchase.</p>
            ) : (
              <div className="divide-y divide-slate-900 space-y-4">
                {rewards.map((rew, idx) => (
                  <div key={rew.id} className={`flex justify-between items-center ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Bonus for referee: {rew.referee_name}</div>
                        <div className="text-[8px] text-slate-500 font-mono mt-0.5">{new Date(rew.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-emerald-400">+{formatNaira(rew.reward_amount)}</div>
                      <span className="text-[8px] font-mono text-emerald-400 uppercase bg-emerald-950/50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        {rew.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
