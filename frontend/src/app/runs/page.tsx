'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function RunsPage() {
  const router = useRouter()
  const { proxyKey, isAuthenticated } = useAuth()
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
      setRuns(response.data.runs || [])
    } catch (err) {
      console.error('Error loading runs:', err)
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

  return (
    <div className="p-8 bg-[#0f172a] min-h-screen text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">All Requests</h1>
          <p className="text-slate-400">View and filter your LLM API calls</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filter.model}
            onChange={(e) => setFilter({ ...filter, model: e.target.value })}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Models</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o-mini</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>

          <select
            value={filter.limit}
            onChange={(e) => setFilter({ ...filter, limit: parseInt(e.target.value) })}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        />
        <SummaryStat
          label="Total Tokens"
          value={runs.reduce((sum, r) => sum + (r.total_tokens || 0), 0).toLocaleString()}
          icon="🎯"
        />
        <SummaryStat
          label="Total Cost"
          value={`$${runs.reduce((sum, r) => sum + (r.cost_usd || 0), 0).toFixed(4)}`}
          icon="💰"
        />
        <SummaryStat
          label="Avg Latency"
          value={`${Math.round(runs.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / (runs.length || 1))}ms`}
          icon="⚡"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800/70 border border-slate-700 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden">
        {runs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-lg font-medium mb-2">No requests found</p>
            <p className="text-sm">Try adjusting your filters or send some requests through the proxy</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/60 border-b border-slate-700">
                <tr>
                  <Th>Time</Th>
                  <Th>Model</Th>
                  <Th>Tokens</Th>
                  <Th>Cost</Th>
                  <Th>Latency</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/runs/${r.id}`)}
                    className="cursor-pointer transition-all hover:bg-indigo-900/20 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                  >
                    <Td>{new Date(r.created_at).toLocaleString()}</Td>
                    <Td>
                      <span className="px-3 py-1 bg-indigo-900/30 border border-indigo-500/50 rounded-lg font-medium text-indigo-300">
                        {r.model}
                      </span>
                    </Td>
                    <Td className="font-semibold">{r.total_tokens?.toLocaleString() || 0}</Td>
                    <Td className="font-mono">${(r.cost_usd || 0).toFixed(5)}</Td>
                    <Td>
                      <span className={`${
                        r.latency_ms < 1000 ? 'text-green-400' :
                        r.latency_ms < 3000 ? 'text-yellow-400' :
                        'text-red-400'
                      } font-semibold`}>
                        {r.latency_ms}ms
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={r.status || 'success'} />
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
      {children}
    </th>
  )
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-6 py-4 text-slate-300 whitespace-nowrap ${className}`}>
      {children}
    </td>
  )
}

function SummaryStat({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-slate-800/70 backdrop-blur-xl rounded-xl border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    success: 'bg-green-900/30 border-green-500/50 text-green-300',
    flagged: 'bg-red-900/30 border-red-500/50 text-red-300',
    error: 'bg-orange-900/30 border-orange-500/50 text-orange-300'
  }

  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${styles[status as keyof typeof styles] || styles.success}`}>
      {status}
    </span>
  )
}