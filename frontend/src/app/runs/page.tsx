'use client'
import { useEffect, useState } from 'react'
import { fetchRuns } from '@/lib/api'

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await fetchRuns({ limit: 50 })
      setRuns(data.runs)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-[#0f172a] min-h-screen text-white transition-colors duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">All Requests</h1>
        <p className="text-slate-400 text-sm">Detailed view of your recent LLM API calls</p>
      </div>

      {/* Table Container */}
      <div className="bg-slate-800/70 border border-slate-700 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/60 border-b border-slate-700 sticky top-0 z-10">
              <tr>
                <Th>Time</Th>
                <Th>Model</Th>
                <Th>Tokens</Th>
                <Th>Cost (USD)</Th>
                <Th>Latency</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {runs.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={() => (window.location.href = `/runs/${r.id}`)}
                  className="cursor-pointer transition-all hover:bg-indigo-900/20 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                >
                  <Td>{new Date(r.created_at).toLocaleString()}</Td>
                  <Td className="font-medium text-indigo-300">{r.model}</Td>
                  <Td>{r.total_tokens.toLocaleString()}</Td>
                  <Td>${r.cost_usd.toFixed(5)}</Td>
                  <Td>{r.latency_ms} ms</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-300">
      {children}
    </th>
  )
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td
      className={`px-6 py-3 text-slate-300 whitespace-nowrap ${className}`}
    >
      {children}
    </td>
  )
}
