'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // Transactpay may append status/reference as query params on redirect
  const status = searchParams.get('status')?.toLowerCase();
  const reference = searchParams.get('reference') || searchParams.get('order_reference') || '';

  const isSuccess = status === 'success' || status === 'successful' || status === 'completed';
  const isFailed = status === 'failed' || status === 'cancelled' || status === 'canceled';
  // If status is not explicitly success or failed, treat as pending
  const isPending = !isSuccess && !isFailed;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard/wallet');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl text-center space-y-6">
      {isSuccess && (
        <>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground font-heading">Payment Successful!</h2>
            <p className="text-sm text-muted mt-2">
              Your deposit has been processed. Your wallet balance will be updated shortly via our verification system.
            </p>
          </div>
        </>
      )}

      {isFailed && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground font-heading">Payment Failed</h2>
            <p className="text-sm text-muted mt-2">
              Your payment could not be completed. No funds were deducted. Please try again.
            </p>
          </div>
        </>
      )}

      {isPending && (
        <>
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground font-heading">Payment Processing</h2>
            <p className="text-sm text-muted mt-2">
              Your payment is being verified. Your wallet will be credited once confirmation is received.
            </p>
          </div>
        </>
      )}

      {reference && (
        <div className="p-3 rounded-xl bg-secondary/40 border border-border">
          <span className="text-[10px] text-muted uppercase tracking-wider block mb-1">Reference</span>
          <span className="text-xs font-mono text-foreground">{reference}</span>
        </div>
      )}

      <p className="text-xs text-muted">
        Redirecting to wallet in <span className="font-bold text-foreground">{countdown}s</span>...
      </p>

      <button
        onClick={() => router.push('/dashboard/wallet')}
        className="w-full py-3 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-sm transition-all"
      >
        Return to Wallet Now
      </button>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <div className="flex flex-col min-h-[60vh] justify-center items-center px-4 py-12">
      <Suspense fallback={
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
