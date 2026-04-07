'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Flag {
  id: string
  run_id: string
  flag_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence_score: number
  description: string
  is_resolved: boolean
  created_at: string
}

export default function FlagsPage() {
  const router = useRouter()
  const { proxyKey, isAuthenticated } = useAuth()
  const { theme } = useTheme()
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/onboard')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    loadFlags()
  }, [filter, severityFilter])

  const loadFlags = async () => {
    try {
      const params: any = { limit: 100 }
      
      if (filter === 'unresolved') {
        params.is_resolved = false
      }
      
      if (severityFilter !== 'all') {
        params.severity = severityFilter
      }

      const response = await axios.get(`${API_URL}/v1/flags`, {
        params,
        headers: { Authorization: `Bearer ${proxyKey}` }
      })

      setFlags((response.data as any)?.flags || [])
    } catch (error) {
      console.error('Error loading flags:', error)
    } finally {
      setLoading(false)
    }
  }

  const resolveFlag = async (flagId: string) => {
    try {
      await axios.post(
        `${API_URL}/v1/flags/${flagId}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${proxyKey}` } }
      )
      
      // Reload flags
      loadFlags()
    } catch (error) {
      console.error('Error resolving flag:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return theme === 'light' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'high':
        return theme === 'light' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'medium':
        return theme === 'light' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'low':
        return theme === 'light' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default:
        return theme === 'light' ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getFlagTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      hallucination_indicator: '🔴',
      low_confidence: '⚠️',
      potential_contradiction: '⚡',
      fabricated_details: '🚨',
      repetitive_content: '🔄',
      vague_response: '❓',
      excessive_hedging: '🤔',
      insufficient_response: '📉'
    }
    return icons[type] || '🚩'
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-950'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'light' ? 'border-blue-600' : 'border-blue-500'}`}></div>
      </div>
    )
  }

  const stats = {
    total: flags.length,
    unresolved: flags.filter(f => !f.is_resolved).length,
    critical: flags.filter(f => f.severity === 'critical').length,
    high: flags.filter(f => f.severity === 'high').length
  }

  return (
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'}`}>
      {/* Header */}
      <div className="mb-10">
        <h1 className={`text-4xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Safety Flags</h1>
        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Monitor and manage detected issues in LLM responses</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Flags" value={stats.total} color="blue" theme={theme} />
        <StatCard label="Unresolved" value={stats.unresolved} color="amber" theme={theme} />
        <StatCard label="Critical" value={stats.critical} color="fuchsia" theme={theme} />
        <StatCard label="High Severity" value={stats.high} color="red" theme={theme} />
      </div>

      {/* Filters */}
      <div className={`rounded-2xl p-6 mb-8 transition-all ${
        theme === 'light' 
          ? 'bg-white border border-gray-200 shadow-sm' 
          : 'bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-blue-500/5'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-xs">
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unresolved')}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                theme === 'light'
                  ? 'bg-white border border-gray-200 text-slate-900 shadow-sm hover:border-gray-300'
                  : 'bg-slate-950 border border-white/10 text-white hover:border-white/20'
              }`}
            >
              <option value="all">All Flags</option>
              <option value="unresolved">Unresolved Only</option>
            </select>
          </div>

          <div className="flex-1 max-w-xs">
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                theme === 'light'
                  ? 'bg-white border border-gray-200 text-slate-900 shadow-sm hover:border-gray-300'
                  : 'bg-slate-950 border border-white/10 text-white hover:border-white/20'
              }`}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Flags List */}
      <div className="space-y-4">
        {flags.length === 0 ? (
          <div className={`rounded-2xl p-16 text-center transition-all ${
            theme === 'light' 
              ? 'bg-white border border-gray-200 shadow-sm' 
              : 'bg-slate-900/50 backdrop-blur-xl border border-white/10'
          }`}>
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
              theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'
            }`}>
              <svg className={`w-10 h-10 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No Flags Found</h3>
            <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>All your LLM responses are looking good! No safety issues detected.</p>
          </div>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className={`rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                theme === 'light' 
                  ? 'bg-white border border-gray-200 hover:shadow-md' 
                  : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      theme === 'light' ? 'bg-gray-100' : 'bg-white/5'
                    }`}>
                      {getFlagTypeIcon(flag.flag_type)}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {flag.flag_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                        {new Date(flag.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className={`mb-6 text-sm leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                    {flag.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getSeverityColor(flag.severity)}`}>
                      {flag.severity}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                      theme === 'light' ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-white/5 text-gray-400 border-white/10'
                    }`}>
                      Confidence: {(flag.confidence_score * 100).toFixed(1)}%
                    </span>
                    <button
                      onClick={() => router.push(`/runs/${flag.run_id}`)}
                      className={`text-sm font-medium flex items-center gap-1 transition-colors ml-auto md:ml-4 ${
                        theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                      }`}
                    >
                      View Request
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-white/10">
                  {!flag.is_resolved ? (
                    <button
                      onClick={() => resolveFlag(flag.id)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2 ${
                        theme === 'light' 
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark Resolved
                    </button>
                  ) : (
                    <div className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border ${
                      theme === 'light' 
                        ? 'bg-gray-50 text-gray-500 border-gray-200' 
                        : 'bg-white/5 text-gray-400 border-white/5'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Resolved
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, theme }: { label: string; value: number; color: string; theme: 'light' | 'dark' }) {
  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
      red: 'bg-red-500/10 border-red-500/20 text-red-400',
    }
    return colors[color] || colors.blue
  }

  const colorClasses = theme === 'dark' 
    ? getColorClasses(color) 
    : 'bg-white border-gray-200 text-slate-900 shadow-sm hover:shadow-md';

  return (
    <div className={`rounded-xl p-5 border transition-all duration-300 hover:-translate-y-1 ${colorClasses}`}>
      <div className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500 font-medium uppercase tracking-wider'}`}>
        {label}
      </div>
      <div className={`text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  )
}
