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
      <div className={`flex items-center justify-center min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-[#0f172a]'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'light' ? 'border-black' : 'border-indigo-500'}`}></div>
      </div>
    )
  }

  return (
    <div className={`p-8 min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-[#0f172a] text-white'}`}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold mb-2 ${theme === 'light' ? 'text-black' : 'text-white'}`}>All Requests</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-slate-400'}>View and filter your LLM API calls</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filter.model}
            onChange={(e) => setFilter({ ...filter, model: e.target.value })}
            className={`px-4 py-2 rounded-xl focus:outline-none focus:ring-2 ${
              theme === 'light'
                ? 'bg-white border border-gray-300 text-black focus:ring-black'
                : 'bg-slate-800 border border-slate-700 text-white focus:ring-indigo-500'
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
            className={`px-4 py-2 rounded-xl focus:outline-none focus:ring-2 ${
              theme === 'light'
                ? 'bg-white border border-gray-300 text-black focus:ring-black'
                : 'bg-slate-800 border border-slate-700 text-white focus:ring-indigo-500'
            }`}
          >
            <option value={50}>50 results</option>
            <option value={100}>100 results</option>
            <option value={200}>200 results</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryStat
          label="Total Requests"
          value={runs.length}
          icon="📊"
          theme={theme}
        />
        <SummaryStat
          label="Total Tokens"
          value={runs.reduce((sum, r) => sum + (r.total_tokens || 0), 0).toLocaleString()}
          icon="🎯"
          theme={theme}
        />
        <SummaryStat
          label="Total Cost"
          value={`$${runs.reduce((sum, r) => sum + (r.cost_usd || 0), 0).toFixed(4)}`}
          icon="💰"
          theme={theme}
        />
        <SummaryStat
          label="Avg Latency"
          value={`${Math.round(runs.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / (runs.length || 1))}ms`}
          icon="⚡"
          theme={theme}
        />
      </div>

      {/* Table */}
      <div className={`rounded-2xl shadow-lg overflow-hidden ${
        theme === 'light'
          ? 'bg-white border border-gray-200'
          : 'bg-slate-800/70 border border-slate-700 backdrop-blur-xl'
      }`}>
        {runs.length === 0 ? (
          <div className={`p-12 text-center ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            <div className="text-4xl mb-4">📭</div>
            <p className="text-lg font-medium mb-2">No requests found</p>
            <p className="text-sm">Try adjusting your filters or send some requests through the proxy</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className={theme === 'light' ? 'bg-gray-50 border-b border-gray-200' : 'bg-slate-900/60 border-b border-slate-700'}>
                <tr>
                  <Th theme={theme}>Time</Th>
                  <Th theme={theme}>Model</Th>
                  <Th theme={theme}>Tokens</Th>
                  <Th theme={theme}>Cost</Th>
                  <Th theme={theme}>Latency</Th>
                  <Th theme={theme}>Status</Th>
                </tr>
              </thead>
              <tbody className={theme === 'light' ? 'divide-y divide-gray-200' : 'divide-y divide-slate-700'}>
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/runs/${r.id}`)}
                    className={`cursor-pointer transition-all ${
                      theme === 'light'
                        ? 'hover:bg-gray-50'
                        : 'hover:bg-indigo-900/20 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                    }`}
                  >
                    <Td theme={theme}>{new Date(r.created_at).toLocaleString()}</Td>
                    <Td theme={theme}>
                      <span className={`px-3 py-1 rounded-lg font-medium ${
                        theme === 'light'
                          ? 'bg-gray-100 border border-gray-300 text-black'
                          : 'bg-indigo-900/30 border border-indigo-500/50 text-indigo-300'
                      }`}>
                        {r.model}
                      </span>
                    </Td>
                    <Td theme={theme} className="font-semibold">{r.total_tokens?.toLocaleString() || 0}</Td>
                    <Td theme={theme} className="font-mono">${(r.cost_usd || 0).toFixed(5)}</Td>
                    <Td theme={theme}>
                      <span className={`${
                        r.latency_ms < 1000 ? 'text-green-400' :
                        r.latency_ms < 3000 ? 'text-yellow-400' :
                        'text-red-400'
                      } font-semibold`}>
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
    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
      theme === 'light' ? 'text-gray-700' : 'text-slate-300'
    }`}>
      {children}
    </th>
  )
}

function Td({ children, className = '', theme }: { children: React.ReactNode; className?: string; theme: 'light' | 'dark' }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className} ${
      theme === 'light' ? 'text-gray-900' : 'text-slate-300'
    }`}>
      {children}
    </td>
  )
}

function SummaryStat({ label, value, icon, theme }: { label: string; value: string | number; icon: string; theme: 'light' | 'dark' }) {
  return (
    <div className={`rounded-xl p-4 ${
      theme === 'light'
        ? 'bg-white border border-gray-200'
        : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>{value}</div>
    </div>
  )
}

function StatusBadge({ status, theme }: { status: string; theme: 'light' | 'dark' }) {
  const lightStyles = {
    success: 'bg-green-50 border-green-300 text-green-700',
    flagged: 'bg-red-50 border-red-300 text-red-700',
    error: 'bg-orange-50 border-orange-300 text-orange-700'
  }
  
  const darkStyles = {
    success: 'bg-green-900/30 border-green-500/50 text-green-300',
    flagged: 'bg-red-900/30 border-red-500/50 text-red-300',
    error: 'bg-orange-900/30 border-orange-500/50 text-orange-300'
  }
  
  const styles = theme === 'light' ? lightStyles : darkStyles

  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${styles[status as keyof typeof styles] || styles.success}`}>
      {status}
    </span>
  )
}