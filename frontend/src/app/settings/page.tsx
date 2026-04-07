'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const { isAuthenticated, userEmail, proxyKey, logout } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className={`text-4xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Settings</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Manage your account and API keys</p>
        </div>

        {/* Account Info */}
        <div className={`rounded-2xl p-6 mb-6 transition-all ${
          theme === 'light' 
            ? 'bg-white border border-gray-200 shadow-sm' 
            : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
        }`}>
          <h2 className={`text-xl font-bold tracking-tight mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Email</label>
              <div className={`text-lg font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{userEmail}</div>
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className={`rounded-2xl p-6 mb-6 transition-all ${
          theme === 'light' 
            ? 'bg-white border border-gray-200 shadow-sm' 
            : 'bg-blue-900/10 backdrop-blur-xl border border-blue-500/20 shadow-lg shadow-blue-500/5'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/20 text-blue-400'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Your Proxy API Key</h2>
          </div>
          <p className={`mb-6 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            Use this key to authenticate your requests to the ModelSight Platform
          </p>
          
          <div className={`rounded-xl p-4 mb-4 ${theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'bg-slate-900/50 border border-white/5'}`}>
            <div className="flex flex-col sm:flex-row gap-3">
              <code className={`flex-1 px-4 py-3 rounded-lg font-mono text-sm break-all ${
                theme === 'light' ? 'bg-white text-emerald-600 border border-gray-200' : 'bg-slate-950 text-emerald-400 border border-white/5'
              }`}>
                {proxyKey}
              </code>
              <button
                onClick={() => copyToClipboard(proxyKey || '')}
                className={`px-6 py-3 rounded-lg transition-all font-medium whitespace-nowrap flex items-center justify-center gap-2 ${
                  theme === 'light' 
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Key
                  </>
                )}
              </button>
            </div>
            <div className="flex items-start gap-2 mt-4 text-xs">
              <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${theme === 'light' ? 'text-amber-500' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                Keep this key secure. Treat it like a password and do not commit it to version control.
              </p>
            </div>
          </div>
        </div>

        {/* Integration Example */}
        <div className={`rounded-2xl p-6 mb-6 transition-all ${
          theme === 'light' 
            ? 'bg-white border border-gray-200 shadow-sm' 
            : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
        }`}>
          <h2 className={`text-xl font-bold tracking-tight mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Integration Example</h2>
          <div className={`rounded-xl overflow-hidden border ${
            theme === 'light' ? 'bg-slate-900 border-slate-800' : 'bg-slate-950 border-white/10'
          }`}>
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
              <span className="text-xs text-gray-400 font-mono">python</span>
            </div>
            <pre className="p-5 text-sm overflow-x-auto font-mono text-gray-300">
{`<span className="text-fuchsia-400">from</span> openai <span className="text-fuchsia-400">import</span> OpenAI

client = OpenAI(
    base_url=<span className="text-emerald-400">"http://localhost:8000/v1"</span>,
    api_key=<span className="text-emerald-400">"${proxyKey || 'YOUR_API_KEY'}"</span>
)

response = client.chat.completions.create(
    model=<span className="text-emerald-400">"gpt-4o-mini"</span>,
    messages=[
        {<span className="text-blue-400">"role"</span>: <span className="text-emerald-400">"user"</span>, <span className="text-blue-400">"content"</span>: <span className="text-emerald-400">"Hello!"</span>}
    ]
)`}
            </pre>
          </div>
        </div>

        {/* Quick Links */}
        <div className={`rounded-2xl p-6 mb-8 transition-all ${
          theme === 'light' 
            ? 'bg-white border border-gray-200 shadow-sm' 
            : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
        }`}>
          <h2 className={`text-xl font-bold tracking-tight mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              href="/"
              className={`p-4 rounded-xl transition-all border ${
                theme === 'light' 
                  ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="text-2xl mb-3">📊</div>
              <div className={`font-semibold mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Dashboard</div>
              <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>View analytics</div>
            </Link>
            
            <Link
              href="/settings/detection"
              className={`p-4 rounded-xl transition-all border ${
                theme === 'light' 
                  ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300' 
                  : 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30'
              }`}
            >
              <div className="text-2xl mb-3">🔬</div>
              <div className={`font-semibold mb-1 ${theme === 'light' ? 'text-indigo-900' : 'text-indigo-300'}`}>Detection Settings</div>
              <div className={`text-xs ${theme === 'light' ? 'text-indigo-700' : 'text-indigo-400'}`}>Configure safety</div>
            </Link>
            
            <Link
              href="/finops"
              className={`p-4 rounded-xl transition-all border ${
                theme === 'light' 
                  ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="text-2xl mb-3">💰</div>
              <div className={`font-semibold mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>FinOps</div>
              <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Track spending</div>
            </Link>
            
            <Link
              href="/flags"
              className={`p-4 rounded-xl transition-all border ${
                theme === 'light' 
                  ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="text-2xl mb-3">🚨</div>
              <div className={`font-semibold mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Flags</div>
              <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>View alerts</div>
            </Link>
            
            <Link
              href="/optimizer"
              className={`p-4 rounded-xl transition-all border ${
                theme === 'light' 
                  ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="text-2xl mb-3">🎯</div>
              <div className={`font-semibold mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Optimizer</div>
              <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Optimize prompts</div>
            </Link>
          </div>
        </div>

        {/* Danger Zone */}
        <div className={`rounded-2xl p-6 transition-all ${
          theme === 'light' 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-red-500/5 backdrop-blur-xl border border-red-500/20'
        }`}>
          <h2 className={`text-xl font-bold tracking-tight mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-red-700' : 'text-red-400'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Danger Zone
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className={`text-sm ${theme === 'light' ? 'text-red-600' : 'text-red-300'}`}>
              Log out of your account on this device.
            </p>
            <button
              onClick={logout}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm ${
                theme === 'light'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30'
              }`}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
