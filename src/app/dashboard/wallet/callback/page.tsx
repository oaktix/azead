'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle, Clock, Loader2, RefreshCw } from 'lucide-react';

type VerifyState = 'verifying' | 'credited' | 'already_done' | 'failed' | 'pending';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [verifyState, setVerifyState] = useState<VerifyState>('verifying');
  const [creditedAmount, setCreditedAmount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const hasVerified = useRef(false);

  // Transactpay appends these params on redirect
  const rawStatus = searchParams.get('status') || '';
  const reference =
    searchParams.get('reference') ||
    searchParams.get('order_reference') ||
    searchParams.get('orderReference') ||
    '';

  const isSuccessStatus =
    rawStatus === 'success' ||
    rawStatus === 'successful' ||
    rawStatus === 'Successful' ||
    rawStatus === 'completed' ||
    rawStatus === 'approved';

  const isFailedStatus =
    rawStatus === 'failed' ||
    rawStatus === 'cancelled' ||
    rawStatus === 'canceled';

  useEffect(() => {
    // Guard: only run once
    if (hasVerified.current) return;
    hasVerified.current = true;

    // If there's no reference, we can't verify
    if (!reference) {
      setVerifyState(isFailedStatus ? 'failed' : 'pending');
      return;
    }

    // If the redirect says it failed, mark immediately
    if (isFailedStatus) {
      setVerifyState('failed');
      return;
    }

    // Even if status is unknown/missing, still attempt verification —
    // Transactpay sometimes redirects without a status param
    verifyDeposit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyDeposit = async () => {
    setVerifyState('verifying');
    try {
      const res = await fetch('/api/deposits/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, status: rawStatus || 'success' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Verification failed');
        setVerifyState('failed');
        return;
      }

      if (data.success) {
        if (data.alreadyProcessed) {
          setVerifyState('already_done');
        } else {
          setVerifyState('credited');
          setCreditedAmount(data.amount ?? null);
        }
      } else {
        // Payment not successful (e.g. failed/cancelled)
        setVerifyState('pending');
      }
    } catch (err) {
      console.error('Verify fetch error:', err);
      setErrorMsg('Network error during verification. Please check your wallet.');
      setVerifyState('failed');
    }
  };

  // Start countdown only once verification is done
  useEffect(() => {
    if (verifyState === 'verifying') return;
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
  }, [verifyState, router]);

  const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl text-center space-y-6">

      {/* VERIFYING */}
      {verifyState === 'verifying' && (
        <>
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground font-heading">Confirming Payment…</h2>
            <p className="text-sm text-muted mt-2">
              Verifying your payment and crediting your wallet. Please wait.
            </p>
          </div>
        </>
      )}

      {/* CREDITED */}
      {verifyState === 'credited' && (
        <>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground font-heading">Wallet Credited! 🎉</h2>
            {creditedAmount !== null && (
              <p className="text-2xl font-bold text-emerald-500 mt-2">
                +{formatNaira(creditedAmount)}
              </p>
            )}
            <p className="text-sm text-muted mt-2">
              Your wallet balance has been updated successfully.
            </p>
          </div>
        </>
      )}

      {/* ALREADY PROCESSED */}
      {verifyState === 'already_done' && (
        <>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground font-heading">Payment Confirmed</h2>
            <p className="text-sm text-muted mt-2">
              This deposit was already processed. Your wallet balance is up to date.
            </p>
          </div>
        </>
      )}

      {/* FAILED */}
      {verifyState === 'failed' && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground font-heading">Payment Failed</h2>
            <p className="text-sm text-muted mt-2">
              {errorMsg || 'Your payment could not be completed. No funds were deducted.'}
            </p>
          </div>
          {reference && (
            <button
              onClick={verifyDeposit}
              className="flex items-center gap-2 mx-auto text-sm text-primary hover:underline"
            >
              <RefreshCw className="w-4 h-4" /> Retry verification
            </button>
          )}
        </>
      )}

      {/* PENDING — status unknown / no reference */}
      {verifyState === 'pending' && (
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

      {/* Reference badge */}
      {reference && (
        <div className="p-3 rounded-xl bg-secondary/40 border border-border">
          <span className="text-[10px] text-muted uppercase tracking-wider block mb-1">Reference</span>
          <span className="text-xs font-mono text-foreground">{reference}</span>
        </div>
      )}

      {/* Countdown / redirect — only show when not still verifying */}
      {verifyState !== 'verifying' && (
        <>
          <p className="text-xs text-muted">
            Redirecting to wallet in <span className="font-bold text-foreground">{countdown}s</span>…
          </p>
          <button
            onClick={() => router.push('/dashboard/wallet')}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-sm transition-all"
          >
            Go to Wallet Now
          </button>
        </>
      )}
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
