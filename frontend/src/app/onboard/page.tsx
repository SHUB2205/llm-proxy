'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function OnboardPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    openaiApiKey: ''
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
      const response = await axios.post(`${API_URL}/v1/users/register`, {
        email: formData.email,
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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to LLM Observability!</h1>
            <p className="text-gray-400">Your account has been created successfully</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Your Proxy API Key</h2>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-950 text-green-400 px-4 py-3 rounded font-mono text-sm break-all">
                  {result.proxy_key}
                </code>
                <button
                  onClick={() => copyToClipboard(result.proxy_key)}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                ⚠️ Save this key securely. You'll need it to make API calls.
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Start</h2>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="font-medium text-white">Replace your OpenAI endpoint</p>
                    <code className="text-xs text-gray-400">http://localhost:8000/v1/chat/completions</code>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="font-medium text-white">Use your proxy key in Authorization header</p>
                    <code className="text-xs text-gray-400">Bearer {result.proxy_key.substring(0, 20)}...</code>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="font-medium text-white">Monitor your requests in the dashboard</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Example Code</h2>
              <pre className="bg-slate-950 text-gray-300 p-4 rounded text-xs overflow-x-auto">
{`import httpx

response = httpx.post(
    "http://localhost:8000/v1/chat/completions",
    headers={
        "Authorization": "Bearer ${result.proxy_key}",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4o-mini",
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
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-center transition-colors"
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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Get Started</h1>
          <p className="text-gray-400">Create your account to start monitoring LLM responses</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin@yourcompany.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your Company Inc"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              required
              value={formData.openaiApiKey}
              onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="sk-..."
            />
            <p className="text-xs text-gray-400 mt-2">
              🔒 Your API key is encrypted and stored securely
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white rounded-xl font-medium transition-colors"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className="text-indigo-400 hover:text-indigo-300 underline">
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
