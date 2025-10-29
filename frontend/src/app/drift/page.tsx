'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function DriftPage() {
  const { isAuthenticated, proxyKey } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [currentDrift, setCurrentDrift] = useState<any>(null)
  const [checkingDrift, setCheckingDrift] = useState(false)
  const [selectedDrift, setSelectedDrift] = useState<any>(null)

  useEffect(() => {
    if (isAuthenticated && proxyKey) {
      loadData()
    }
  }, [isAuthenticated, proxyKey])

  const loadData = async () => {
    if (!proxyKey) return
    
    try {
      const [statsRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/v1/drift/stats`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        }),
        axios.get(`${API_URL}/v1/drift/history?limit=20`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        })
      ])
      
      setStats(statsRes.data)
      setHistory((historyRes.data as any).history || [])
    } catch (error) {
      console.error('Error loading drift data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkDrift = async () => {
    if (!proxyKey) return
    
    setCheckingDrift(true)
    try {
      const res = await axios.get(`${API_URL}/v1/drift/check`, {
        headers: { 'Authorization': `Bearer ${proxyKey}` }
      })
      setCurrentDrift(res.data)
      
      // Reload history to show new detections
      await loadData()
    } catch (error) {
      console.error('Error checking drift:', error)
    } finally {
      setCheckingDrift(false)
    }
  }

  if (!isAuthenticated || !proxyKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">🔒 Please Log In</h1>
          <p className="text-gray-400 mb-4">You need to be logged in to view drift detection</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  const severityColors = {
    critical: 'bg-red-900/30 text-red-300 border-red-500',
    high: 'bg-orange-900/30 text-orange-300 border-orange-500',
    medium: 'bg-yellow-900/30 text-yellow-300 border-yellow-500',
    low: 'bg-blue-900/30 text-blue-300 border-blue-500'
  }

  return (
    <div className="pt-20 px-8 pb-16 min-h-screen bg-[#0f172a] text-gray-100">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Drift Detection</h1>
          <p className="text-gray-400">Monitor changes in LLM behavior over time</p>
        </div>
        <button
          onClick={checkDrift}
          disabled={checkingDrift}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors"
        >
          {checkingDrift ? 'Checking...' : 'Check Drift Now'}
        </button>
      </div>

      {/* Current Drift Check Result */}
      {currentDrift && (
        <div className={`mb-8 rounded-2xl p-6 border ${
          currentDrift.has_drift 
            ? 'bg-red-900/20 border-red-500/50' 
            : 'bg-green-900/20 border-green-500/50'
        }`}>
          <h2 className="text-2xl font-bold text-white mb-4">
            {currentDrift.has_drift ? '⚠️ Drift Detected!' : '✅ No Drift Detected'}
          </h2>
          
          {currentDrift.has_drift && (
            <div className="space-y-4">
              <p className="text-gray-300">
                Found {currentDrift.drift_count} metric(s) with significant drift
              </p>
              
              {currentDrift.drifts.map((drift: any, idx: number) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{drift.metric_name}</span>
                    <span className={`px-3 py-1 rounded-full text-sm border ${severityColors[drift.severity as keyof typeof severityColors]}`}>
                      {drift.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Baseline</div>
                      <div className="text-white font-semibold">{drift.baseline_value.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Current</div>
                      <div className="text-white font-semibold">{drift.current_value.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Change</div>
                      <div className="text-red-400 font-semibold">
                        {drift.change_percent > 0 ? '+' : ''}{drift.change_percent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-400">
            Sample size: {currentDrift.sample_size} requests
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Drifts"
          value={stats?.total_drifts || 0}
          icon="📊"
          color="from-indigo-500 to-blue-600"
        />
        <StatCard
          label="Critical Drifts"
          value={stats?.critical_drifts || 0}
          icon="🚨"
          color="from-red-500 to-pink-600"
        />
        <StatCard
          label="Last 24 Hours"
          value={stats?.recent_drifts_24h || 0}
          icon="⏰"
          color="from-orange-500 to-amber-600"
        />
        <StatCard
          label="High Severity"
          value={stats?.high_drifts || 0}
          icon="⚠️"
          color="from-yellow-500 to-orange-600"
        />
      </div>

      {/* Drift by Metric */}
      {stats?.drift_by_metric && Object.keys(stats.drift_by_metric).length > 0 && (
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Drift by Metric</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.drift_by_metric).map(([metric, count]: [string, any]) => (
              <div key={metric} className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">{metric.replace(/_/g, ' ')}</div>
                <div className="text-2xl font-bold text-white">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drift Details Modal */}
      {selectedDrift && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Drift Details</h2>
                <p className="text-sm text-gray-400">{selectedDrift.metric_name.replace(/_/g, ' ')}</p>
              </div>
              <button
                onClick={() => setSelectedDrift(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Severity Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Severity:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${severityColors[selectedDrift.severity as keyof typeof severityColors]}`}>
                  {selectedDrift.severity.toUpperCase()}
                </span>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Baseline Value</div>
                  <div className="text-2xl font-bold text-white">{selectedDrift.baseline_value.toFixed(4)}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Current Value</div>
                  <div className="text-2xl font-bold text-white">{selectedDrift.current_value.toFixed(4)}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Drift Score</div>
                  <div className="text-2xl font-bold text-red-400">{(selectedDrift.drift_score * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Change Direction</div>
                  <div className="text-2xl font-bold text-white">
                    {selectedDrift.details?.direction === 'increase' ? '📈' : '📉'} {selectedDrift.details?.direction || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Model</span>
                  <span className="text-white font-semibold">{selectedDrift.model}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Detected At</span>
                  <span className="text-white font-semibold">{new Date(selectedDrift.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Change Percentage</span>
                  <span className="text-white font-semibold">
                    {selectedDrift.current_value > selectedDrift.baseline_value ? '+' : ''}
                    {(((selectedDrift.current_value - selectedDrift.baseline_value) / selectedDrift.baseline_value) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Alert Sent</span>
                  <span className={`px-2 py-1 rounded text-xs ${selectedDrift.alert_sent ? 'bg-green-900/30 text-green-300' : 'bg-gray-900/30 text-gray-400'}`}>
                    {selectedDrift.alert_sent ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-indigo-300 mb-2">💡 Recommendation</h3>
                <p className="text-sm text-gray-300">
                  {selectedDrift.severity === 'critical' && 'Immediate action required. This drift indicates a significant change in model behavior.'}
                  {selectedDrift.severity === 'high' && 'Review your recent changes and consider resetting the baseline if this is expected.'}
                  {selectedDrift.severity === 'medium' && 'Monitor this metric closely. Consider investigating if the trend continues.'}
                  {selectedDrift.severity === 'low' && 'Minor drift detected. Continue monitoring but no immediate action needed.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedDrift(null)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drift History */}
      <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Drift History</h2>
          <p className="text-sm text-gray-400 mt-1">Recent drift detections</p>
        </div>

        <div className="divide-y divide-slate-700">
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No drift detected yet. Run "Check Drift Now" to start monitoring.
            </div>
          ) : (
            history.map((drift) => (
              <div key={drift.id} className="p-5 hover:bg-slate-900/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-white">{drift.metric_name.replace(/_/g, ' ')}</span>
                      <span className={`px-2 py-1 rounded text-xs border ${severityColors[drift.severity as keyof typeof severityColors]}`}>
                        {drift.severity}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Model: {drift.model} • {new Date(drift.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Drift Score</div>
                      <div className="text-xl font-bold text-red-400">
                        {(drift.drift_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDrift(drift)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      View Details
                    </button>
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

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-800/70 border border-slate-700 backdrop-blur-xl p-6 shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`}></div>
      <div className="relative flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm text-gray-400">{label}</div>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="text-4xl font-bold text-white mb-1">{value}</div>
      </div>
    </div>
  )
}
