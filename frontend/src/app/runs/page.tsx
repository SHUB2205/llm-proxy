'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function RunsPage() {
  const router = useRouter()
  const { proxyKey, isAuthenticated } = useAuth()
  const { theme } = useTheme()
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    model: '',
    limit: 50
  })

  useEffect(() => {
    if (!isAuthenticated || !proxyKey) {
      router.push('/login')
      return
    }
    loadRuns()
  }, [isAuthenticated, proxyKey, filter])

  const loadRuns = async () => {
    if (!proxyKey) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('limit', filter.limit.toString())
      if (filter.model) params.append('model', filter.model)

      const response = await axios.get(`${API_URL}/v1/runs?${params}`, {
        headers: { 'Authorization': `Bearer ${proxyKey}` }
      })
      setRuns((response.data as any).runs || [])
    } catch (err) {
      console.error('Error loading runs:', err)
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

  return (
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'}`}>
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>All Requests</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>View and filter your LLM API calls</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filter.model}
            onChange={(e) => setFilter({ ...filter, model: e.target.value })}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
              theme === 'light'
                ? 'bg-white border border-gray-200 text-slate-900 shadow-sm hover:border-gray-300'
                : 'bg-slate-900/50 border border-white/10 text-white backdrop-blur-sm hover:border-white/20'
            }`}
          >
            <option value="">All Models</option>
            <optgroup label="OpenAI">
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o-mini</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </optgroup>
            <optgroup label="Anthropic">
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            </optgroup>
            <optgroup label="Google">
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </optgroup>
            <optgroup label="DeepSeek">
              <option value="deepseek-chat">DeepSeek Chat</option>
            </optgroup>
          </select>

          <select
            value={filter.limit}
            onChange={(e) => setFilter({ ...filter, limit: parseInt(e.target.value) })}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
              theme === 'light'
                ? 'bg-white border border-gray-200 text-slate-900 shadow-sm hover:border-gray-300'
                : 'bg-slate-900/50 border border-white/10 text-white backdrop-blur-sm hover:border-white/20'
            }`}
          >
            <option value={50}>50 results</option>
            <option value={100}>100 results</option>
            <option value={200}>200 results</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <SummaryStat
          label="Total Requests"
          value={runs.length}
          color="blue"
          theme={theme}
        />
        <SummaryStat
          label="Total Tokens"
          value={runs.reduce((sum, r) => sum + (r.total_tokens || 0), 0).toLocaleString()}
          color="cyan"
          theme={theme}
        />
        <SummaryStat
          label="Total Cost"
          value={`$${runs.reduce((sum, r) => sum + (r.cost_usd || 0), 0).toFixed(4)}`}
          color="emerald"
          theme={theme}
        />
        <SummaryStat
          label="Avg Latency"
          value={`${Math.round(runs.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / (runs.length || 1))}ms`}
          color="amber"
          theme={theme}
        />
      </div>

      {/* Table */}
      <div className={`rounded-2xl overflow-hidden ${
        theme === 'light'
          ? 'bg-white border border-gray-200 shadow-sm'
          : 'bg-slate-900/50 border border-white/10 backdrop-blur-xl shadow-2xl shadow-blue-500/5'
      }`}>
        {runs.length === 0 ? (
          <div className={`p-16 text-center ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
              theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
            }`}>
              <svg className={`w-10 h-10 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <p className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>No requests found</p>
            <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-500'}>Try adjusting your filters or send some requests through the proxy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className={theme === 'light' ? 'bg-gray-50 border-b border-gray-200' : 'bg-white/[0.02] border-b border-white/10'}>
                <tr>
                  <Th theme={theme}>Time</Th>
                  <Th theme={theme}>Model</Th>
                  <Th theme={theme}>Tokens</Th>
                  <Th theme={theme}>Cost</Th>
                  <Th theme={theme}>Latency</Th>
                  <Th theme={theme}>Status</Th>
                </tr>
              </thead>
              <tbody className={theme === 'light' ? 'divide-y divide-gray-100' : 'divide-y divide-white/5'}>
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/runs/${r.id}`)}
                    className={`cursor-pointer transition-all ${
                      theme === 'light'
                        ? 'hover:bg-gray-50'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <Td theme={theme} className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                      {new Date(r.created_at).toLocaleString()}
                    </Td>
                    <Td theme={theme}>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        theme === 'light'
                          ? 'bg-white border-gray-200 text-slate-700 shadow-sm'
                          : 'bg-white/5 border-white/10 text-gray-300'
                      }`}>
                        {r.model}
                      </span>
                    </Td>
                    <Td theme={theme} className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`}>
                      {r.total_tokens?.toLocaleString() || 0}
                    </Td>
                    <Td theme={theme} className={`font-mono text-[13px] ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                      ${(r.cost_usd || 0).toFixed(5)}
                    </Td>
                    <Td theme={theme}>
                      <span className={`font-medium ${
                        r.latency_ms < 1000 ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') :
                        r.latency_ms < 3000 ? (theme === 'light' ? 'text-amber-600' : 'text-amber-400') :
                        (theme === 'light' ? 'text-red-600' : 'text-red-400')
                      }`}>
                        {r.latency_ms}ms
                      </span>
                    </Td>
                    <Td theme={theme}>
                      <StatusBadge status={r.status || 'success'} theme={theme} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Th({ children, theme }: { children: React.ReactNode; theme: 'light' | 'dark' }) {
  return (
    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
      theme === 'light' ? 'text-gray-500' : 'text-gray-400'
    }`}>
      {children}
    </th>
  )
}

function Td({ children, className = '', theme }: { children: React.ReactNode; className?: string; theme: 'light' | 'dark' }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
      {children}
    </td>
  )
}

function SummaryStat({ label, value, color, theme }: { label: string; value: string | number; color: string; theme: 'light' | 'dark' }) {
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
      <div className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500 font-medium uppercase tracking-wider'}`}>
        {label}
      </div>
      <div className={`text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  )
}

function StatusBadge({ status, theme }: { status: string; theme: 'light' | 'dark' }) {
  const lightStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    flagged: 'bg-red-50 border-red-200 text-red-700',
    error: 'bg-amber-50 border-amber-200 text-amber-700'
  }
  
  const darkStyles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    flagged: 'bg-red-500/10 border-red-500/20 text-red-400',
    error: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
  }
  
  const styles = theme === 'light' ? lightStyles : darkStyles

  return (
    <span className={`px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold border ${styles[status as keyof typeof styles] || styles.success}`}>
      {status}
    </span>
  )
}