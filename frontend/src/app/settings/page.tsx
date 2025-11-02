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
    <div className={`p-8 min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-[#0f172a] text-gray-100'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Settings</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Manage your account and API keys</p>
        </div>

        {/* Account Info */}
        <div className={`rounded-2xl shadow-lg p-6 mb-6 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <div className={`text-lg ${theme === 'light' ? 'text-black' : 'text-white'}`}>{userEmail}</div>
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className={`rounded-2xl shadow-lg p-6 mb-6 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>🔑 Your Proxy API Key</h2>
          <p className={`mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            Use this key to authenticate your requests to the LLM Observability Platform
          </p>
          
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <code className="flex-1 bg-slate-950 text-green-400 px-4 py-3 rounded font-mono text-sm break-all">
                {proxyKey}
              </code>
              <button
                onClick={() => copyToClipboard(proxyKey || '')}
                className={`px-4 py-3 text-white rounded transition-colors whitespace-nowrap ${theme === 'light' ? 'bg-black hover:bg-gray-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              ⚠️ Keep this key secure. Don't share it or commit it to version control.
            </p>
          </div>
        </div>

        {/* Integration Example */}
        <div className={`rounded-2xl shadow-lg p-6 mb-6 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Integration Example</h2>
          <div className={`rounded-lg p-4 ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
            <pre className={`text-sm overflow-x-auto ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>
{`# Python Example (works with any LLM provider)
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="${proxyKey}"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",  # or claude-3-5-sonnet, gemini-2.0-flash-exp
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)`}
            </pre>
          </div>
        </div>

        {/* Quick Links */}
        <div className={`rounded-2xl shadow-lg p-6 mb-6 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Quick Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/"
              className={`p-4 rounded-lg transition-colors ${theme === 'light' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-900/50 hover:bg-slate-900'}`}
            >
              <div className="text-2xl mb-2">📊</div>
              <div className={`font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Dashboard</div>
              <div className="text-sm text-gray-400">View analytics</div>
            </Link>
            <Link
              href="/settings/detection"
              className="p-4 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/30 rounded-lg transition-colors"
            >
              <div className="text-2xl mb-2">🔬</div>
              <div className={`font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Detection Settings</div>
              <div className="text-sm text-indigo-300">Configure hallucination detection</div>
            </Link>
            <Link
              href="/finops"
              className={`p-4 rounded-lg transition-colors ${theme === 'light' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-900/50 hover:bg-slate-900'}`}
            >
              <div className="text-2xl mb-2">💰</div>
              <div className={`font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>FinOps</div>
              <div className="text-sm text-gray-400">Track spending</div>
            </Link>
            <Link
              href="/flags"
              className={`p-4 rounded-lg transition-colors ${theme === 'light' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-900/50 hover:bg-slate-900'}`}
            >
              <div className="text-2xl mb-2">🚨</div>
              <div className={`font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Flags</div>
              <div className="text-sm text-gray-400">View hallucinations</div>
            </Link>
            <Link
              href="/optimizer"
              className={`p-4 rounded-lg transition-colors ${theme === 'light' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-900/50 hover:bg-slate-900'}`}
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className={`font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Optimizer</div>
              <div className="text-sm text-gray-400">Optimize prompts</div>
            </Link>
          </div>
        </div>

        {/* Danger Zone */}
        <div className={`rounded-2xl shadow-lg p-6 ${theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 backdrop-blur-xl border border-red-500/50'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-red-700' : 'text-red-300'}`}>Danger Zone</h2>
          <button
            onClick={logout}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
