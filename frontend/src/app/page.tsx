'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:8000'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recentRuns, setRecentRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [statsData, runsData] = await Promise.all([
        axios.get(`${API_URL}/v1/stats`),
        axios.get(`${API_URL}/v1/runs?limit=5`)
      ])
      setStats(statsData.data)
      const runs = (runsData.data as { runs: any[] }).runs || []
      setRecentRuns(runs)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <DashboardSkeleton />

  const statCards = [
    {
      label: 'Total Requests',
      value: stats?.last_24h?.total_requests || 0,
      subtitle: 'Last 24 hours',
      color: 'from-indigo-500 to-blue-600',
      change: '+12%',
    },
    {
      label: 'Total Tokens',
      value: (stats?.last_24h?.total_tokens || 0).toLocaleString(),
      subtitle: 'Tokens processed',
      color: 'from-purple-500 to-fuchsia-600',
      change: '+8%',
    },
    {
      label: 'Total Cost',
      value: `$${(stats?.last_24h?.total_cost || 0).toFixed(4)}`,
      subtitle: 'USD in last 24h',
      color: 'from-green-500 to-emerald-600',
      change: '-5%',
    },
    {
      label: 'Avg Latency',
      value: `${Math.round(stats?.last_24h?.avg_latency || 0)}ms`,
      subtitle: 'Average response time',
      color: 'from-orange-500 to-amber-600',
      change: '+3%',
    },
  ]

  return (
    <div className="p-8 pb-16 min-h-screen bg-[#0f172a] text-gray-100 transition-colors duration-500">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-400">Monitor your LLM usage in real-time</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last updated</div>
          <div className="text-lg font-semibold text-gray-100">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-slate-800/70 border border-slate-700 backdrop-blur-xl p-6 shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`}></div>
            <div className="relative flex flex-col justify-between h-full">
              <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
              <div className="text-4xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">{stat.subtitle}</div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    stat.change.startsWith('+')
                      ? 'bg-green-900/30 text-green-300'
                      : 'bg-red-900/30 text-red-300'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Recent Requests</h2>
            <p className="text-sm text-gray-400 mt-1">
              Your latest API calls
            </p>
          </div>
          <a
            href="/runs"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            View all
          </a>
        </div>

        <div className="divide-y divide-slate-700">
          {recentRuns.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No requests yet. Send one via the proxy to populate this section.
            </div>
          ) : (
            recentRuns.map((req, idx) => (
              <a
                key={req.id}
                href={`/runs/${req.id}`}
                className="block p-5 hover:bg-gradient-to-r hover:from-indigo-900/30 hover:to-purple-900/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">
                      {req.model}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <InfoBox label="Tokens" value={`${req.total_tokens}`} />
                    <InfoBox label="Latency" value={`${req.latency_ms}ms`} />
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                      <span className="text-gray-400 group-hover:text-white">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-sm font-semibold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  )
}
