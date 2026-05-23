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
    <div className="flex flex-col min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <TrendingUp className="w-6 h-6 text-[#030712]" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white font-heading">
                AZEAD
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-400">
              <a href="#packages" className="hover:text-white transition-colors">Packages</a>
              <a href="#calculator" className="hover:text-white transition-colors">Calculator</a>
              <a href="#stats" className="hover:text-white transition-colors">Transparency</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth/signin" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/10 text-sm">
                Get Started
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400 hover:text-white">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-900 bg-[#030712]/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-3">
            <a href="#packages" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-white">Packages</a>
            <a href="#calculator" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-white">Calculator</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-white">Transparency</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-white">FAQ</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-white">Contact</a>
            <div className="pt-4 flex flex-col space-y-2">
              <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 text-sm font-semibold text-slate-300 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors">
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950 -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>25.00% Guaranteed Annualized Interest</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none max-w-4xl mx-auto mb-6 font-heading">
            Premium Wealth Accumulation For Structured Portfolios
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            Secure, regulated, and professional capital investments in NGN. Monitor your interest grow in real-time with our progressive dashboard accrual.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            <Link href="/auth/signup" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2">
              Create Investment Account <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#calculator" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center">
              Calculate Returns
            </a>
          </div>

          {/* Visual Accrual Widget */}
          <div className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm shadow-2xl relative">
            <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono tracking-wider uppercase">
              Live Accrual Simulation
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400 font-medium">Accumulating Portfolio Yield</span>
              <span className="text-[10px] text-slate-500 font-mono">1.0 Year Lock-In</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white mb-2 accrual-glow">
              {formatNaira(tickerInterest)}
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 mb-1 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[45%] rounded-full animate-pulse" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Principal: ₦500,000.00</span>
              <span className="text-emerald-400 font-medium">Yield Rate: 25.00% APR</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white font-heading">
              Built For Serious Investors
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              We leverage structural capital allocation algorithms and secure manual liquidity auditing to yield a premium 25% ARR.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 hover:border-emerald-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-heading">Secure Vault Infrastructure</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your investment capital is securely logged in double-entry atomic database systems. Rigorous compliance filters govern withdrawal allocations.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 hover:border-emerald-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-heading">Progressive Dashboard Accrual</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Watch your capital appreciate live. Interest is accumulated to your user dashboard in real-time, matching your premium growth vector.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 hover:border-emerald-500/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-heading">Lock-In Integrity</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Structured portfolios operate on a 1-year lock-in with clear rules. Early termination is protected via standard processing models.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-24 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white font-heading">
              Select Your Investment Level
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Our products are grouped into six distinct capital classes to match your balance tier.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PACKAGES.map((pkg, idx) => (
              <div 
                key={idx} 
                className={`rounded-2xl bg-gradient-to-b ${pkg.color} border ${pkg.border} p-8 flex flex-col justify-between relative shadow-xl overflow-hidden group`}
              >
                {pkg.tag && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {pkg.tag}
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-bold text-slate-300 font-heading">{pkg.name} Package</h3>
                  <div className="mt-4 flex items-baseline text-white">
                    <span className="text-3xl font-extrabold font-mono tracking-tight">
                      {formatNaira(pkg.amount).replace('.00', '')}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Fixed purchase amount (NGN)</p>

                  <ul className="mt-6 space-y-3.5 border-t border-slate-800/80 pt-6">
                    <li className="flex items-center space-x-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>25.00% Annualized yield</span>
                    </li>
                    <li className="flex items-center space-x-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>1-Year Lock-in Duration</span>
                    </li>
                    <li className="flex items-center space-x-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Maturity Reinvest/Payout options</span>
                    </li>
                    <li className="flex items-center space-x-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Estimated Return: {formatNaira(pkg.amount * 0.25)}</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <Link 
                    href={`/auth/signup?package=${pkg.name.toLowerCase()}`}
                    className="w-full block text-center py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-white hover:bg-slate-800 transition-all group-hover:border-emerald-500/30"
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
      <section id="calculator" className="py-20 border-t border-slate-900 bg-slate-950/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-6">
                <Calculator className="w-4 h-4" />
                <span>Yield Simulator</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white font-heading mb-4">
                Calculate Your Wealth Growth
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Select your parameters to simulate your portfolio returns. Learn how reinvesting interest increases your yield over time.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 text-sm text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Returns locked and calculated in secure smart ledger systems.</span>
                </div>
                <div className="flex items-start space-x-3 text-sm text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Early termination available under strict penalty protocols.</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Investment Capital (NGN)
                  </label>
                  <input 
                    type="number" 
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
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
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {formatNaira(amt).replace('.00', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="duration-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Duration
                  </label>
                  <select id="duration-select" title="Duration" aria-label="Duration" value={calcDuration}
                    onChange={(e) => setCalcDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value={1}>1 Year (Minimum lock-in)</option>
                    <option value={2}>2 Years</option>
                    <option value={3}>3 Years</option>
                  </select>
                </div>

                <div className="border-t border-slate-800 pt-6 space-y-3 font-mono text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Annual Interest Rate:</span>
                    <span className="text-white font-bold">25.00%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Accrual Display Rate:</span>
                    <span className="text-emerald-400 font-bold">Progressive Live</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Monthly Accrual:</span>
                    <span className="text-slate-200">{formatNaira(monthlyAccrual)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Gross Yield:</span>
                    <span className="text-slate-200">{formatNaira(grossReturn)}</span>
                  </div>
                  <div className="flex justify-between text-base border-t border-slate-800 pt-4 font-bold text-white">
                    <span>Total Payout:</span>
                    <span className="text-emerald-400">{formatNaira(totalPayout)}</span>
                  </div>
                </div>

                <Link 
                  href="/auth/signup" 
                  className="w-full block text-center py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all"
                >
                  Invest This Principal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Statistics Section */}
      <section id="stats" className="py-20 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white font-heading">
              Transparency Report
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Our audit logs and portfolio balances are transparently verified.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center">
              <div className="text-3xl font-extrabold text-white font-mono">₦2.48B</div>
              <div className="text-xs text-slate-400 mt-2">Total Platform Deposits</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center">
              <div className="text-3xl font-extrabold text-white font-mono">₦621.5M</div>
              <div className="text-xs text-slate-400 mt-2">Total Payouts Distributed</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center">
              <div className="text-3xl font-extrabold text-white font-mono">2,854+</div>
              <div className="text-xs text-slate-400 mt-2">Active Investors</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center">
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-2">Maturity Obligations Met</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-24 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white font-heading">
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
              <div key={idx} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <h4 className="text-base font-bold text-white mb-2 font-heading">{item.q}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Disclosure Section */}
      <section className="py-12 bg-red-950/10 border-t border-b border-red-950/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start space-x-3.5">
            <AlertOctagon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider">Risk Disclosure Statement</h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
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
              <h2 className="text-3xl font-bold tracking-tight text-white font-heading mb-4">
                Talk To Our Wealth Officers
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Do you have custom questions about institutional accounts or VIP allocations? Reach out directly.
              </p>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Phone Support</div>
                    <div className="text-sm font-semibold text-white">+234 (0) 800-AZEAD-VIP</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Email Address</div>
                    <div className="text-sm font-semibold text-white">support@azead.com</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Headquarters</div>
                    <div className="text-sm font-semibold text-white">Banana Island, Lagos, Nigeria</div>
                  </div>
                </div>
              </div>
            </div>

            <form className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                <input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                <textarea rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500" placeholder="Tell us how we can help..."></textarea>
              </div>
              <button className="w-full py-3 rounded-xl bg-slate-100 text-slate-950 font-bold hover:bg-white transition-colors text-sm">
                Send Query
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-4">
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
