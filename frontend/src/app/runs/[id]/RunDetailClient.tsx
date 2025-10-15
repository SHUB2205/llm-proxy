'use client'
import { useEffect, useState } from 'react'
import { fetchRun } from '@/lib/api'

export default function RunDetailClient({ id }: { id: string }) {
  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRun = async () => {
      const data = await fetchRun(id)
      setRun(data)
      setLoading(false)
    }
    loadRun()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="p-8 text-gray-400 bg-[#0f172a] min-h-screen">
        <p>Run not found.</p>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen bg-[#0f172a] text-gray-100">
      <h1 className="text-4xl font-bold mb-6 text-white">Run Details</h1>

      <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6">
        <dl className="space-y-4">
          <DetailItem label="Run ID" value={run.id} />
          <DetailItem label="Model" value={run.model} />
          <DetailItem label="Total Tokens" value={run.total_tokens} />
          <DetailItem label="Cost (USD)" value={`$${run.cost_usd.toFixed(5)}`} />
          <DetailItem label="Latency" value={`${run.latency_ms} ms`} />
          <DetailItem
            label="Created At"
            value={new Date(run.created_at).toLocaleString()}
          />
        </dl>
      </div>

      {run?.payloads?.length > 0 && (
        <div className="mt-8 bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Payload</h2>
          <pre className="bg-slate-900/50 p-4 rounded-lg text-sm overflow-auto text-gray-300">
            {JSON.stringify(run.payloads[0], null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-slate-700 pb-2">
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  )
}
