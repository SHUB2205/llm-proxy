'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [proxyKey, setProxyKey] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    if (!proxyKey || !email) {
      setError('Please enter both email and proxy key')
      return
    }

    // Correct argument order for login(proxyKey, email)
    login(proxyKey, email)
    router.push('/')
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-8 relative ${
      theme === 'light' ? 'bg-white' : 'bg-[#0f172a]'
    }`}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`absolute top-8 right-8 p-3 rounded-lg transition-all ${
          theme === 'light'
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
        }`}
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
      
      <div className={`max-w-md w-full rounded-2xl shadow-lg p-8 ${
        theme === 'light'
          ? 'bg-white border border-gray-200'
          : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'
      }`}>
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Welcome Back</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Sign in to your LLM Observability account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                theme === 'light'
                  ? 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:ring-black'
                  : 'bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:ring-indigo-500'
              }`}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Proxy API Key
            </label>
            <input
              type="password"
              required
              value={proxyKey}
              onChange={(e) => setProxyKey(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                theme === 'light'
                  ? 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:ring-black'
                  : 'bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:ring-indigo-500'
              }`}
              placeholder="llm_obs_..."
            />
            <p className="text-xs text-gray-400 mt-2">
              Enter the proxy key you received during registration
            </p>
          </div>

          {error && (
            <div className={`px-4 py-3 rounded-lg text-sm ${
              theme === 'light'
                ? 'bg-red-50 border border-red-300 text-red-700'
                : 'bg-red-900/30 border border-red-500 text-red-300'
            }`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full px-6 py-3 rounded-xl font-medium transition-colors ${
              theme === 'light'
                ? 'bg-black hover:bg-gray-800 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Sign In
          </button>
        </form>

        <div className={`mt-6 text-center text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
          Don't have an account?{' '}
          <button onClick={() => router.push('/onboard')} className={`underline ${
            theme === 'light' ? 'text-black hover:text-gray-700' : 'text-indigo-400 hover:text-indigo-300'
          }`}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}
