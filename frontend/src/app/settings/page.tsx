'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { isAuthenticated, userEmail, proxyKey, logout } = useAuth()
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
    <div className="p-8 min-h-screen bg-[#0f172a] text-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and API keys</p>
        </div>

        {/* Account Info */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <div className="text-lg text-white">{userEmail}</div>
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">🔑 Your Proxy API Key</h2>
          <p className="text-gray-400 mb-4">
            Use this key to authenticate your requests to the LLM Observability Platform
          </p>
          
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <code className="flex-1 bg-slate-950 text-green-400 px-4 py-3 rounded font-mono text-sm break-all">
                {proxyKey}
              </code>
              <button
                onClick={() => copyToClipboard(proxyKey || '')}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors whitespace-nowrap"
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
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Integration Example</h2>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <pre className="text-sm text-gray-300 overflow-x-auto">
{`# Python Example
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="${proxyKey}"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)`}
            </pre>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/"
              className="p-4 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-white">Dashboard</div>
              <div className="text-sm text-gray-400">View analytics</div>
            </a>
            <a
              href="/finops"
              className="p-4 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors"
            >
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold text-white">FinOps</div>
              <div className="text-sm text-gray-400">Track spending</div>
            </a>
            <a
              href="/flags"
              className="p-4 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors"
            >
              <div className="text-2xl mb-2">🚨</div>
              <div className="font-semibold text-white">Flags</div>
              <div className="text-sm text-gray-400">View hallucinations</div>
            </a>
            <a
              href="/optimizer"
              className="p-4 bg-slate-900/50 hover:bg-slate-900 rounded-lg transition-colors"
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-white">Optimizer</div>
              <div className="text-sm text-gray-400">Optimize prompts</div>
            </a>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 backdrop-blur-xl rounded-2xl shadow-lg border border-red-500/50 p-6">
          <h2 className="text-2xl font-bold text-red-300 mb-4">Danger Zone</h2>
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
