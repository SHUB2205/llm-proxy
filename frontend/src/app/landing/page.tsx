'use client'

import { useState } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showWaitlistForm, setShowWaitlistForm] = useState(false)

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setSubmitted(true)
        setEmail('')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Failed to join waitlist. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const scrollToWaitlist = () => {
    setShowWaitlistForm(true)
    setTimeout(() => {
      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 overflow-hidden">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">M</div>
            <span className="text-xl font-bold text-white">ModelSight</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="#integration" className="text-sm text-gray-400 hover:text-white transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Dashboard
            </Link>
            <button
              onClick={scrollToWaitlist}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            The reliability layer for production AI agents
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            <span className="text-white">Make your AI agents</span>
            <br />
            <span className="text-blue-400">reliable enough to trust</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Monitor every step. Prevent hallucinations before they happen. Track costs per agent. Know exactly what your AI is doing in production.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={scrollToWaitlist}
              className="group px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Join Waitlist
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              No credit card required
            </span>
          </div>

        </div>

        {/* Hero visual */}
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-blue-500/10">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="ml-2 text-xs text-gray-500">ModelSight Dashboard</span>
            </div>
            <div className="p-6 grid grid-cols-4 gap-4">
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="text-xs text-gray-400 mb-1">Requests (24h)</div>
                <div className="text-2xl font-bold text-white">24,847</div>
                <div className="text-xs text-emerald-400 mt-1">↑ 12% from yesterday</div>
              </div>
              <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
                <div className="text-xs text-gray-400 mb-1">Hallucinations Caught</div>
                <div className="text-2xl font-bold text-white">127</div>
                <div className="text-xs text-red-400 mt-1">0.5% of requests</div>
              </div>
              <div className="bg-fuchsia-500/10 rounded-xl p-4 border border-fuchsia-500/20">
                <div className="text-xs text-gray-400 mb-1">Cost Today</div>
                <div className="text-2xl font-bold text-white">$47.23</div>
                <div className="text-xs text-emerald-400 mt-1">↓ 8% optimized</div>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                <div className="text-xs text-gray-400 mb-1">Avg Latency</div>
                <div className="text-2xl font-bold text-white">234ms</div>
                <div className="text-xs text-gray-400 mt-1">P95: 890ms</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-white">Your AI agent is a black box.</span>
              <br />
              <span className="text-red-400">That's terrifying.</span>
            </h2>
          </div>

          <div className="relative">
            <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-sm">
              <p className="text-lg text-gray-300 mb-6">
                You built an AI agent. It works great in demos. Then you deploy it.
              </p>
              <p className="text-gray-400 mb-6">Now you're wondering:</p>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400 text-xl">?</span>
                  <span className="text-gray-300">What is it actually saying to customers?</span>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400 text-xl">?</span>
                  <span className="text-gray-300">Is it hallucinating? You won't know until someone complains.</span>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400 text-xl">?</span>
                  <span className="text-gray-300">Why did costs spike 3x last Tuesday?</span>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400 text-xl">?</span>
                  <span className="text-gray-300">Did the last model update break something?</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  You can't scale what you can't see.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">The Solution</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              The reliability layer for AI agents
            </h2>
            <p className="text-gray-400 text-lg">Three pillars that make your AI production-ready</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group relative">
              <div className="relative h-full bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Prevent</h3>
                <p className="text-gray-400 leading-relaxed">
                  Optimize prompts before they run. Fix 90% of issues before they happen.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="relative h-full bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-xl bg-cyan-600 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Detect</h3>
                <p className="text-gray-400 leading-relaxed">
                  5-layer hallucination detection catches what slips through. Real-time.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="relative h-full bg-white/[0.03] border border-white/10 rounded-2xl p-8 hover:border-fuchsia-500/50 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-xl bg-fuchsia-600 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Control</h3>
                <p className="text-gray-400 leading-relaxed">
                  Track every agent step. See costs per workflow. Know when behavior drifts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-cyan-400 mb-4 uppercase tracking-wider">Features</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Everything you need to ship with confidence
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Comprehensive tooling for production AI agents</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Prompt Optimization */}
            <div className="group relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Prompt Optimization Engine</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    Analyze and improve prompts before they hit the LLM. Add guardrails automatically. Predict reliability scores.
                  </p>
                  <p className="text-sm text-blue-400 font-medium">"90% of hallucinations are preventable with better prompts."</p>
                </div>
              </div>
            </div>

            {/* Hallucination Detection */}
            <div className="group relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">5-Layer Hallucination Detection</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">The most advanced detection system available</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">Semantic entropy</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">Claim verification</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">LLM-as-judge</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">Self-consistency</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400">Fast 200ms</span>
                    <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400">Balanced 2-3s</span>
                    <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">Thorough 5-7s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Tracking */}
            <div className="group relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Agent & Workflow Tracking</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">See your entire agent chain. Track every step.</p>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-400 rounded-full"></span>Cost per agent, workflow, user</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-400 rounded-full"></span>Latency breakdown by step</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-400 rounded-full"></span>Full request/response logging</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Drift Detection */}
            <div className="group relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Drift Detection</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">Know when your AI starts behaving differently</p>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-amber-400 rounded-full"></span>Response length & cost spikes</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-amber-400 rounded-full"></span>Latency degradation alerts</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-amber-400 rounded-full"></span>Quality drift monitoring</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* AI FinOps */}
            <div className="group relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">AI FinOps</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">Complete cost visibility and optimization</p>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-emerald-400 rounded-full"></span>Real-time spend tracking</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-emerald-400 rounded-full"></span>Budget alerts & model breakdown</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 bg-emerald-400 rounded-full"></span>Optimization recommendations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Enterprise */}
            <div className="group relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Enterprise Ready</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">Built for scale and compliance</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">Multi-tenant</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">SSO/SAML</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">Audit logs</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">RBAC</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">99.9% SLA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section id="integration" className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-emerald-400 mb-4 uppercase tracking-wider">Integration</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              2 lines of code. 5 minutes to production.
            </h2>
            <p className="text-gray-400 text-lg">Drop-in replacement for your existing OpenAI client</p>
          </div>

          <div className="relative">
            <div className="relative bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-xs text-gray-500 font-mono">main.py</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm font-mono leading-relaxed">
                <code>
                  <span className="text-fuchsia-400">from</span> openai <span className="text-fuchsia-400">import</span> OpenAI
                  <br /><br />
                  client = OpenAI(
                  <br />
                  {'    '}base_url=<span className="text-emerald-300">"https://llm-proxy-production.up.railway.app/v1"</span>,  <span className="text-emerald-500"># ← Change this</span>
                  <br />
                  {'    '}api_key=<span className="text-emerald-300">"llm_obs_xxxxx"</span>                    <span className="text-emerald-500"># ← And this</span>
                  <br />
                  )
                  <br /><br />
                  <span className="text-gray-500"># That's it. Your agent is now monitored.</span>
                  <br />
                  response = client.chat.completions.create(
                  <br />
                  {'    '}model=<span className="text-emerald-300">"gpt-4o"</span>,
                  <br />
                  {'    '}messages=[{'{'}<span className="text-blue-300">"role"</span>: <span className="text-emerald-300">"user"</span>, <span className="text-blue-300">"content"</span>: <span className="text-emerald-300">"..."</span>{'}'}]
                  <br />
                  )
                </code>
              </pre>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 mb-3 uppercase tracking-wider">Supported Providers</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-300">OpenAI ✓</span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-500">Anthropic — coming soon</span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-500">Gemini — coming soon</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 mb-3 uppercase tracking-wider">Works With</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">LangChain</span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">LlamaIndex</span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">CrewAI</span>
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">AutoGen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-fuchsia-400 mb-4 uppercase tracking-wider">Use Cases</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Built for teams shipping AI agents
            </h2>
            <p className="text-gray-400 text-lg">Real solutions for real production challenges</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="group bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-blue-500/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Customer Support</h3>
              <p className="text-gray-400 text-sm">Monitor every conversation. Catch hallucinations before customers see them.</p>
            </div>

            <div className="group bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI SDRs & Sales</h3>
              <p className="text-gray-400 text-sm">Ensure accurate product info. Detect off-script behavior. Measure cost per lead.</p>
            </div>

            <div className="group bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-fuchsia-500/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Copilots in SaaS</h3>
              <p className="text-gray-400 text-sm">Prevent mistakes. Track per-customer usage. Optimize for reliability.</p>
            </div>

            <div className="group bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-amber-500/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Internal AI Tools</h3>
              <p className="text-gray-400 text-sm">Audit AI responses. Compliance logging. Cost attribution by team.</p>
            </div>

            <div className="group bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all md:col-span-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">RAG Applications</h3>
              <p className="text-gray-400 text-sm">Detect when retrieved context is ignored. Catch fabricated citations. Monitor retrieval quality.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-amber-400 mb-4 uppercase tracking-wider">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Simple, predictable pricing
            </h2>
            <p className="text-gray-400 text-lg">Start free, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
              <h3 className="text-lg font-semibold text-white mb-2">Free</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">Perfect for getting started</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  10K requests/mo
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  All detection features
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  7-day retention
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Community support
                </li>
              </ul>
              <button
                onClick={scrollToWaitlist}
                className="w-full px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium"
              >
                Join Waitlist →
              </button>
            </div>

            {/* Pro */}
            <div className="relative">
              <div className="absolute -inset-[1px] bg-blue-500 rounded-2xl" />
              <div className="relative bg-slate-950 rounded-2xl p-8 h-full">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-white">$99</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <p className="text-gray-500 text-sm mb-6">For growing teams</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    100K requests/mo
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    All detection features
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    90-day retention
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Email support
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Prompt optimization
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Drift detection
                  </li>
                </ul>
                <button
                  onClick={scrollToWaitlist}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
                >
                  Join Waitlist →
                </button>
              </div>
            </div>

            {/* Enterprise */}
            <div className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
              <h3 className="text-lg font-semibold text-white mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">For large-scale deployments</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Unlimited requests
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  All features
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Custom retention
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Dedicated support + SLA
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  SSO/SAML
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  On-prem option
                </li>
              </ul>
              <button className="w-full px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all font-medium">
                Talk to Us →
              </button>
            </div>
          </div>

          <p className="text-center text-gray-500 mt-10 text-sm">
            All plans include: hallucination detection, FinOps, workflow tracking, multi-provider support
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-white">Stop wondering.</span>
            <br />
            <span className="text-blue-400">Start knowing.</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
            Your AI agents are talking to customers right now. Do you know what they're saying?
          </p>
          <button
            onClick={scrollToWaitlist}
            className="group px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
          >
            Join Waitlist
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
          <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              5 minute setup
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Works with existing code
            </span>
          </p>
        </div>
      </section>

      {/* Waitlist Section */}
      {showWaitlistForm && (
        <section id="waitlist" className="relative py-20 px-6 bg-gradient-to-b from-transparent to-slate-900/50">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/30 rounded-3xl p-12 text-center shadow-2xl shadow-blue-500/10">
              {!submitted ? (
                <>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                    Join the waitlist
                  </h2>
                  <p className="text-xl text-gray-400 mb-8">
                    Get early access to ModelSight. Limited beta spots available.
                  </p>

                  <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="flex-1 px-6 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all text-white shadow-lg shadow-blue-500/25"
                      >
                        {loading ? 'Joining...' : 'Join Waitlist'}
                      </button>
                    </div>
                    {error && (
                      <p className="mt-3 text-sm text-red-400">{error}</p>
                    )}
                  </form>

                  <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Early access pricing</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold mb-3 text-white">You're on the list! 🎉</h3>
                  <p className="text-gray-400 mb-6">
                    We'll send you an invite soon. Check your email for updates.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    Add another email
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">M</div>
              <span className="text-lg font-bold text-white">ModelSight</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm text-gray-600">© 2025 ModelSight</div>
          </div>
        </div>
      </footer>
    </div>
  )
}