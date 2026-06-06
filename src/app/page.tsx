'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Shield, 
  Calculator, 
  Lock, 
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  AlertOctagon
} from 'lucide-react';

// Predefined packages from user request
const PACKAGES = [
  { name: 'Basic', amount: 500000, color: 'from-slate-700 to-slate-900', border: 'border-slate-800' },
  { name: 'Standard', amount: 1000000, color: 'from-emerald-800 to-emerald-950', border: 'border-emerald-700/50' },
  { name: 'Silver', amount: 5000000, color: 'from-blue-900 to-slate-950', border: 'border-blue-700/30' },
  { name: 'Gold', amount: 10000000, color: 'from-amber-600/30 to-amber-950/70', border: 'border-amber-500/50' },
  { name: 'Diamond', amount: 20000000, color: 'from-purple-900 to-slate-950', border: 'border-purple-800/40' },
  { name: 'VIP', amount: 50000000, color: 'from-yellow-600/20 to-stone-900', border: 'border-yellow-500/40', tag: 'High Yield VIP' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(1000000);
  const [calcDuration, setCalcDuration] = useState<number>(1); // default 1 year
  
  // Progressive simulation ticker
  const [tickerInterest, setTickerInterest] = useState<number>(0);

  // Auto calculate returns
  const interestRate = 0.25; // 25% annual
  const grossReturn = calcAmount * interestRate * calcDuration;
  const totalPayout = calcAmount + grossReturn;
  const monthlyAccrual = grossReturn / (12 * calcDuration);

  // Progressive ticker emulation on the landing page hero for visual wow
  useEffect(() => {
    const baseInterest = 125430.45;
    let current = baseInterest;
    const interval = setInterval(() => {
      current += Math.random() * 0.15;
      setTickerInterest(current);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <TrendingUp className="w-6 h-6 text-[#030712]" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground font-heading">
                AZEAD
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-8 text-sm font-medium text-muted">
              <a href="#packages" className="hover:text-foreground transition-colors">Packages</a>
              <a href="#calculator" className="hover:text-foreground transition-colors">Calculator</a>
              <a href="#stats" className="hover:text-foreground transition-colors">Transparency</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth/signin" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 dark:text-slate-950 font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/10 text-sm">
                Get Started
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-muted hover:text-foreground">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-3">
            <a href="#packages" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">Packages</a>
            <a href="#calculator" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">Calculator</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">Transparency</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">FAQ</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">Contact</a>
            <div className="pt-4 flex flex-col space-y-2">
              <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 text-sm font-semibold text-muted border border-border rounded-lg hover:bg-card transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 text-sm font-bold bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-600 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-32">
        {/* Ambient background glow and grid mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-background to-background -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10" />
        
        {/* Floating frosted glass shapes in background */}
        <div className="absolute top-1/6 left-1/4 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[90px] -z-10 animate-pulse duration-[6000ms]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[100px] -z-10 animate-pulse duration-[8000ms]" />
        
        {/* Glassmorphic card overlay inside background to give depth */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto max-w-6xl h-[60%] glass rounded-3xl opacity-10 blur-md pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>25.00% Guaranteed Annualized Yield</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground tracking-tight leading-none max-w-4xl mx-auto mb-6 font-heading">
            Premium Wealth Accumulation For Structured Portfolios
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            Secure, regulated, and professional capital investments in NGN. Monitor your interest grow in real-time with our progressive dashboard accrual.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            <Link href="/auth/signup" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 dark:text-slate-950 font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2">
              Create Investment Account <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#calculator" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-card border border-border text-foreground hover:bg-muted/10 transition-colors flex items-center justify-center">
              Calculate Returns
            </a>
          </div>

          {/* Visual Accrual Widget */}
          <div className="max-w-xl mx-auto p-6 rounded-2xl glass shadow-2xl relative">
            <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-md bg-emerald-500/20 dark:bg-emerald-950 border border-emerald-500/35 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono tracking-wider uppercase">
              Live Accrual Simulation
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted font-medium">Accumulating Portfolio Yield</span>
              <span className="text-[10px] text-muted font-mono">1.0 Year Lock-In</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-foreground mb-2 accrual-glow">
              {formatNaira(tickerInterest)}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-1.5 mb-1 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[45%] rounded-full animate-pulse" />
            </div>
            <div className="flex justify-between text-[10px] text-muted">
              <span>Principal: ₦500,000.00</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Yield Rate: 25.00% APR</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 border-t border-border bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
              Built For Serious Investors
            </h2>
            <p className="mt-4 text-muted max-w-xl mx-auto">
              We leverage structural capital allocation algorithms and secure manual liquidity auditing to yield a premium 25% ARR.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-card border border-border hover:border-emerald-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 font-heading">Secure Vault Infrastructure</h3>
              <p className="text-sm text-muted leading-relaxed">
                Your investment capital is securely logged in double-entry atomic database systems. Rigorous compliance filters govern withdrawal allocations.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border hover:border-emerald-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 font-heading">Progressive Dashboard Accrual</h3>
              <p className="text-sm text-muted leading-relaxed">
                Watch your capital appreciate live. Interest is accumulated to your user dashboard in real-time, matching your premium growth vector.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border hover:border-emerald-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 font-heading">Lock-In Integrity</h3>
              <p className="text-sm text-muted leading-relaxed">
                Structured portfolios operate on a 1-year lock-in with clear rules. Early termination is protected via standard processing models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
              Select Your Investment Level
            </h2>
            <p className="mt-4 text-muted max-w-xl mx-auto">
              Our products are grouped into six distinct capital classes to match your balance tier.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PACKAGES.map((pkg, idx) => (
              <div 
                key={idx} 
                className={`rounded-2xl bg-card border border-border p-8 flex flex-col justify-between relative shadow-xl overflow-hidden group hover:border-emerald-500/30 transition-all`}
              >
                {pkg.tag && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {pkg.tag}
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-bold text-foreground font-heading">{pkg.name} Package</h3>
                  <div className="mt-4 flex items-baseline text-foreground">
                    <span className="text-3xl font-extrabold font-mono tracking-tight">
                      {formatNaira(pkg.amount).replace('.00', '')}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">Fixed purchase amount (NGN)</p>

                  <ul className="mt-6 space-y-3.5 border-t border-border pt-6">
                    <li className="flex items-center space-x-3 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                      <span>25.00% Annualized yield</span>
                    </li>
                    <li className="flex items-center space-x-3 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                      <span>1-Year Lock-in Duration</span>
                    </li>
                    <li className="flex items-center space-x-3 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                      <span>Maturity Reinvest/Payout options</span>
                    </li>
                    <li className="flex items-center space-x-3 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                      <span>Estimated Return: {formatNaira(pkg.amount * 0.25)}</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <Link 
                    href={`/auth/signup?package=${pkg.name.toLowerCase()}`}
                    className="w-full block text-center py-3 rounded-xl bg-background border border-border text-sm font-semibold text-foreground hover:bg-muted/10 transition-all group-hover:border-emerald-500/30"
                  >
                    Subscribe Level
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section id="calculator" className="py-20 border-t border-border bg-card/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-6">
                <Calculator className="w-4 h-4" />
                <span>Yield Simulator</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading mb-4">
                Calculate Your Wealth Growth
              </h2>
              <p className="text-muted leading-relaxed mb-6">
                Select your parameters to simulate your portfolio returns. Learn how reinvesting interest increases your yield over time.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 text-sm text-muted">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Returns locked and calculated in secure smart ledger systems.</span>
                </div>
                <div className="flex items-start space-x-3 text-sm text-muted">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Early termination available under strict penalty protocols.</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border shadow-xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Investment Capital (NGN)
                  </label>
                  <input 
                    type="number" 
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Enter amount (e.g. 1000000)"
                    min="100000"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[500000, 1000000, 5000000, 10000000].map((amt) => (
                      <button 
                        key={amt}
                        onClick={() => setCalcAmount(amt)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-all ${
                          calcAmount === amt 
                            ? 'bg-emerald-500 text-slate-950 border-emerald-500' 
                            : 'bg-background text-muted border-border hover:text-foreground'
                        }`}
                      >
                        {formatNaira(amt).replace('.00', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="duration-select" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Duration
                  </label>
                  <select id="duration-select" title="Duration" aria-label="Duration" value={calcDuration}
                    onChange={(e) => setCalcDuration(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value={1}>1 Year (Minimum lock-in)</option>
                    <option value={2}>2 Years</option>
                    <option value={3}>3 Years</option>
                  </select>
                </div>

                <div className="border-t border-border pt-6 space-y-3 font-mono text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Annual Interest Rate:</span>
                    <span className="text-foreground font-bold">25.00%</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Accrual Display Rate:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Progressive Live</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Estimated Monthly Accrual:</span>
                    <span className="text-foreground">{formatNaira(monthlyAccrual)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Estimated Gross Yield:</span>
                    <span className="text-foreground">{formatNaira(grossReturn)}</span>
                  </div>
                  <div className="flex justify-between text-base border-t border-border pt-4 font-bold text-foreground">
                    <span>Total Payout:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{formatNaira(totalPayout)}</span>
                  </div>
                </div>

                <Link 
                  href="/auth/signup" 
                  className="w-full block text-center py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 dark:text-slate-950 font-bold text-sm transition-all"
                >
                  Invest This Principal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Statistics Section */}
      <section id="stats" className="py-20 border-t border-border bg-card/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
              Transparency Report
            </h2>
            <p className="mt-4 text-muted max-w-xl mx-auto">
              Our audit logs and portfolio balances are transparently verified.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="text-3xl font-extrabold text-foreground font-mono">₦2.48B</div>
              <div className="text-xs text-muted mt-2">Total Platform Deposits</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="text-3xl font-extrabold text-foreground font-mono">₦621.5M</div>
              <div className="text-xs text-muted mt-2">Total Payouts Distributed</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="text-3xl font-extrabold text-foreground font-mono">2,854+</div>
              <div className="text-xs text-muted mt-2">Active Investors</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="text-3xl font-extrabold text-emerald-500 dark:text-emerald-400 font-mono">100%</div>
              <div className="text-xs text-muted mt-2">Maturity Obligations Met</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-24 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "What is the duration of the investment plans?",
                a: "All packages operate on a minimum lock-in period of 1 year (365 days) from the purchase date to ensure liquidity optimization."
              },
              {
                q: "How does the live accrual ticker work?",
                a: "Once subscribed, the interest rate is locked at 25% APR. The yield is calculated continuously and displays live on your user dashboard."
              },
              {
                q: "Can I terminate my investment before 1 year?",
                a: "Yes. Early termination can be requested through the dashboard. However, a 10% penalty of the principal capital will be applied, and the payout requires a 30-day processing wait period."
              },
              {
                q: "How are withdrawals processed?",
                a: "Withdrawal requests are reviewed manually by compliance officers and paid within 24 hours. A transaction processing fee of 1.9% is deducted from the payout amount."
              },
              {
                q: "Is there a referral reward system?",
                a: "Yes, you receive a one-time 2.5% reward of the referee's investment package amount when they make their first purchase."
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-card border border-border">
                <h4 className="text-base font-bold text-foreground mb-2 font-heading">{item.q}</h4>
                <p className="text-sm text-muted leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Disclosure Section */}
      <section className="py-12 bg-red-500/10 border-t border-b border-red-500/20 text-red-700 dark:text-red-400">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start space-x-3.5">
            <AlertOctagon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider">Risk Disclosure Statement</h4>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Investments in wealth generation packages involve structured capital operations. Past metrics are not indicators of future yield. All subscriptions are subject to our 1-year locking rules, 1.9% withdrawal processing fee, and 10% penalty on early terminations. Capital yields are processed securely and audited manually to ensure compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading mb-4">
                Talk To Our Wealth Officers
              </h2>
              <p className="text-muted leading-relaxed mb-8">
                Do you have custom questions about institutional accounts or VIP allocations? Reach out directly.
              </p>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-emerald-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted">Phone Support</div>
                    <div className="text-sm font-semibold text-foreground">+234 (0) 800-AZEAD-VIP</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-emerald-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted">Email Address</div>
                    <div className="text-sm font-semibold text-foreground">support@azead.com</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-emerald-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted">Headquarters</div>
                    <div className="text-sm font-semibold text-foreground">Banana Island, Lagos, Nigeria</div>
                  </div>
                </div>
              </div>
            </div>

            <form className="p-8 rounded-2xl bg-card border border-border space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Name</label>
                <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-emerald-500" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Email</label>
                <input type="email" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-emerald-500" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Message</label>
                <textarea rows={4} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-emerald-500" placeholder="Tell us how we can help..."></textarea>
              </div>
              <button className="w-full py-3 rounded-xl bg-foreground text-background font-bold hover:bg-foreground/90 transition-colors text-sm">
                Send Query
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted space-y-4">
          <div className="flex justify-center space-x-6">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Audit Disclosures</a>
          </div>
          <div>
            © {new Date().getFullYear()} AZEAD Invest. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
