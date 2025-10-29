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
        return 'bg-red-900/30 text-red-300 border-red-500'
      case 'high':
        return 'bg-orange-900/30 text-orange-300 border-orange-500'
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-500'
      case 'low':
        return 'bg-blue-900/30 text-blue-300 border-blue-500'
      default:
        return 'bg-gray-900/30 text-gray-300 border-gray-500'
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
    return icons[type] || '🏴'
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-[#0f172a]'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'light' ? 'border-black' : 'border-indigo-500'}`}></div>
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
    <div className={`p-8 min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-[#0f172a] text-white'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold mb-2 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Safety Flags</h1>
        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-slate-400'}`}>Monitor and manage detected issues in LLM responses</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Flags" value={stats.total} color="from-indigo-500 to-blue-600" theme={theme} />
        <StatCard label="Unresolved" value={stats.unresolved} color="from-yellow-500 to-orange-600" theme={theme} />
        <StatCard label="Critical" value={stats.critical} color="from-red-500 to-pink-600" theme={theme} />
        <StatCard label="High Severity" value={stats.high} color="from-orange-500 to-amber-600" theme={theme} />
      </div>

      {/* Filters */}
      <div className={`rounded-2xl shadow-lg p-6 mb-6 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unresolved')}
              className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${theme === 'light' ? 'bg-white border border-gray-300 text-black focus:ring-black' : 'bg-slate-900/50 border border-slate-600 text-white focus:ring-indigo-500'}`}
            >
              <option value="all">All Flags</option>
              <option value="unresolved">Unresolved Only</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${theme === 'light' ? 'bg-white border border-gray-300 text-black focus:ring-black' : 'bg-slate-900/50 border border-slate-600 text-white focus:ring-indigo-500'}`}
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
          <div className={`rounded-2xl shadow-lg p-12 text-center ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
            <div className="text-6xl mb-4">🎉</div>
            <h3 className={`text-xl font-semibold mb-2 ${theme === 'light' ? 'text-black' : 'text-white'}`}>No Flags Found</h3>
            <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>All your LLM responses are looking good!</p>
          </div>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className={`rounded-2xl shadow-lg p-6 transition-all ${theme === 'light' ? 'bg-white border border-gray-200 hover:shadow-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700 hover:shadow-indigo-500/10'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getFlagTypeIcon(flag.flag_type)}</span>
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                        {flag.flag_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {new Date(flag.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className={`mb-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{flag.description}</p>

                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(flag.severity)}`}>
                      {flag.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-400">
                      Confidence: {(flag.confidence_score * 100).toFixed(1)}%
                    </span>
                    <button
                      onClick={() => router.push(`/runs/${flag.run_id}`)}
                      className={`text-sm underline cursor-pointer ${theme === 'light' ? 'text-black hover:text-gray-700' : 'text-indigo-400 hover:text-indigo-300'}`}
                    >
                      View Request →
                    </button>
                  </div>
                </div>

                {!flag.is_resolved && (
                  <button
                    onClick={() => resolveFlag(flag.id)}
                    className={`ml-4 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${theme === 'light' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    Resolve
                  </button>
                )}

                {flag.is_resolved && (
                  <span className="ml-4 px-4 py-2 bg-slate-700 text-gray-400 rounded-lg text-sm font-medium">
                    ✓ Resolved
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, theme }: { label: string; value: number; color: string; theme: 'light' | 'dark' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 border border-slate-700 backdrop-blur-xl'}`}>
      {theme === 'dark' && <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`}></div>}
      <div className="relative">
        <div className="text-sm text-gray-400 mb-1">{label}</div>
        <div className={`text-4xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>{value}</div>
      </div>
    </div>
  )
}
