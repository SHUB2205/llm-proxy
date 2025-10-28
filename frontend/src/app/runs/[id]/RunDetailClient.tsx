'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import AdvancedDetectionPanel from '@/components/AdvancedDetectionPanel'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function RunDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { proxyKey, isAuthenticated } = useAuth()
  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !proxyKey) {
      router.push('/login')
      return
    }
    loadRun()
  }, [id, proxyKey])

  const loadRun = async () => {
    if (!proxyKey) return

    try {
      const response = await axios.get(`${API_URL}/v1/runs/${id}`, {
        headers: { 'Authorization': `Bearer ${proxyKey}` }
      })
      setRun(response.data)
    } catch (err) {
      console.error('Error loading run:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="p-8 min-h-screen bg-[#0f172a]">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/runs')}
            className="text-indigo-400 hover:text-indigo-300 mb-4"
          >
            ← Back to all requests
          </button>
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-6 py-4 rounded-xl">
            Request not found
          </div>
        </div>
      </div>
    )
  }

  const payload = run.payloads?.[0] || run.payloads
  const messages = payload?.messages || []
  const response = payload?.response || ''
  const flags = run.flags || []
  const advancedDetection = run.observability?.advanced_detection

  return (
    <div className="p-8 min-h-screen bg-[#0f172a] text-gray-100">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/runs')}
          className="text-indigo-400 hover:text-indigo-300 mb-6 flex items-center gap-2"
        >
          ← Back to all requests
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Request Details</h1>
          <p className="text-gray-400">{new Date(run.created_at).toLocaleString()}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Model" value={run.model} icon="🤖" />
          <StatCard label="Tokens" value={run.total_tokens} icon="🎯" />
          <StatCard label="Cost" value={`$${run.cost_usd?.toFixed(5) || '0.00000'}`} icon="💰" />
          <StatCard label="Latency" value={`${run.latency_ms}ms`} icon="⚡" />
        </div>

        {/* Advanced Detection Panel */}
        {advancedDetection && (
          <AdvancedDetectionPanel detection={advancedDetection} />
        )}

        {/* Flags Section (if any) */}
        {flags.length > 0 && (
          <div className="mb-8 bg-red-900/20 border border-red-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🚨</span>
              <h2 className="text-2xl font-bold text-white">Safety Flags Detected</h2>
            </div>
            <div className="space-y-3">
              {flags.map((flag: any, idx: number) => (
                <div key={idx} className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-red-300">{flag.flag_type}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      flag.severity === 'high' ? 'bg-red-500 text-white' :
                      flag.severity === 'medium' ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-black'
                    }`}>
                      {flag.severity}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{flag.description}</p>
                  {flag.confidence_score && (
                    <p className="text-gray-400 text-xs mt-2">
                      Confidence: {(flag.confidence_score * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Conversation</h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Input Messages */}
            {messages.map((msg: any, idx: number) => (
              <MessageBubble key={idx} role={msg.role} content={msg.content} />
            ))}

            {/* AI Response */}
            {response && (
              <MessageBubble role="assistant" content={response} />
            )}
          </div>
        </div>

        {/* Raw Data (Collapsible) */}
        <details className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
          <summary className="p-6 cursor-pointer hover:bg-slate-700/30 transition-colors">
            <span className="text-lg font-semibold text-white">View Raw Data (JSON)</span>
          </summary>
          <div className="p-6 border-t border-slate-700">
            <pre className="bg-slate-900/50 p-4 rounded-lg text-xs overflow-auto text-gray-300 max-h-96">
              {JSON.stringify(run, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user'
  const isSystem = role === 'system'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl p-4 ${
        isUser 
          ? 'bg-indigo-600 text-white' 
          : isSystem
          ? 'bg-purple-900/30 border border-purple-500/50 text-purple-200'
          : 'bg-slate-700 text-gray-100'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
            {role}
          </span>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  )
}