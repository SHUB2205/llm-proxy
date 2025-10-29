'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Dashboard() {
  const { isAuthenticated, userEmail, proxyKey, logout } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentRuns, setRecentRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(true)
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
      'all': 'All time'
    }
    return labels[timeRange] || 'Last 24 hours'
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-[#0f172a]'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'light' ? 'border-black' : 'border-indigo-500'}`}></div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Requests',
      value: stats?.last_24h?.total_requests || 0,
      subtitle: getTimeRangeLabel(),
      color: 'from-orange-500 to-amber-600',
      icon: '⚡',
    },
    {
      label: 'Flagged Requests',
      value: stats?.last_24h?.flagged_requests || 0,
      subtitle: 'Safety issues detected',
      color: 'from-red-500 to-pink-600',
      icon: '🚨',
    },
    {
      label: 'Total Cost',
      value: `$${(stats?.last_24h?.total_cost || 0).toFixed(4)}`,
      subtitle: `USD in ${getTimeRangeLabel().toLowerCase()}`,
      color: 'from-green-500 to-emerald-600',
      icon: '💰',
    },
    {
      label: 'Avg Latency',
      value: `${Math.round(stats?.last_24h?.avg_latency || 0)}ms`,
      subtitle: 'Average response time',
      color: 'from-orange-500 to-amber-600',
      icon: '⚡',
    },
  ]

  return (
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-[#0f172a] text-gray-100'}`}>
      {/* Welcome Banner with Logout */}
      {showWelcome && (
        <div className={`mb-6 rounded-2xl p-6 relative ${
          theme === 'light'
            ? 'bg-gray-50 border border-gray-200'
            : 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/50'
        }`}>
          <button
            onClick={() => setShowWelcome(false)}
            className={`absolute top-4 right-4 transition-colors ${
              theme === 'light' ? 'text-gray-400 hover:text-black' : 'text-gray-400 hover:text-white'
            }`}
            aria-label="Close welcome banner"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center justify-between pr-8">
            <div>
              <h2 className={`text-xl font-bold mb-1 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Welcome back!</h2>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                Logged in as <span className={`font-semibold ${theme === 'light' ? 'text-black' : 'text-indigo-300'}`}>{userEmail}</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded-xl transition-colors text-sm font-medium ${
                theme === 'light'
                  ? 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600'
                  : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300'
              }`}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold tracking-tight ${theme === 'light' ? 'text-black' : 'text-white'}`}>Dashboard</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Monitor your LLM usage in real-time</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div>
            <label className="text-sm text-gray-500 block mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`px-4 py-2 rounded-xl focus:outline-none focus:ring-2 ${
                theme === 'light'
                  ? 'bg-white border border-gray-300 text-black focus:ring-black'
                  : 'bg-slate-800 border border-slate-700 text-white focus:ring-indigo-500'
              }`}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Last updated</div>
            <div className={`text-lg font-semibold ${theme === 'light' ? 'text-black' : 'text-gray-100'}`}>
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 ${
              theme === 'light'
                ? 'bg-white border border-gray-200 hover:shadow-gray-200'
                : 'bg-slate-800/70 border border-slate-700 backdrop-blur-xl hover:shadow-indigo-500/10'
            }`}
          >
            {theme === 'dark' && <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`}></div>}
            <div className="relative flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-1">
                <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{stat.label}</div>
                {/*<span className="text-2xl">{stat.icon}</span>*/}
              </div>
              <div className={`text-4xl font-bold mb-1 ${theme === 'light' ? 'text-black' : 'text-white'}`}>{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className={`rounded-2xl shadow-lg overflow-hidden ${
        theme === 'light'
          ? 'bg-white border border-gray-200'
          : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'
      }`}>
        <div className={`p-6 flex items-center justify-between ${
          theme === 'light' ? 'border-b border-gray-200' : 'border-b border-slate-700'
        }`}>
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Recent Requests</h2>
            <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Your latest API calls</p>
          </div>
          
          <button
            onClick={() => router.push('/runs')}
            className={`px-4 py-2 rounded-xl transition-colors text-sm font-medium ${
              theme === 'light'
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            View all
          </button>
        </div>

        <div className={theme === 'light' ? 'divide-y divide-gray-200' : 'divide-y divide-slate-700'}>
          {recentRuns.length === 0 ? (
            <div className="p-8 text-center">
              <div className={theme === 'light' ? 'text-gray-600 mb-4' : 'text-gray-400 mb-4'}>
                No requests yet. Send a request using your proxy key.
              </div>
            </div>
          ) : (
            recentRuns.map((req) => (
              
              <div
                key={req.id}
                onClick={() => router.push(`/runs/${req.id}`)}
                className={`block p-5 transition-all group cursor-pointer ${
                  theme === 'light'
                    ? 'hover:bg-gray-50'
                    : 'hover:bg-gradient-to-r hover:from-indigo-900/30 hover:to-purple-900/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>{req.model}</div>
                    <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>{req.total_tokens}</div>
                      <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Tokens</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>{req.latency_ms}ms</div>
                      <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Latency</div>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      theme === 'light'
                        ? 'bg-gray-100 group-hover:bg-black'
                        : 'bg-slate-700 group-hover:bg-indigo-600'
                    }`}>
                      <span className={`${
                        theme === 'light'
                          ? 'text-gray-600 group-hover:text-white'
                          : 'text-gray-400 group-hover:text-white'
                      }`}>→</span>
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