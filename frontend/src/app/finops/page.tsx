'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function FinOpsPage() {
  const { isAuthenticated, proxyKey } = useAuth()
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
        }).catch(() => null),
        axios.get(`${API_URL}/v1/finops/analytics/agents?organization_id=default`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        }).catch(() => null),
        axios.get(`${API_URL}/v1/finops/analytics/models?organization_id=default`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        }).catch(() => null),
        axios.get(`${API_URL}/v1/stats`, {
          headers: { 'Authorization': `Bearer ${proxyKey}` }
        }).catch(() => null),
      ])
      
      // If FinOps data exists, use it
      if (overviewRes?.data) {
        setOverview(overviewRes.data)
      } else if (statsRes?.data) {
        // Fallback: convert basic stats to FinOps format
        const stats = statsRes.data
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
      
      setAgents(agentsRes?.data)
    } catch (error) {
      console.error('Error fetching FinOps data:', error)
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
    <div className="pt-20 px-8 pb-16 min-h-screen bg-[#0f172a] text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI FinOps</h1>
          <p className="text-gray-400">Complete visibility into AI spend and usage</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6">
            <div className="text-sm text-gray-400 mb-1">Total Spend</div>
            <div className="text-3xl font-bold text-white">
              ${overview?.summary?.total_cost_usd?.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
          </div>
          
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6">
            <div className="text-sm text-gray-400 mb-1">Total Tokens</div>
            <div className="text-3xl font-bold text-white">
              {(overview?.summary?.total_tokens || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">Input + Output</div>
          </div>
          
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6">
            <div className="text-sm text-gray-400 mb-1">Total Calls</div>
            <div className="text-3xl font-bold text-white">
              {(overview?.summary?.total_calls || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">API requests</div>
          </div>
          
          <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6">
            <div className="text-sm text-gray-400 mb-1">Avg Cost/Call</div>
            <div className="text-3xl font-bold text-white">
              ${overview?.summary?.avg_cost_per_call?.toFixed(4) || '0.0000'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Per request</div>
          </div>
        </div>

        {/* Agent Breakdown */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Agent Spend Breakdown</h2>
          {agents && Object.keys(agents.agents || {}).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(agents.agents).map(([name, data]: [string, any]) => (
                <div key={name} className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-white">{name}</div>
                    <div className="text-green-400 font-bold">${data.cost?.toFixed(2)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Calls</div>
                      <div className="text-white font-medium">{data.calls?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Tokens</div>
                      <div className="text-white font-medium">{data.tokens?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Models</div>
                      <div className="text-white font-medium">{data.models_used?.join(', ')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No agent data yet. Start making requests to see agent breakdown.
            </div>
          )}
        </div>

        {/* Model Breakdown */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Model Spend Breakdown</h2>
          {models && Object.keys(models.models || {}).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(models.models).map(([name, data]: [string, any]) => (
                <div key={name} className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-white">{name}</div>
                    <div className="text-green-400 font-bold">${data.cost?.toFixed(2)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Calls</div>
                      <div className="text-white font-medium">{data.calls?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Input Tokens</div>
                      <div className="text-white font-medium">{data.input_tokens?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Output Tokens</div>
                      <div className="text-white font-medium">{data.output_tokens?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No model data yet. Start making requests to see model breakdown.
            </div>
          )}
        </div>

        {/* Optimization Opportunities */}
        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/50 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">💡 Optimization Opportunities</h2>
          {overview?.optimization?.opportunities_count > 0 ? (
            <div className="space-y-4">
              <div className="text-lg text-white">
                Found {overview.optimization.opportunities_count} opportunities to save{' '}
                <span className="text-green-400 font-bold">
                  ${overview.optimization.potential_savings_usd?.toFixed(2)}
                </span>
              </div>
              {overview.opportunities?.slice(0, 3).map((opp: any, idx: number) => (
                <div key={idx} className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">{opp.type}</div>
                      <div className="text-sm text-gray-300 mb-2">{opp.recommendation}</div>
                      <div className="text-green-400 font-bold">
                        Potential savings: ${opp.potential_savings?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No optimization opportunities yet. Keep using the platform to get recommendations.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
