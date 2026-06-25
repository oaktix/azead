'use client';

import React, { useState, useEffect } from 'react';
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
  AlertOctagon,
  Landmark,
  Building2
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(100000);
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
    const baseInterest = 250860.90;
    let current = baseInterest;
    const interval = setInterval(() => {
      current += Math.random() * 0.25;
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
              <a href="#packages" className="hover:text-foreground transition-colors">Wealth Plan</a>
              <a href="#deployment" className="hover:text-foreground transition-colors">Our Sectors</a>
              <a href="#calculator" className="hover:text-foreground transition-colors">Calculator</a>
              <a href="#stats" className="hover:text-foreground transition-colors">Transparency</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <a href="/auth/signin" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
                Sign In
              </a>
              <a href="/auth/signup" className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 dark:text-slate-950 font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/10 text-sm">
                Get Started
              </a>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-muted hover:text-foreground" aria-label="Toggle Menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-3">
            <a href="#packages" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">Wealth Plan</a>
            <a href="#deployment" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">Our Sectors</a>
            <a href="#calculator" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">Calculator</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">Transparency</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">FAQ</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-muted hover:text-foreground">Contact</a>
            <div className="pt-4 flex flex-col space-y-2">
              <a href="/auth/signin" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 text-sm font-semibold text-muted border border-border rounded-lg hover:bg-card transition-colors">
                Sign In
              </a>
              <a href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 text-sm font-bold bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-600 transition-colors">
                Get Started
              </a>
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
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-8 font-mono">
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
            <a href="/auth/signup" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 dark:text-slate-950 font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2">
              Create Investment Account <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#calculator" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-card border border-border text-foreground hover:bg-muted/10 transition-colors flex items-center justify-center">
              Calculate Returns
            </a>
          </div>

          {/* Visual Accrual Widget */}
          <div className="max-w-xl mx-auto p-6 rounded-2xl glass shadow-2xl relative border border-border bg-card/50">
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
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[45%] rounded-full" />
            </div>
            <div className="flex justify-between text-[10px] text-muted font-mono">
              <span>Principal: ₦100,000.00</span>
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
            <p className="mt-4 text-muted max-w-xl mx-auto text-sm">
              We leverage structural capital allocation algorithms and secure manual liquidity auditing to yield a premium 25% ARR.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-card border border-border hover:border-emerald-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 font-heading">Secure Vault Infrastructure</h3>
              <p className="text-sm text-muted leading-relaxed font-sans">
                Your investment capital is securely logged in double-entry atomic database systems. Rigorous compliance filters govern withdrawal allocations.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border hover:border-emerald-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 font-heading">Progressive Dashboard Accrual</h3>
              <p className="text-sm text-muted leading-relaxed font-sans">
                Watch your capital appreciate live. Interest is accumulated to your user dashboard in real-time, matching your premium growth vector.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border hover:border-emerald-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 font-heading">Lock-In Integrity</h3>
              <p className="text-sm text-muted leading-relaxed font-sans">
                Structured portfolios operate on customized lock-in years with clear rules. Early termination is protected via standard processing models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Use The Money For */}
      <section id="deployment" className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Capital Deployment Strategy</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
              What We Use The Money For
            </h2>
            <p className="mt-4 text-muted max-w-2xl mx-auto text-sm leading-relaxed">
              Every naira invested on AZEAD is deployed into high-yield, real-economy sectors that generate the returns we pass directly to our investors. Here is exactly how your capital is put to work.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">

            {/* Microfinance Lending */}
            <div className="relative rounded-2xl bg-card border border-emerald-500/15 p-8 overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-105 transition-transform">
                <Landmark className="w-7 h-7" />
              </div>
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="text-xl font-bold text-foreground font-heading">Microfinance Lending</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 font-mono">SECTOR 01</span>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-6">
                We extend structured short-term credit facilities to small-scale traders and micro-enterprises across Nigeria. These businesses — market traders, artisans, retailers, and service providers — operate with high cash velocity and strong repayment capacity, generating consistent, predictable returns.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted">Short-cycle lending with daily/weekly repayment structures</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted">Collateral-backed and guarantor-secured loan portfolios</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted">Credit risk is mitigated through diversified borrower pools</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted">Directly empowers grassroots economic growth in local communities</span>
                </li>
              </ul>
            </div>

            {/* Real Estate Development Financing */}
            <div className="relative rounded-2xl bg-card border border-teal-500/15 p-8 overflow-hidden group hover:border-teal-500/30 transition-all">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-105 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="text-xl font-bold text-foreground font-heading">Real Estate Development</h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[10px] font-bold text-teal-400 font-mono">SECTOR 02</span>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-6">
                We finance strategic real estate development projects, providing bridge loans and construction financing to vetted developers across key Nigerian markets. Nigeria&apos;s chronic housing deficit and rapid urbanisation create sustained demand, allowing us to deploy capital at above-market rates with defined exit timelines.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted">Bridge and construction finance on residential and mixed-use projects</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted">Land-backed security on all development financing facilities</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted">Staged drawdown structure aligned with construction milestones</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted">Focus on high-growth corridors in Lagos, Abuja, and Port Harcourt</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Capital allocation visual bar */}
          <div className="mt-12 p-8 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-foreground font-heading">Capital Deployment Allocation</span>
              <span className="text-xs text-muted font-mono">Total Active Portfolio</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: '55%' }} />
              <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400" style={{ width: '45%' }} />
            </div>
            <div className="flex justify-between mt-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-xs text-muted">Microfinance Lending — 55%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" />
                <span className="text-xs text-muted">Real Estate Finance — 45%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Plan & Referral Promo Section */}
      <section id="packages" className="py-24 border-t border-border bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
              Azead Wealth Offerings
            </h2>
            <p className="mt-4 text-muted max-w-xl mx-auto text-sm">
              We have unified our offerings into a single premium customizable plan that locks in 25.00% annual interest on your own terms, combined with a lucrative promotional affiliate system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            
            {/* Wealth Plan Card */}
            <div className="rounded-2xl bg-card border border-emerald-500/20 p-8 flex flex-col justify-between relative shadow-xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
                  Guaranteed Rate
                </span>
                <h3 className="text-2xl font-bold text-foreground font-heading mt-4">Azead Wealth Plan</h3>
                <p className="text-xs text-muted mt-2">
                  Customize your principal starting from ₦100,000 and select your lock-in period up to 5 years.
                </p>

                <ul className="mt-8 space-y-4 border-t border-border pt-6 text-sm">
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>Minimum principal: ₦100,000 NGN</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>Duration options: 1, 2, 3, or 5 Years</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>25.00% APR Fixed annual interest</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>Compounding automatic rollover support</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <a 
                  href="/auth/signup"
                  className="w-full block text-center py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  Start Wealth Building
                </a>
              </div>
            </div>

            {/* Referral Promo Card */}
            <div className="rounded-2xl bg-card border border-amber-500/20 p-8 flex flex-col justify-between relative shadow-xl overflow-hidden group bg-gradient-to-br from-card via-card to-amber-500/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">
                  🔥 Promotional Bonus
                </span>
                <h3 className="text-2xl font-bold text-foreground font-heading mt-4">₦1,000,000 Extra Referral Reward</h3>
                <p className="text-xs text-muted mt-2">
                  Unlock extra payouts. Introduce double large-tier allocations to our platform and secure massive one-time incentives.
                </p>

                <ul className="mt-8 space-y-4 border-t border-border pt-6 text-sm">
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <span>Earn standard 2.5% on referee&apos;s first purchase</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <span>Refer <strong className="text-white">2 people</strong> who invest <strong className="text-white">₦20,000,000+</strong> each</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <span>Get <strong className="text-amber-400 font-mono">₦1,000,000 Extra cash</strong> paid directly to your wallet</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <a 
                  href="/auth/signup"
                  className="w-full block text-center py-4 rounded-xl bg-background border border-amber-500/35 hover:bg-muted/10 text-sm font-semibold text-foreground transition-all"
                >
                  Join Affiliate Program
                </a>
              </div>
            </div>

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
              <p className="text-sm text-muted leading-relaxed mb-6">
                Select your parameters to simulate your portfolio returns. Learn how reinvesting interest increases your yield over time.
              </p>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-3 text-muted">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Returns locked and calculated in secure smart ledger systems.</span>
                </div>
                <div className="flex items-start space-x-3 text-muted">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Early termination available under strict compliance penalty protocols.</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border shadow-xl">
              <div className="space-y-6">
                <div>
                  <label htmlFor="landing-amount-input" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Investment Capital (NGN)
                  </label>
                  <input 
                    id="landing-amount-input"
                    type="number" 
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Enter amount (e.g. 100000)"
                    min="100000"
                  />
                  {calcAmount < 100000 && (
                    <p className="text-[10px] text-red-500 mt-1">Minimum investment amount is ₦100,000</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[100000, 5000000, 10000000, 20000000, 50000000].map((amt) => (
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
                  <label htmlFor="landing-duration-select" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Duration Period
                  </label>
                  <select 
                    id="landing-duration-select"
                    value={calcDuration}
                    onChange={(e) => setCalcDuration(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value={1}>1 Year (365 Days)</option>
                    <option value={2}>2 Years (730 Days)</option>
                    <option value={3}>3 Years (1095 Days)</option>
                    <option value={5}>5 Years (1825 Days)</option>
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

                <a 
                  href="/auth/signup" 
                  className="w-full block text-center py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 dark:text-slate-950 font-bold text-sm transition-all"
                >
                  Invest This Principal
                </a>
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
              Platform Metrics
            </h2>
            <p className="mt-4 text-muted max-w-xl mx-auto text-sm">
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
                q: "What is the Azead Wealth Plan?",
                a: "The Azead Wealth Plan is our unified investment product. It enables you to customize your investment amount starting from ₦100,000 NGN and lock it in for 1, 2, 3, or 5 years at a fixed interest rate of 25.00% APR."
              },
              {
                q: "How does the live accrual ticker work?",
                a: "Once subscribed, the interest rate is locked. The yield is calculated continuously and displays live on your user dashboard."
              },
              {
                q: "Can I terminate my investment before maturity?",
                a: "Yes. Early termination can be requested through the dashboard. However, a 10% penalty of the principal capital will be applied, and the payout requires a 30-day processing wait period."
              },
              {
                q: "How are withdrawals processed?",
                a: "Withdrawal requests are reviewed manually by compliance officers and paid within 24 hours. A transaction processing fee of 1.9% is deducted from the payout amount."
              },
              {
                q: "Is there a referral reward system?",
                a: "Yes, you receive a standard one-time 2.5% reward of the referee's investment amount when they make their first purchase. In addition, we have an extra promotional referral bonus."
              },
              {
                q: "How does the extra ₦1,000,000 referral promo bonus work?",
                a: "If you refer at least 2 users who each invest ₦20,000,000 or more, you will receive a one-time extra promotional bonus of ₦1,000,000 paid directly to your wallet, on top of your standard 2.5% referral commissions!"
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-card border border-border">
                <h4 className="text-base font-bold text-foreground mb-2 font-heading">{item.q}</h4>
                <p className="text-sm text-muted leading-relaxed font-sans">{item.a}</p>
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
              <h4 className="text-sm font-bold uppercase tracking-wider font-mono">Risk Disclosure Statement</h4>
              <p className="mt-1 text-xs text-muted leading-relaxed font-sans">
                Investments in wealth generation packages involve structured capital operations. Past metrics are not indicators of future yield. All subscriptions are subject to our locking rules, 1.9% withdrawal processing fee, and 10% penalty on early terminations. Capital yields are processed securely and audited manually to ensure compliance.
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
              <p className="text-sm text-muted leading-relaxed mb-8 font-sans">
                Do you have custom questions about institutional accounts or VIP allocations? Reach out directly.
              </p>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-emerald-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted">Phone Support</div>
                    <div className="text-sm font-semibold text-foreground font-mono">+234 (0) 800-AZEAD-VIP</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-emerald-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted">Email Address</div>
                    <div className="text-sm font-semibold text-foreground font-mono">support@azead.com</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-emerald-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted">Headquarters</div>
                    <div className="text-sm font-semibold text-foreground font-sans">Banana Island, Lagos, Nigeria</div>
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
