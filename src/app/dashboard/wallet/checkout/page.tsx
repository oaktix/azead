'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrendingUp, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  const reference = searchParams.get('reference') || '';
  const amount = Number(searchParams.get('amount') || '0');
  const userId = searchParams.get('userId') || '';
  const email = searchParams.get('email') || '';

  const handleSimulatePayment = async (success: boolean) => {
    setLoading(true);
    try {
      if (success) {
        // Send request to our webhook endpoint with the mock signature
        const response = await fetch('/api/webhooks/transactpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-transactpay-signature': 'mock-signature'
          },
          body: JSON.stringify({
            event: 'payment.success',
            data: {
              reference,
              amount,
              status: 'success',
              customer: { email },
              metadata: { userId }
            }
          })
        });

        const resData = await response.json();
        if (response.ok && resData.success) {
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard/wallet');
          }, 2000);
        } else {
          alert('Webhook error: ' + (resData.error || 'Failed to credit wallet'));
        }
      } else {
        setStatus('failed');
        setTimeout(() => {
          router.push('/dashboard/wallet');
        }, 2000);
      }
    } catch (e) {
      console.error(e);
      alert('Error triggering payment callback');
    } finally {
      setLoading(false);
    }
  };

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative text-center">
      <div className="flex flex-col items-center mb-6">
        <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white font-heading">Transactpay Gateway</h2>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Sandbox Simulator</span>
      </div>

      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 mb-6 font-mono text-sm space-y-2.5 text-left">
        <div className="flex justify-between text-slate-400">
          <span>Merchant:</span>
          <span className="text-white font-bold">Azead Capital</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Reference:</span>
          <span className="text-white truncate max-w-[180px]">{reference}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Customer:</span>
          <span className="text-white truncate max-w-[180px]">{email}</span>
        </div>
        <div className="flex justify-between text-base border-t border-slate-800 pt-3 font-bold text-white">
          <span>Amount:</span>
          <span className="text-emerald-400">{formatNaira(amount)}</span>
        </div>
      </div>

      {status === 'success' && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-center gap-2 mb-6">
          <ShieldCheck className="w-5 h-5 animate-bounce" />
          <span>Payment Verified! Redirecting...</span>
        </div>
      )}

      {status === 'failed' && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm flex items-center justify-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5" />
          <span>Payment Failed. Returning to wallet...</span>
        </div>
      )}

      {status === 'idle' && (
        <div className="space-y-3">
          <button
            onClick={() => handleSimulatePayment(true)}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Simulate Success (Credit Wallet)</span>
          </button>
          <button
            onClick={() => handleSimulatePayment(false)}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
          >
            Simulate Cancel/Failure
          </button>
        </div>
      )}
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030712] justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/10 via-slate-950 to-slate-950 -z-10" />
      <Suspense fallback={
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      }>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
