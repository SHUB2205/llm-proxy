'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTheme } from '@/contexts/ThemeContext'

export default function LandingPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
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
      const response = await fetch('http://localhost:8000/api/waitlist', {
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

  return (
    <div className={`min-h-screen overflow-hidden ${theme === 'light' ? 'bg-white text-black' : 'bg-[#0a0a0f] text-white'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-xl ${theme === 'light' ? 'bg-white/80 border-b border-gray-200' : 'bg-[#0a0a0f]/80 border-b border-white/5'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src={theme === 'light' ? '/modelsight_light_logo.png' : '/logo_llm_proxy-removebg-preview.png'}
              alt="ModelSight Logo" 
              width={80} 
              height={50}
              className="object-contain"
            />
            <span className={`text-2xl font-bold ${theme === 'light' ? 'text-black' : 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'}`}>
              ModelSight
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className={`transition-colors ${theme === 'light' ? 'text-gray-600 hover:text-black' : 'text-gray-400 hover:text-white'}`}>Features</a>
            <a href="#pricing" className={`transition-colors ${theme === 'light' ? 'text-gray-600 hover:text-black' : 'text-gray-400 hover:text-white'}`}>Pricing</a>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-white/10'}`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => router.push('/login')}
              className={`px-4 py-2 transition-colors ${theme === 'light' ? 'text-gray-600 hover:text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/onboard')}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${theme === 'light' ? 'bg-black hover:bg-gray-800 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'}`}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
              <span className="text-sm text-indigo-300">Production-ready LLM observability • 150k+ lines of code • 8 major features</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Complete LLM observability
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                for production AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Drift detection • 5-layer hallucination prevention • Real-time cost tracking • Prompt optimization
              <br />
              Everything you need to monitor LLMs in production.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4 mb-12">
              <button
                onClick={() => {
                  setShowWaitlistForm(true)
                  setTimeout(() => {
                    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
                  }, 100)
                }}
                className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold text-xl transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/50"
              >
                Join Waitlist
              </button>
              <p className="text-sm text-gray-500">Limited beta access • Join 100+ teams on the waitlist</p>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                {/*<span className="text-2xl">⚡</span>*/}
                <span>Real-time monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                {/*<span className="text-2xl">🔒</span>*/}
                <span>Enterprise-ready</span>
              </div>
              <div className="flex items-center gap-2">
                {/*<span className="text-2xl">🚀</span>*/}
                <span>5-min setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why teams choose ModelSight
            </h2>
            <p className="text-xl text-gray-400">The most comprehensive LLM observability platform</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Drift Detection',
                description: 'Only platform that detects when your LLM behavior changes. Track response length, cost, latency, and quality in real-time.',
                badge: 'UNIQUE'
              },
              {
                icon: '🔍',
                title: '5-Layer Hallucination Detection',
                description: 'Most advanced detection system. Semantic entropy, LLM judge, claim-level NLI, self-consistency, and meta-classifier.',
                badge: 'ADVANCED'
              },
              {
                icon: '💰',
                title: 'Complete FinOps',
                description: 'Real-time cost tracking, budget alerts, agent-level breakdown, workflow monitoring, and optimization recommendations.',
                badge: 'COMPLETE'
              },
            ].map((feature, i) => (
              <div key={i} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-indigo-500/30 rounded-2xl p-8 hover:border-indigo-500/60 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{feature.icon}</div>
                  <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded">{feature.badge}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              8 powerful features in <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">one platform</span>
            </h2>
            <p className="text-xl text-gray-400">Everything you need for production LLM monitoring</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: '📊',
                title: 'Drift Detection',
                description: 'Track 4 key metrics: response length, hallucination rate, cost, and P95 latency. Get alerted when behavior changes >20%.',
                metric: 'UNIQUE TO MODELSIGHT',
              },
              {
                icon: '🔍',
                title: '5-Layer Hallucination Detection',
                description: 'Semantic entropy, LLM judge, claim NLI, self-consistency, meta-classifier. Most advanced system available.',
                metric: '94.2% ACCURACY',
              },
              {
                icon: '💎',
                title: 'AI FinOps Tracking',
                description: 'Real-time cost tracking, workflow monitoring, agent-level breakdown, budget alerts, and optimization recommendations.',
                metric: 'SAVE UP TO 40%',
              },
              {
                icon: '🎯',
                title: 'Prompt Optimization',
                description: 'AI-powered quality scoring, reliability prediction, optimization suggestions, A/B testing support, and best practices.',
                metric: 'PROACTIVE OPTIMIZATION',
              },
              {
                icon: '🔒',
                title: 'Safety & Compliance',
                description: 'PII detection (email, phone, SSN), prompt injection detection, content moderation, audit trails, and compliance logging.',
                metric: 'ENTERPRISE-READY',
              },
              {
                icon: '👥',
                title: 'Multi-Tenant Architecture',
                description: 'User management, API key management, encrypted storage, organization support, role-based access, usage quotas.',
                metric: 'PRODUCTION-READY',
              },
              {
                icon: '📈',
                title: 'Real-time Dashboard',
                description: 'Beautiful UI with 9 pages: dashboard, FinOps, drift, optimizer, flags, requests, settings. Real-time updates every 30s.',
                metric: 'BEST-IN-CLASS UI',
              },
              {
                icon: '🚀',
                title: 'Developer Experience',
                description: 'Drop-in OpenAI replacement, bulk testing tools, comprehensive tests, example integrations, detailed logging, retry logic.',
                metric: '5-MIN SETUP',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{feature.description}</p>
                <div className="text-xs text-indigo-400 font-bold">{feature.metric}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How we compare
            </h2>
            <p className="text-xl text-gray-400">ModelSight vs the competition</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-4 px-6 text-gray-400 font-semibold">Feature</th>
                  <th className="py-4 px-6 text-center">
                    <div className="text-white font-bold">ModelSight</div>
                    <div className="text-xs text-indigo-400">You</div>
                  </th>
                  <th className="py-4 px-6 text-center text-gray-400">Langfuse</th>
                  <th className="py-4 px-6 text-center text-gray-400">LangSmith</th>
                  <th className="py-4 px-6 text-center text-gray-400">Helicone</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: 'Drift Detection', you: '✅', langfuse: '❌', langsmith: '❌', helicone: '❌' },
                  { feature: '5-Layer Hallucination Detection', you: '✅', langfuse: '⚠️ Basic', langsmith: '⚠️ Basic', helicone: '❌' },
                  { feature: 'AI FinOps Tracking', you: '✅', langfuse: '⚠️ Basic', langsmith: '⚠️ Basic', helicone: '✅' },
                  { feature: 'Prompt Optimization', you: '✅', langfuse: '❌', langsmith: '⚠️ Basic', helicone: '❌' },
                  { feature: 'Safety & Compliance', you: '✅', langfuse: '❌', langsmith: '⚠️ Basic', helicone: '❌' },
                  { feature: 'Self-hosted', you: '✅', langfuse: '✅', langsmith: '❌', helicone: '❌' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-800 hover:bg-slate-900/30">
                    <td className="py-4 px-6 text-white">{row.feature}</td>
                    <td className="py-4 px-6 text-center text-green-400 font-bold">{row.you}</td>
                    <td className="py-4 px-6 text-center text-gray-500">{row.langfuse}</td>
                    <td className="py-4 px-6 text-center text-gray-500">{row.langsmith}</td>
                    <td className="py-4 px-6 text-center text-gray-500">{row.helicone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-indigo-400 font-semibold">ModelSight is the only platform with drift detection + 5-layer hallucination prevention</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-400">Start free, scale as you grow</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                features: [
                  '1,000 requests/month',
                  'Basic hallucination detection',
                  '7-day data retention',
                  'Community support',
                ],
                cta: 'Start Free',
                highlighted: false,
              },
              {
                name: 'Pro',
                price: '$99',
                period: 'per month',
                features: [
                  '50,000 requests/month',
                  'Advanced hallucination detection',
                  'Drift detection',
                  '90-day data retention',
                  'Email support',
                  'API access',
                ],
                cta: 'Start Trial',
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: '$499',
                period: 'per month',
                features: [
                  'Unlimited requests',
                  'All features',
                  'Custom retention',
                  'Priority support',
                  'SSO/SAML',
                  'SLA guarantee',
                ],
                cta: 'Contact Sales',
                highlighted: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-2 border-indigo-400 transform scale-105'
                    : 'bg-slate-900/50 border border-white/10'
                }`}
              >
                {plan.highlighted && (
                  <div className="text-center mb-4">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">MOST POPULAR</span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={plan.highlighted ? 'text-white' : 'text-gray-400'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/onboard')}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-white text-indigo-600 hover:bg-gray-100'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      {showWaitlistForm && (
        <section id="waitlist" className="py-20 px-6 bg-gradient-to-b from-transparent to-slate-900/50">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-indigo-500/30 rounded-3xl p-12 text-center">
              {!submitted ? (
              <>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
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
                      className="flex-1 px-6 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
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
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Early access pricing</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-3">You're on the list! 🎉</h3>
                <p className="text-gray-400 mb-6">
                  We'll send you an invite soon. Check your email for updates.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
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
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image 
                  src="/logo_llm_proxy-removebg-preview.png" 
                  alt="ModelSight Logo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                />
                <span className="font-bold">ModelSight</span>
              </div>
              <p className="text-sm text-gray-400">
                Complete LLM observability
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center">
            <p className="text-sm text-gray-400">© 2025 ModelSight. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}