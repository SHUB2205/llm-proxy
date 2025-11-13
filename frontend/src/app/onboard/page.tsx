'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function OnboardPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    openaiApiKey: ''  // Can be any LLM provider API key
  })
  
  const [result, setResult] = useState<any>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && step === 1) {
      router.push('/')
    }
  }, [isAuthenticated, step, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Use new auth API endpoint
      const response = await axios.post(`${API_URL}/v1/auth/signup`, {
        email: formData.email,
        password: formData.password,
        company_name: formData.companyName,
        openai_api_key: formData.openaiApiKey
      })

      // Save credentials
      login((response.data as any).proxy_key, formData.email)
      
      setResult(response.data as any)
      setStep(2)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (step === 2 && result) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 relative ${theme === 'light' ? 'bg-white' : 'bg-[#0f172a]'}`}>
        <button
          onClick={toggleTheme}
          className={`absolute top-8 right-8 p-3 rounded-lg transition-all ${theme === 'light' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
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
        <div className={`max-w-2xl w-full rounded-2xl shadow-lg p-8 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Welcome to LLM Observability!</h1>
            <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Your account has been created successfully</p>
          </div>

          <div className="space-y-6">
            <div className={`rounded-lg p-6 ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Your Proxy API Key</h2>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-950 text-green-400 px-4 py-3 rounded font-mono text-sm break-all">
                  {result.proxy_key}
                </code>
                <button
                  onClick={() => copyToClipboard(result.proxy_key)}
                  className={`px-4 py-3 text-white rounded transition-colors ${theme === 'light' ? 'bg-black hover:bg-gray-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                ⚠️ Save this key securely. You'll need it to make API calls.
              </p>
            </div>

            <div className={`rounded-lg p-6 ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Quick Start</h2>
              <div className={`space-y-3 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className={`font-medium ${theme === 'light' ? 'text-black' : 'text-white'}`}>Replace your LLM API endpoint</p>
                    <code className="text-xs text-gray-400">http://localhost:8000/v1/chat/completions</code>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className={`font-medium ${theme === 'light' ? 'text-black' : 'text-white'}`}>Use your proxy key in Authorization header</p>
                    <code className="text-xs text-gray-400">Bearer {result.proxy_key.substring(0, 20)}...</code>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className={`font-medium ${theme === 'light' ? 'text-black' : 'text-white'}`}>Monitor your requests in the dashboard</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-lg p-6 ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
              <h2 className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Example Code</h2>
              <pre className={`p-4 rounded text-xs overflow-x-auto ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900' : 'bg-slate-950 text-gray-300'}`}>
{`import httpx

response = httpx.post(
    "http://localhost:8000/v1/chat/completions",
    headers={
        "Authorization": "Bearer ${result.proxy_key}",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4o-mini",  # or claude-3-5-sonnet, gemini-2.0-flash-exp
        "messages": [
            {"role": "user", "content": "Hello!"}
        ]
    }
)

result = response.json()
print(result["observability"])  # View flags`}
              </pre>
            </div>

            <div className="flex gap-4">
              <a
                href="/"
                className={`flex-1 px-6 py-3 text-white rounded-xl font-medium text-center transition-colors ${theme === 'light' ? 'bg-black hover:bg-gray-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                Go to Dashboard
              </a>
              <a
                href="/docs"
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium text-center transition-colors"
              >
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-8 relative ${theme === 'light' ? 'bg-white' : 'bg-[#0f172a]'}`}>
      <button
        onClick={toggleTheme}
        className={`absolute top-8 right-8 p-3 rounded-lg transition-all ${theme === 'light' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
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
      <div className={`max-w-md w-full rounded-2xl shadow-lg p-8 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Get Started</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Create your account to start monitoring LLM responses</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${theme === 'light' ? 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:ring-black' : 'bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:ring-indigo-500'}`}
              placeholder="admin@yourcompany.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${theme === 'light' ? 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:ring-black' : 'bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:ring-indigo-500'}`}
              placeholder="Create a secure password"
              minLength={6}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Company Name
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${theme === 'light' ? 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:ring-black' : 'bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:ring-indigo-500'}`}
              placeholder="Your Company Inc"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              LLM API Key (OpenAI, Claude, Gemini, etc.)
            </label>
            <input
              type="password"
              required
              value={formData.openaiApiKey}
              onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${theme === 'light' ? 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:ring-black' : 'bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:ring-indigo-500'}`}
              placeholder="sk-... (OpenAI, Claude, Gemini, DeepSeek, etc.)"
            />
            <p className="text-xs text-gray-400 mt-2">
              🔒 Your API key is encrypted and stored securely
            </p>
          </div>

          {error && (
            <div className={`px-4 py-3 rounded-lg text-sm ${theme === 'light' ? 'bg-red-50 border border-red-300 text-red-700' : 'bg-red-900/30 border border-red-500 text-red-300'}`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-6 py-3 text-white rounded-xl font-medium transition-colors ${theme === 'light' ? 'bg-black hover:bg-gray-800 disabled:bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600'}`}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className={`mt-6 text-center text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className={`underline ${theme === 'light' ? 'text-black hover:text-gray-700' : 'text-indigo-400 hover:text-indigo-300'}`}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
