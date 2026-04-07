'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import AdvancedDetectionPanel from '@/components/AdvancedDetectionPanel'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function RunDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { proxyKey, isAuthenticated } = useAuth()
  const { theme } = useTheme()
  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !proxyKey) {
      router.push('/login')
      return
    }
    loadRun()
  }, [id, proxyKey, isAuthenticated, router])

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
      <div className={`flex items-center justify-center min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-950'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'light' ? 'border-blue-600' : 'border-blue-500'}`}></div>
      </div>
    )
  }

  if (!run) {
    return (
      <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'}`}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/runs')}
            className={`mb-6 flex items-center gap-2 text-sm font-medium transition-colors ${
              theme === 'light' ? 'text-gray-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to all requests
          </button>
          
          <div className={`rounded-2xl p-16 text-center transition-all ${
            theme === 'light' 
              ? 'bg-white border border-gray-200 shadow-sm' 
              : 'bg-white/[0.02] backdrop-blur-xl border border-white/10'
          }`}>
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
              theme === 'light' ? 'bg-red-50' : 'bg-red-500/10'
            }`}>
              <svg className={`w-10 h-10 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className={`text-xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Request Not Found</h2>
            <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>The request you're looking for doesn't exist or you don't have access to it.</p>
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
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/runs')}
          className={`mb-6 flex items-center gap-2 text-sm font-medium transition-colors ${
            theme === 'light' ? 'text-gray-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to all requests
        </button>

        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className={`text-4xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Request Details</h1>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                {new Date(run.created_at).toLocaleString()}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${
                run.status === 'flagged' 
                  ? (theme === 'light' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20')
                  : (theme === 'light' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
              }`}>
                {run.status || 'success'}
              </span>
            </div>
          </div>
          <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
            theme === 'light' ? 'bg-white border-gray-200 text-gray-500' : 'bg-white/5 border-white/10 text-gray-400'
          }`}>
            ID: {run.id}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Model" value={run.model} icon="🤖" theme={theme} color="blue" />
          <StatCard label="Tokens" value={run.total_tokens?.toLocaleString() || '0'} icon="🎯" theme={theme} color="cyan" />
          <StatCard label="Cost" value={`$${run.cost_usd?.toFixed(5) || '0.00000'}`} icon="💰" theme={theme} color="emerald" />
          <StatCard label="Latency" value={`${run.latency_ms || 0}ms`} icon="⚡" theme={theme} color="amber" />
        </div>

        {/* Flags Section (if any) */}
        {flags.length > 0 && (
          <div className={`mb-10 rounded-2xl p-6 border transition-all ${
            theme === 'light' 
              ? 'bg-red-50 border-red-200 shadow-sm' 
              : 'bg-red-500/5 backdrop-blur-xl border-red-500/20 shadow-lg shadow-red-500/5'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                theme === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-red-800' : 'text-red-400'}`}>Safety Flags Detected</h2>
            </div>
            
            <div className="space-y-4">
              {flags.map((flag: any, idx: number) => {
                const severityClass = theme === 'light' 
                  ? flag.severity === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                    flag.severity === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    flag.severity === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    'bg-blue-100 text-blue-800 border-blue-200'
                  : flag.severity === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                    flag.severity === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                    flag.severity === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/30'

                return (
                  <div key={idx} className={`rounded-xl p-5 border ${
                    theme === 'light' ? 'bg-white border-red-100' : 'bg-slate-900/50 border-red-500/10'
                  }`}>
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-current/10">
                      <span className={`font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {flag.flag_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${severityClass}`}>
                        {flag.severity}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{flag.description}</p>
                    {flag.confidence_score && (
                      <div className={`mt-3 text-xs font-mono ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        Confidence: <span className="font-semibold text-current">{(flag.confidence_score * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Advanced Detection Panel */}
        {advancedDetection && (
          <AdvancedDetectionPanel detection={advancedDetection} />
        )}

        {/* Conversation */}
        <div className={`rounded-2xl overflow-hidden mb-10 transition-all ${
          theme === 'light' 
            ? 'bg-white border border-gray-200 shadow-sm' 
            : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
        }`}>
          <div className={`p-6 border-b flex items-center justify-between ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/20 text-blue-400'
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Conversation</h2>
            </div>
          </div>

          <div className={`p-6 space-y-6 ${theme === 'light' ? 'bg-gray-50/50' : 'bg-slate-900/30'}`}>
            {/* Input Messages */}
            {messages.map((msg: any, idx: number) => (
              <MessageBubble key={idx} role={msg.role} content={msg.content} theme={theme} />
            ))}

            {/* AI Response */}
            {response && (
              <MessageBubble role="assistant" content={response} theme={theme} />
            )}
          </div>
        </div>

        {/* Raw Data (Collapsible) */}
        <details className={`rounded-2xl overflow-hidden transition-all group ${
          theme === 'light' 
            ? 'bg-white border border-gray-200 shadow-sm' 
            : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
        }`}>
          <summary className={`p-6 cursor-pointer flex items-center justify-between outline-none ${
            theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-gray-400'
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className={`text-lg font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>View Raw Data (JSON)</span>
            </div>
            <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className={`p-6 border-t ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/5 bg-slate-900/50'}`}>
            <pre className={`p-5 rounded-xl text-xs overflow-auto font-mono ${
              theme === 'light' ? 'bg-white text-slate-700 border border-gray-200' : 'bg-slate-950 text-gray-300 border border-white/5'
            } max-h-[500px]`}>
              {JSON.stringify(run, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, theme, color }: { label: string; value: string | number; icon: string; theme: 'light' | 'dark'; color: string }) {
  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    }
    return colors[color] || colors.blue
  }

  const colorClasses = theme === 'dark' 
    ? getColorClasses(color) 
    : 'bg-white border-gray-200 text-slate-900 shadow-sm hover:shadow-md';

  return (
    <div className={`rounded-xl p-5 border transition-all duration-300 hover:-translate-y-1 ${colorClasses}`}>
      <div className={`text-[10px] uppercase tracking-wider mb-2 font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        {label}
      </div>
      <div className={`text-2xl sm:text-3xl font-bold tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} title={String(value)}>
        {value}
      </div>
    </div>
  )
}

function MessageBubble({ role, content, theme }: { role: string; content: string; theme: 'light' | 'dark' }) {
  const isUser = role === 'user'
  const isSystem = role === 'system'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-5 shadow-sm border ${
        isUser 
          ? (theme === 'light' ? 'bg-blue-600 text-white border-blue-700' : 'bg-blue-600 text-white border-blue-500/50')
          : isSystem
          ? (theme === 'light' ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-purple-500/10 border-purple-500/30 text-purple-200')
          : (theme === 'light' ? 'bg-white border-gray-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-gray-200')
      } ${
        isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
      }`}>
        <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${
          isUser 
            ? 'border-white/20' 
            : isSystem 
            ? (theme === 'light' ? 'border-purple-200' : 'border-purple-500/20')
            : (theme === 'light' ? 'border-gray-100' : 'border-slate-600')
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
            isUser ? 'bg-white/20' : isSystem ? (theme === 'light' ? 'bg-purple-200 text-purple-700' : 'bg-purple-500/30') : (theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-slate-700')
          }`}>
            {role.charAt(0).toUpperCase()}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            {role}
          </span>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
          {content}
        </div>
      </div>
    </div>
  )
}