'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function DashboardPage() {
  const { isAuthenticated, proxyKey } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentRuns, setRecentRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24h')

  useEffect(() => {
    if (!isAuthenticated || !proxyKey) {
      router.push('/login')
      return
    }
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, proxyKey, timeRange])

  const loadData = async () => {
    if (!proxyKey) return

    try {
      const [statsData, runsData] = await Promise.all([
        axios.get(`${API_URL}/v1/stats?time_range=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        }),
        axios.get(`${API_URL}/v1/runs?limit=5`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        })
      ])
      setStats(statsData.data)
      setRecentRuns((runsData.data as any)?.runs || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeRangeLabel = () => {
    const labels: Record<string, string> = {
      '1h': 'Last hour',
      '24h': 'Last 24 hours',
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      all: 'All time'
    }
    return labels[timeRange] || 'Last 24 hours'
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-slate-950'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'light' ? 'border-blue-600' : 'border-blue-500'}`}></div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Requests',
      value: stats?.last_24h?.total_requests || 0,
      subtitle: getTimeRangeLabel(),
      color: 'blue',
      trend: '↑ 12% from yesterday',
      trendUp: true
    },
    {
      label: 'Flagged Requests',
      value: stats?.last_24h?.flagged_requests || 0,
      subtitle: 'Safety issues detected',
      color: 'red',
      trend: '0.5% of requests',
      trendUp: false
    },
    {
      label: 'Total Cost',
      value: `$${(stats?.last_24h?.total_cost || 0).toFixed(4)}`,
      subtitle: `USD in ${getTimeRangeLabel().toLowerCase()}`,
      color: 'emerald',
      trend: '↓ 8% optimized',
      trendUp: true
    },
    {
      label: 'Avg Latency',
      value: `${Math.round(stats?.last_24h?.avg_latency || 0)}ms`,
      subtitle: 'Average response time',
      color: 'amber',
      trend: 'P95: 890ms',
      trendUp: false
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      red: 'bg-red-500/10 border-red-500/20 text-red-400',
      emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'}`}>
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Dashboard</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Monitor your LLM agents in real-time</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className={`flex items-center gap-2 p-1 rounded-xl border ${
            theme === 'light'
              ? 'bg-white border-gray-200 shadow-sm'
              : 'bg-slate-900/50 border-white/10 backdrop-blur-sm'
          }`}>
            {['1h', '24h', '7d', '30d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? theme === 'light'
                      ? 'bg-slate-100 text-slate-900 shadow-sm'
                      : 'bg-white/10 text-white shadow-sm'
                    : theme === 'light'
                      ? 'text-gray-500 hover:text-slate-900 hover:bg-gray-50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {range === '1h' ? '1H' : range === '24h' ? '24H' : range === '7d' ? '7D' : range === '30d' ? '30D' : 'All'}
              </button>
            ))}
          </div>
          <div className="text-right ml-4 border-l pl-6 py-1 border-white/10 hidden sm:block">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Status</div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {statCards.map((stat, idx) => {
          const colorClasses = theme === 'dark'
            ? getColorClasses(stat.color)
            : 'bg-white border-gray-200 text-slate-900 shadow-sm'

          const trendColor = stat.trendUp ? 'text-emerald-500' : 'text-red-500'
          const lightTrendColor = stat.trendUp ? 'text-emerald-600' : 'text-red-600'

          return (
            <div
              key={idx}
              className={`rounded-xl p-5 border transition-all duration-300 hover:-translate-y-1 ${
                theme === 'dark' ? colorClasses : 'bg-white border-gray-200 hover:shadow-md'
              }`}
            >
              <div className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500 font-medium uppercase tracking-wider'}`}>
                {stat.label}
              </div>
              <div className={`text-3xl font-bold mb-2 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {stat.value}
              </div>
              <div className={`text-xs ${theme === 'dark' ? trendColor : lightTrendColor}`}>
                {stat.trend}
              </div>
            </div>
          )
        })}
      </div>

      <div className={`rounded-2xl overflow-hidden ${
        theme === 'light'
          ? 'bg-white border border-gray-200 shadow-sm'
          : 'bg-slate-900/50 backdrop-blur-sm border border-white/10 shadow-2xl shadow-blue-500/5'
      }`}>
        <div className={`p-6 flex items-center justify-between ${
          theme === 'light' ? 'border-b border-gray-200' : 'border-b border-white/5 bg-white/[0.02]'
        }`}>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Recent Requests</h2>
            <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Monitor your latest agent interactions</p>
          </div>

          <button
            onClick={() => router.push('/runs')}
            className={`px-4 py-2 rounded-full transition-all text-sm font-medium flex items-center gap-2 ${
              theme === 'light'
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20'
            }`}
          >
            View all logs
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className={theme === 'light' ? 'divide-y divide-gray-100' : 'divide-y divide-white/5'}>
          {recentRuns.length === 0 ? (
            <div className="p-12 text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
              }`}>
                <svg className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>No requests yet</h3>
              <p className={theme === 'light' ? 'text-gray-600 max-w-sm mx-auto' : 'text-gray-400 max-w-sm mx-auto'}>
                Integrate the proxy into your code to start seeing request logs, token usage, and hallucination alerts.
              </p>
            </div>
          ) : (
            recentRuns.map((req) => (
              <div
                key={req.id}
                onClick={() => router.push(`/runs/${req.id}`)}
                className={`block p-4 sm:p-5 transition-all group cursor-pointer ${
                  theme === 'light'
                    ? 'hover:bg-gray-50'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-blue-50 border border-blue-100 text-blue-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                          {req.model || 'Unknown Model'}
                        </span>
                        {req.status === 'flagged' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                            Flagged
                          </span>
                        )}
                        {req.status === 'success' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Safe
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(req.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-8 ml-14 sm:ml-0">
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`}>
                        {req.total_tokens?.toLocaleString() || 0}
                      </div>
                      <div className={`text-[10px] uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Tokens</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`}>
                        {req.latency_ms || 0}ms
                      </div>
                      <div className={`text-[10px] uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Latency</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-emerald-400'}`}>
                        ${(req.cost_usd || 0).toFixed(4)}
                      </div>
                      <div className={`text-[10px] uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Cost</div>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      theme === 'light'
                        ? 'bg-gray-100 group-hover:bg-slate-900 text-gray-400 group-hover:text-white'
                        : 'bg-white/5 group-hover:bg-blue-600 text-gray-500 group-hover:text-white'
                    }`}>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
