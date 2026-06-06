'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, AlertTriangle, Clock, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

type VerifyState = 'verifying' | 'credited' | 'already_done' | 'failed' | 'pending';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  const rawStatus =
    searchParams.get('status') ||
    searchParams.get('paymentStatus') ||
    searchParams.get('payment_status') ||
    searchParams.get('transactionStatus') ||
    searchParams.get('transaction_status') ||
    '';

  const reference =
    searchParams.get('reference') ||
    searchParams.get('orderReference') ||
    searchParams.get('order_reference') ||
    searchParams.get('paymentReference') ||
    searchParams.get('payment_reference') ||
    searchParams.get('transactionReference') ||
    searchParams.get('transaction_reference') ||
    searchParams.get('txRef') ||
    searchParams.get('tx_ref') ||
    '';

  const normalizedStatus = rawStatus.toLowerCase();

  const isFailedStatus =
    normalizedStatus === 'failed' ||
    normalizedStatus === 'cancelled' ||
    normalizedStatus === 'canceled';

  // Determine initial state based on parameters directly
  const initialVerifyState = (() => {
    if (!reference) {
      return isFailedStatus ? 'failed' : 'pending';
    }
    if (isFailedStatus) {
      return 'failed';
    }
    return 'verifying';
  })();

  const [verifyState, setVerifyState] = useState<VerifyState>(initialVerifyState);
  const [creditedAmount, setCreditedAmount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const hasVerified = useRef(false);

  const verifyDeposit = async () => {
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

  useEffect(() => {
    // Guard: only run once
    if (hasVerified.current) return;
    hasVerified.current = true;

    // Only verify if we initialized into 'verifying' state
    if (verifyState === 'verifying') {
      setTimeout(() => {
        verifyDeposit();
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Generate unique randomized inline variables for floating particles deterministically
  const particles = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i / 14) * 360;
    const rad = (angle * Math.PI) / 180;
    const xDrift = Math.round(Math.cos(rad) * 40) + 'px';
    const left = Math.round(50 + Math.cos(rad) * 20) + '%';
    const top = Math.round(50 + Math.sin(rad) * 20) + '%';
    const delay = (i * 0.15).toFixed(2) + 's';
    // Deterministic duration: between 2.0s and 3.5s
    const duration = (2.0 + ((i * 7) % 15) / 10).toFixed(2) + 's';
    // Deterministic size: between 4px and 10px
    const size = Math.round(4 + ((i * 3) % 7)) + 'px';
    const colors = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#f59e0b', '#3b82f6'];
    const color = colors[i % colors.length];

    return { left, top, delay, duration, size, color, xDrift };
  });

  // Generate exploding confetti pieces deterministically
  const confettiPieces = Array.from({ length: 32 }).map((_, i) => {
    // Golden ratio spacing for angle distribution
    const angle = (i * 137.5) % 360;
    // Deterministic distance: between 80px and 180px
    const distance = 80 + ((i * 17) % 101);
    const rad = (angle * Math.PI) / 180;
    const cX = Math.round(Math.cos(rad) * distance) + 'px';
    const cY = Math.round(Math.sin(rad) * distance) + 'px';
    // Deterministic rotation angle
    const cR = ((i * 45) % 360) + 'deg';
    // Deterministic delay: between 0.0s and 0.2s
    const delay = (((i * 3) % 20) / 100).toFixed(2) + 's';
    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'];
    const color = colors[i % colors.length];
    // Deterministic size: between 6px and 14px
    const size = Math.round(6 + ((i * 5) % 9)) + 'px';
    const isRound = i % 2 === 0;

    return { cX, cY, cR, delay, color, size, isRound };
  });

  const particleClassesStyles = particles.map((p, i) => `
    .particle-dot-${i} {
      left: ${p.left};
      top: ${p.top};
      --x-drift: ${p.xDrift};
      --dur: ${p.duration};
      --delay: ${p.delay};
      background-color: ${p.color};
      width: ${p.size};
      height: ${p.size};
    }
  `).join('\n');

  const confettiClassesStyles = confettiPieces.map((c, i) => `
    .confetti-piece-${i} {
      --c-x: ${c.cX};
      --c-y: ${c.cY};
      --c-r: ${c.cR};
      --delay: ${c.delay};
      background-color: ${c.color};
      width: ${c.size};
      height: ${c.size};
      border-radius: ${c.isRound ? '50%' : '20%'};
    }
  `).join('\n');

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
      
      {/* Embedded Premium CSS Animations */}
      <style>{`
        @keyframes checkmarkBounce {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.15); }
          75% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes particleFloat {
          0% { transform: translateY(10px) scale(0); opacity: 0; }
          20% { opacity: 0.9; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-90px) translateX(var(--x-drift)) scale(1.1); opacity: 0; }
        }
        @keyframes confettiExplode {
          0% { transform: translate(-50%, -50%) translate(0, 0) scale(0) rotate(0deg); opacity: 1; }
          80% { opacity: 0.9; }
          100% { transform: translate(-50%, -50%) translate(var(--c-x), var(--c-y)) scale(1) rotate(var(--c-r)); opacity: 0; }
        }
        @keyframes subtleScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .animate-checkmark {
          animation: checkmarkBounce 0.75s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-pulse-ring-1 {
          animation: pulseRing 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .animate-pulse-ring-2 {
          animation: pulseRing 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          animation-delay: 0.7s;
        }
        .particle-dot {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: particleFloat var(--dur) ease-out infinite;
          animation-delay: var(--delay);
        }
        .confetti-piece {
          position: absolute;
          top: 50%;
          left: 50%;
          pointer-events: none;
          animation: confettiExplode 1.4s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          animation-delay: var(--delay);
        }
        .animate-subtle-scale {
          animation: subtleScale 3s ease-in-out infinite;
        }
        ${particleClassesStyles}
        ${confettiClassesStyles}
      `}</style>

      {/* Decorative radial lighting background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* VERIFYING */}
      {verifyState === 'verifying' && (
        <div className="space-y-6 py-4">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            <Loader2 className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground font-heading">Confirming Payment…</h2>
            <p className="text-sm text-muted max-w-xs mx-auto">
              Verifying your payment and updating your credentials. Please keep this window open.
            </p>
          </div>
        </div>
      )}

      {/* CREDITED (SUCCESS STATE WITH CONFETTI & PARTICLES) */}
      {verifyState === 'credited' && (
        <div className="space-y-6 py-2">
          {/* Confetti Explosion Layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiPieces.map((c, i) => (
              <div
                key={i}
                className={`confetti-piece confetti-piece-${i}`}
              />
            ))}
          </div>

          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            {/* Animated Pulse Waves */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-pulse-ring-1" />
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-pulse-ring-2" />
            
            {/* Floating Particles Layer */}
            {particles.map((p, i) => (
              <div
                key={i}
                className={`particle-dot particle-dot-${i}`}
              />
            ))}

            <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-checkmark shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-9 h-9" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-foreground font-heading tracking-tight">Wallet Credited! 🎉</h2>
            {creditedAmount !== null && (
              <div className="inline-block px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-subtle-scale">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Net Credited Balance</span>
                <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  +{formatNaira(creditedAmount)}
                </span>
              </div>
            )}
            <p className="text-sm text-muted max-w-xs mx-auto">
              Your security handshake was approved and your balance has been successfully topped up.
            </p>
          </div>
        </div>
      )}

      {/* ALREADY PROCESSED */}
      {verifyState === 'already_done' && (
        <div className="space-y-6 py-2">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/5 border border-emerald-500/20" />
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground font-heading">Payment Completed</h2>
            <p className="text-sm text-muted max-w-xs mx-auto">
              This transaction reference has already been processed. Your wallet ledger is fully up to date.
            </p>
          </div>
        </div>
      )}

      {/* FAILED */}
      {verifyState === 'failed' && (
        <div className="space-y-6 py-2">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground font-heading">Payment Failed</h2>
            <p className="text-sm text-muted max-w-xs mx-auto">
              {errorMsg || 'Your payment could not be completed. No funds were deducted.'}
            </p>
          </div>
          {reference && (
            <button
              onClick={verifyDeposit}
              className="flex items-center gap-2 mx-auto text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-secondary/60 hover:bg-secondary border border-border px-4 py-2 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry verification
            </button>
          )}
        </div>
      )}

      {/* PENDING — status unknown / no reference */}
      {verifyState === 'pending' && (
        <div className="space-y-6 py-2">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground font-heading">Payment Processing</h2>
            <p className="text-sm text-muted max-w-xs mx-auto">
              We are waiting for response confirmation from the card gateway. Your wallet will credit in the background.
            </p>
          </div>
        </div>
      )}

      {/* Reference badge */}
      {reference && (
        <div className="p-3 rounded-2xl bg-secondary/30 border border-border/80 relative">
          <span className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">Transaction Handshake Ref</span>
          <span className="text-xs font-mono text-foreground tracking-tight select-all">{reference}</span>
        </div>
      )}

      {/* Countdown / redirect — only show when not still verifying */}
      {verifyState !== 'verifying' && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted">
            Redirecting to wallet in <span className="font-bold text-foreground font-mono">{countdown}s</span>…
          </p>
          <button
            onClick={() => router.push('/dashboard/wallet')}
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-sm transition-all shadow-lg hover:shadow-primary/10"
          >
            Go to Wallet Now
          </button>
        </div>
      )}
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <div className="flex flex-col min-h-[70vh] justify-center items-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Ambient glowing background shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Suspense fallback={
        <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 flex flex-col justify-center items-center space-y-4 shadow-xl">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted">Loading secure payload...</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
