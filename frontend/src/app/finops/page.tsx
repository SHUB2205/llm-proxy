'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function FinOpsPage() {
  const { isAuthenticated, proxyKey } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<any>(null)
  const [agents, setAgents] = useState<any>(null)
  const [models, setModels] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated || !proxyKey) {
      router.push('/login')
      return
    }
    loadData()
  }, [isAuthenticated, proxyKey])

  const loadData = async () => {
    if (!proxyKey) return
    
    try {
      // Try to fetch FinOps data, fallback to basic stats
      const [overviewRes, agentsRes, modelsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/v1/finops/dashboard/overview?organization_id=default&period=30d`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        }).catch(() => null as any),
        axios.get(`${API_URL}/v1/finops/analytics/agents?organization_id=default`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        }).catch(() => null as any),
        axios.get(`${API_URL}/v1/finops/analytics/models?organization_id=default`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        }).catch(() => null as any),
        axios.get(`${API_URL}/v1/stats`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        }).catch(() => null as any),
      ])
      
      // If FinOps data exists, use it
      if (overviewRes && overviewRes.data) {
        setOverview(overviewRes.data)
      } else if (statsRes && statsRes.data) {
        // Fallback: convert basic stats to FinOps format
        const stats = statsRes.data as any
        setOverview({
          summary: {
            total_cost_usd: stats.last_24h?.total_cost || 0,
            total_tokens: stats.last_24h?.total_tokens || 0,
            total_calls: stats.last_24h?.total_requests || 0,
            avg_cost_per_call: stats.last_24h?.total_requests > 0 
              ? (stats.last_24h?.total_cost || 0) / stats.last_24h.total_requests 
              : 0
          },
          optimization: {
            opportunities_count: 0,
            potential_savings_usd: 0
          }
        })
        
        // Convert model stats to FinOps format
        if (stats.by_model && stats.by_model.length > 0) {
          const modelData: any = {}
          stats.by_model.forEach((m: any) => {
            modelData[m.model] = {
              cost: m.cost || 0,
              calls: m.count || 0,
              input_tokens: Math.floor((m.tokens || 0) * 0.4), // Estimate
              output_tokens: Math.floor((m.tokens || 0) * 0.6)
            }
          })
          setModels({ models: modelData })
        }
      }
      
      if (agentsRes && agentsRes.data) {
        setAgents(agentsRes.data)
      }
    } catch (error) {
      console.error('Error fetching FinOps data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-950'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'light' ? 'border-emerald-600' : 'border-emerald-500'}`}></div>
      </div>
    )
  }

  return (
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className={`text-4xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>AI FinOps</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Complete visibility into AI spend and usage</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className={`rounded-xl p-5 border transition-all hover:-translate-y-1 ${
            theme === 'light' 
              ? 'bg-white border-gray-200 shadow-sm hover:shadow-md' 
              : 'bg-emerald-500/10 border-emerald-500/20'
          }`}>
            <div className={`text-xs mb-2 font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-emerald-400/80'}`}>Total Spend</div>
            <div className={`text-3xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-emerald-400'}`}>
              ${overview?.summary?.total_cost_usd?.toFixed(2) || '0.00'}
            </div>
            <div className={`text-xs mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-emerald-400/60'}`}>Last 30 days</div>
          </div>
          
          <div className={`rounded-xl p-5 border transition-all hover:-translate-y-1 ${
            theme === 'light' 
              ? 'bg-white border-gray-200 shadow-sm hover:shadow-md' 
              : 'bg-blue-500/10 border-blue-500/20'
          }`}>
            <div className={`text-xs mb-2 font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-blue-400/80'}`}>Total Tokens</div>
            <div className={`text-3xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-blue-400'}`}>
              {(overview?.summary?.total_tokens || 0).toLocaleString()}
            </div>
            <div className={`text-xs mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-blue-400/60'}`}>Input + Output</div>
          </div>
          
          <div className={`rounded-xl p-5 border transition-all hover:-translate-y-1 ${
            theme === 'light' 
              ? 'bg-white border-gray-200 shadow-sm hover:shadow-md' 
              : 'bg-cyan-500/10 border-cyan-500/20'
          }`}>
            <div className={`text-xs mb-2 font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-cyan-400/80'}`}>Total Calls</div>
            <div className={`text-3xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-cyan-400'}`}>
              {(overview?.summary?.total_calls || 0).toLocaleString()}
            </div>
            <div className={`text-xs mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-cyan-400/60'}`}>API requests</div>
          </div>
          
          <div className={`rounded-xl p-5 border transition-all hover:-translate-y-1 ${
            theme === 'light' 
              ? 'bg-white border-gray-200 shadow-sm hover:shadow-md' 
              : 'bg-fuchsia-500/10 border-fuchsia-500/20'
          }`}>
            <div className={`text-xs mb-2 font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-500' : 'text-fuchsia-400/80'}`}>Avg Cost/Call</div>
            <div className={`text-3xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-fuchsia-400'}`}>
              ${overview?.summary?.avg_cost_per_call?.toFixed(4) || '0.0000'}
            </div>
            <div className={`text-xs mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-fuchsia-400/60'}`}>Per request</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Agent Breakdown */}
          <div className={`rounded-2xl p-6 transition-all ${
            theme === 'light' 
              ? 'bg-white border border-gray-200 shadow-sm' 
              : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                theme === 'light' ? 'bg-cyan-50 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Agent Spend</h2>
            </div>

            {agents && Object.keys(agents.agents || {}).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(agents.agents).map(([name, data]: [string, any]) => (
                  <div key={name} className={`rounded-xl p-5 border ${
                    theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-white/5'
                  }`}>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-current/10">
                      <div className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{name}</div>
                      <div className={`font-mono font-bold ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>
                        ${data.cost?.toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Calls</div>
                        <div className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`}>{data.calls?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Tokens</div>
                        <div className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`}>{data.tokens?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Models</div>
                        <div className={`font-medium truncate ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`} title={data.models_used?.join(', ')}>
                          {data.models_used?.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                  <svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                No agent data yet. Start making requests to see agent breakdown.
              </div>
            )}
          </div>

          {/* Model Breakdown */}
          <div className={`rounded-2xl p-6 transition-all ${
            theme === 'light' 
              ? 'bg-white border border-gray-200 shadow-sm' 
              : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/20 text-blue-400'
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Model Spend</h2>
            </div>

            {models && Object.keys(models.models || {}).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(models.models).map(([name, data]: [string, any]) => (
                  <div key={name} className={`rounded-xl p-5 border ${
                    theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-white/5'
                  }`}>
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-current/10">
                      <div className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{name}</div>
                      <div className={`font-mono font-bold ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>
                        ${data.cost?.toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Calls</div>
                        <div className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`}>{data.calls?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Input Tokens</div>
                        <div className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`}>{data.input_tokens?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Output Tokens</div>
                        <div className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-gray-200'}`}>{data.output_tokens?.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'}`}>
                  <svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                No model data yet. Start making requests to see model breakdown.
              </div>
            )}
          </div>
        </div>

        {/* Optimization Opportunities */}
        <div className={`rounded-2xl p-6 transition-all ${
          theme === 'light' 
            ? 'bg-emerald-50 border border-emerald-200 shadow-sm' 
            : 'bg-emerald-900/10 backdrop-blur-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              theme === 'light' ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              <span className="text-lg">💡</span>
            </div>
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-emerald-900' : 'text-emerald-400'}`}>
              Optimization Opportunities
            </h2>
          </div>

          {overview?.optimization?.opportunities_count > 0 ? (
            <div className="space-y-4">
              <div className={`text-sm mb-4 ${theme === 'light' ? 'text-emerald-800' : 'text-emerald-200/80'}`}>
                Found <strong>{overview.optimization.opportunities_count}</strong> opportunities to save{' '}
                <span className={`font-bold ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  ${overview.optimization.potential_savings_usd?.toFixed(2)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {overview.opportunities?.slice(0, 3).map((opp: any, idx: number) => (
                  <div key={idx} className={`rounded-xl p-5 border ${
                    theme === 'light' ? 'bg-white border-emerald-100' : 'bg-emerald-950/50 border-emerald-500/10'
                  }`}>
                    <div className={`font-bold mb-2 tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      {opp.type}
                    </div>
                    <div className={`text-sm mb-4 leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                      {opp.recommendation}
                    </div>
                    <div className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg inline-block ${
                      theme === 'light' ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      Save ${opp.potential_savings?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`text-center py-8 ${theme === 'light' ? 'text-emerald-700/60' : 'text-emerald-400/60'}`}>
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${
                theme === 'light' ? 'bg-emerald-100' : 'bg-emerald-500/10'
              }`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              No optimization opportunities yet. Keep using the platform to get recommendations.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
