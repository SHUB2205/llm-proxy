'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function DriftPage() {
  const { isAuthenticated, proxyKey } = useAuth()
  const { theme } = useTheme()
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
      <div className={`flex items-center justify-center min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-950'}`}>
        <div className={`text-center p-8 rounded-2xl border max-w-md ${theme === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-white/[0.02] border-white/10 backdrop-blur-xl'}`}>
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
            <svg className={`w-8 h-8 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Authentication Required</h1>
          <p className={`mb-6 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>You need to be logged in to view drift detection</p>
          <button
            onClick={() => router.push('/login')}
            className={`w-full px-6 py-3 rounded-xl font-medium transition-all shadow-sm ${
              theme === 'light' 
                ? 'bg-slate-900 text-white hover:bg-slate-800' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20'
            }`}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-950'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'light' ? 'border-amber-600' : 'border-amber-500'}`}></div>
      </div>
    )
  }

  const severityColors = {
    critical: theme === 'light' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20',
    high: theme === 'light' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: theme === 'light' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: theme === 'light' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }

  return (
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'}`}>
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Drift Detection</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Monitor changes in LLM behavior over time</p>
        </div>
        <button
          onClick={checkDrift}
          disabled={checkingDrift}
          className={`px-6 py-3 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 ${
            theme === 'light' 
              ? 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-gray-200 disabled:text-gray-500' 
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none shadow-blue-900/20'
          }`}
        >
          {checkingDrift ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check Drift Now
            </>
          )}
        </button>
      </div>

      {/* Current Drift Check Result */}
      {currentDrift && (
        <div className={`mb-10 rounded-2xl p-6 border transition-all ${
          currentDrift.has_drift 
            ? (theme === 'light' ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-red-500/5 border-red-500/20 backdrop-blur-xl shadow-lg shadow-red-500/5')
            : (theme === 'light' ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-emerald-500/5 border-emerald-500/20 backdrop-blur-xl shadow-lg shadow-emerald-500/5')
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              currentDrift.has_drift
                ? (theme === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400')
                : (theme === 'light' ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400')
            }`}>
              {currentDrift.has_drift ? '⚠️' : '✅'}
            </div>
            <h2 className={`text-xl font-bold tracking-tight ${
              currentDrift.has_drift 
                ? (theme === 'light' ? 'text-red-700' : 'text-red-400')
                : (theme === 'light' ? 'text-emerald-700' : 'text-emerald-400')
            }`}>
              {currentDrift.has_drift ? 'Drift Detected!' : 'No Drift Detected'}
            </h2>
          </div>
          
          {currentDrift.has_drift && (
            <div className="space-y-4">
              <p className={`text-sm ${theme === 'light' ? 'text-red-800' : 'text-red-200/80'}`}>
                Found <strong>{currentDrift.drift_count}</strong> metric(s) with significant drift
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentDrift.drifts.map((drift: any, idx: number) => (
                  <div key={idx} className={`rounded-xl p-5 border ${
                    theme === 'light' ? 'bg-white border-red-100' : 'bg-slate-900/50 border-red-500/10'
                  }`}>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-current/10">
                      <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {drift.metric_name.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${severityColors[drift.severity as keyof typeof severityColors]}`}>
                        {drift.severity}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Baseline</div>
                        <div className={`font-mono font-medium ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`}>{drift.baseline_value.toFixed(4)}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Current</div>
                        <div className={`font-mono font-medium ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`}>{drift.current_value.toFixed(4)}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Change</div>
                        <div className={`font-mono font-bold ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>
                          {drift.change_percent > 0 ? '+' : ''}{drift.change_percent.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={`mt-6 pt-4 border-t text-xs ${
            currentDrift.has_drift
              ? (theme === 'light' ? 'border-red-200 text-red-600' : 'border-red-500/20 text-red-400/60')
              : (theme === 'light' ? 'border-emerald-200 text-emerald-600' : 'border-emerald-500/20 text-emerald-400/60')
          }`}>
            Sample size: <strong>{currentDrift.sample_size}</strong> requests
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Drifts"
          value={stats?.total_drifts || 0}
          color="blue"
          theme={theme}
        />
        <StatCard
          label="Critical Drifts"
          value={stats?.critical_drifts || 0}
          color="red"
          theme={theme}
        />
        <StatCard
          label="Last 24 Hours"
          value={stats?.recent_drifts_24h || 0}
          color="amber"
          theme={theme}
        />
        <StatCard
          label="High Severity"
          value={stats?.high_drifts || 0}
          color="fuchsia"
          theme={theme}
        />
      </div>

      {/* Drift by Metric */}
      {stats?.drift_by_metric && Object.keys(stats.drift_by_metric).length > 0 && (
        <div className={`rounded-2xl p-6 mb-10 transition-all ${
          theme === 'light' 
            ? 'bg-white border border-gray-200 shadow-sm' 
            : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              theme === 'light' ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Drift by Metric</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.drift_by_metric).map(([metric, count]: [string, any]) => (
              <div key={metric} className={`rounded-xl p-4 border transition-all ${
                theme === 'light' 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-slate-900/50 border-white/5 hover:border-white/10'
              }`}>
                <div className={`text-[10px] uppercase tracking-wider mb-2 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                  {metric.replace(/_/g, ' ')}
                </div>
                <div className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drift Details Modal */}
      {selectedDrift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border ${
            theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900 border-white/10'
          }`}>
            {/* Modal Header */}
            <div className={`px-6 py-5 border-b flex items-center justify-between flex-shrink-0 ${
              theme === 'light' ? 'border-gray-200 bg-gray-50/50' : 'border-white/10 bg-white/[0.02]'
            }`}>
              <div>
                <h2 className={`text-xl font-bold tracking-tight mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Drift Details</h2>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{selectedDrift.metric_name.replace(/_/g, ' ')}</p>
              </div>
              <button
                onClick={() => setSelectedDrift(null)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'light' ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Severity Badge */}
              <div className="flex items-center gap-3 mb-6">
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Severity</span>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${severityColors[selectedDrift.severity as keyof typeof severityColors]}`}>
                  {selectedDrift.severity}
                </span>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`rounded-xl p-4 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-950/50 border-white/5'}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Baseline Value</div>
                  <div className={`text-2xl font-mono font-medium tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedDrift.baseline_value.toFixed(4)}</div>
                </div>
                <div className={`rounded-xl p-4 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-950/50 border-white/5'}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Current Value</div>
                  <div className={`text-2xl font-mono font-medium tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedDrift.current_value.toFixed(4)}</div>
                </div>
                <div className={`rounded-xl p-4 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-950/50 border-white/5'}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Drift Score</div>
                  <div className={`text-2xl font-mono font-bold tracking-tight ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>{(selectedDrift.drift_score * 100).toFixed(1)}%</div>
                </div>
                <div className={`rounded-xl p-4 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-950/50 border-white/5'}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Direction</div>
                  <div className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {selectedDrift.details?.direction === 'increase' ? '📈' : '📉'} {selectedDrift.details?.direction || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className={`rounded-xl border overflow-hidden mb-6 ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
                <div className={`flex justify-between items-center px-4 py-3 border-b text-sm ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900/30 border-white/5'}`}>
                  <span className={theme === 'light' ? 'text-gray-500 font-medium' : 'text-gray-400'}>Model</span>
                  <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedDrift.model}</span>
                </div>
                <div className={`flex justify-between items-center px-4 py-3 border-b text-sm ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-950/30 border-white/5'}`}>
                  <span className={theme === 'light' ? 'text-gray-500 font-medium' : 'text-gray-400'}>Detected At</span>
                  <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{new Date(selectedDrift.created_at).toLocaleString()}</span>
                </div>
                <div className={`flex justify-between items-center px-4 py-3 border-b text-sm ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900/30 border-white/5'}`}>
                  <span className={theme === 'light' ? 'text-gray-500 font-medium' : 'text-gray-400'}>Change Percentage</span>
                  <span className={`font-bold font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {selectedDrift.current_value > selectedDrift.baseline_value ? '+' : ''}
                    {(((selectedDrift.current_value - selectedDrift.baseline_value) / selectedDrift.baseline_value) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className={`flex justify-between items-center px-4 py-3 text-sm ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-950/30'}`}>
                  <span className={theme === 'light' ? 'text-gray-500 font-medium' : 'text-gray-400'}>Alert Sent</span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    selectedDrift.alert_sent 
                      ? (theme === 'light' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                      : (theme === 'light' ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-white/5 text-gray-400 border-white/10')
                  }`}>
                    {selectedDrift.alert_sent ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Recommendation */}
              <div className={`rounded-xl p-5 border ${
                theme === 'light' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-blue-900/10 border-blue-500/20'
              }`}>
                <h3 className={`text-[10px] uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5 ${
                  theme === 'light' ? 'text-blue-700' : 'text-blue-400'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recommendation
                </h3>
                <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-blue-900' : 'text-blue-100'}`}>
                  {selectedDrift.severity === 'critical' && 'Immediate action required. This drift indicates a significant change in model behavior.'}
                  {selectedDrift.severity === 'high' && 'Review your recent changes and consider resetting the baseline if this is expected.'}
                  {selectedDrift.severity === 'medium' && 'Monitor this metric closely. Consider investigating if the trend continues.'}
                  {selectedDrift.severity === 'low' && 'Minor drift detected. Continue monitoring but no immediate action needed.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end flex-shrink-0 ${
              theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-white/10'
            }`}>
              <button
                onClick={() => setSelectedDrift(null)}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
                  theme === 'light' 
                    ? 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-50 hover:text-slate-900' 
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drift History */}
      <div className={`rounded-2xl transition-all ${
        theme === 'light' 
          ? 'bg-white border border-gray-200 shadow-sm' 
          : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
      }`}>
        <div className={`p-6 border-b flex items-center justify-between ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Drift History</h2>
            <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Recent drift detections</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-white/5 text-gray-400'
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className={theme === 'light' ? 'divide-y divide-gray-100' : 'divide-y divide-white/5'}>
          {history.length === 0 ? (
            <div className={`p-16 text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="font-medium mb-1">No drift detected yet</p>
              <p className="text-sm">Run "Check Drift Now" to start monitoring.</p>
            </div>
          ) : (
            history.map((drift) => (
              <div key={drift.id} className={`p-5 transition-all ${
                theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className={`font-semibold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {drift.metric_name.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${severityColors[drift.severity as keyof typeof severityColors]}`}>
                        {drift.severity}
                      </span>
                    </div>
                    <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Model: <span className="font-medium">{drift.model}</span> • {new Date(drift.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 sm:gap-8 ml-0 sm:ml-auto">
                    <div className="text-right">
                      <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Drift Score</div>
                      <div className={`text-xl font-bold font-mono tracking-tight ${
                        drift.severity === 'critical' || drift.severity === 'high' 
                          ? (theme === 'light' ? 'text-red-600' : 'text-red-400')
                          : (theme === 'light' ? 'text-amber-600' : 'text-amber-400')
                      }`}>
                        {(drift.drift_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDrift(drift)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        theme === 'light' 
                          ? 'bg-white border border-gray-200 text-slate-700 shadow-sm hover:bg-gray-50' 
                          : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Details
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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

function StatCard({ label, value, color, theme }: any) {
  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      red: 'bg-red-500/10 border-red-500/20 text-red-400',
      amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
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
