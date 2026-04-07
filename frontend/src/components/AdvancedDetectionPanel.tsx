'use client'

import { useTheme } from '@/contexts/ThemeContext'

interface AdvancedDetectionProps {
  detection: {
    risk_level: string
    risk_probability: number
    action: string
    explanation: string
    checks_run: string[]
    issues_found: string[]
    semantic_entropy?: {
      semantic_entropy: number
      suspicious: boolean
      num_clusters: number
      consensus_strength: number
      interpretation: string
    }
    claims?: {
      num_claims: number
      num_supported: number
      num_contradicted: number
      num_unverifiable: number
      support_rate: number
      claims?: Array<{
        claim: string
        verdict: string
        confidence: number
      }>
    }
    llm_judge?: {
      factuality_score: number
      reasoning: string
    }
    self_consistency?: {
      consistency_score: number
      num_variations: number
    }
  }
}

export default function AdvancedDetectionPanel({ detection }: AdvancedDetectionProps) {
  const { theme } = useTheme()

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe': return theme === 'light' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
      case 'low': return theme === 'light' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
      case 'medium': return theme === 'light' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      case 'high': return theme === 'light' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-500/10 border-red-500/20 text-red-400'
      default: return theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'safe': return '✅'
      case 'low': return '🟢'
      case 'medium': return '⚠️'
      case 'high': return '🚨'
      default: return '❓'
    }
  }

  return (
    <div className={`mb-10 rounded-2xl overflow-hidden transition-all ${
      theme === 'light' 
        ? 'bg-white border border-gray-200 shadow-sm' 
        : 'bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-lg'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        theme === 'light' ? 'border-gray-200 bg-gray-50/50' : 'border-white/5'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            theme === 'light' ? 'bg-white shadow-sm border border-gray-100' : 'bg-white/5'
          }`}>
            {getRiskIcon(detection.risk_level)}
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Advanced Detection</h2>
            <p className={`text-sm mt-0.5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Multi-layered AI safety analysis</p>
          </div>
        </div>
        <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-4 ${getRiskColor(detection.risk_level)}`}>
          <div className="text-xs font-bold uppercase tracking-wider">{detection.risk_level} Risk</div>
          <div className="text-xl font-bold font-mono">{(detection.risk_probability * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Explanation */}
        <div className={`rounded-xl p-5 border ${
          theme === 'light' ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-950/50 border-white/5'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>Analysis</h3>
              <p className={`text-sm leading-relaxed mb-3 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{detection.explanation}</p>
              <div className={`text-xs inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                theme === 'light' ? 'bg-white border-blue-200 text-blue-800' : 'bg-blue-900/20 border-blue-500/30 text-blue-300'
              }`}>
                <span className="font-semibold uppercase tracking-wider opacity-80">Recommended Action:</span>
                <span className="font-bold">{detection.action}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checks Run */}
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Detection Methods Used
          </h3>
          <div className="flex flex-wrap gap-2">
            {detection.checks_run.map((check, idx) => (
              <span
                key={idx}
                className={`px-3 py-1.5 border rounded-lg text-xs font-semibold tracking-wide ${
                  theme === 'light' 
                    ? 'bg-white border-gray-200 text-slate-700 shadow-sm' 
                    : 'bg-white/5 border-white/10 text-gray-300'
                }`}
              >
                {check}
              </span>
            ))}
          </div>
        </div>

        {/* Issues Found */}
        {detection.issues_found.length > 0 && (
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Issues Detected
            </h3>
            <div className="space-y-2">
              {detection.issues_found.map((issue, idx) => (
                <div key={idx} className={`rounded-xl p-4 border flex items-start gap-3 ${
                  theme === 'light' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-500/10 border-red-500/20 text-red-300'
                }`}>
                  <span className="text-lg leading-none flex-shrink-0">⚠️</span>
                  <p className="text-sm font-medium">{issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Semantic Entropy */}
          {detection.semantic_entropy && (
            <div className={`rounded-xl p-5 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-950/50 border-white/5'}`}>
              <h4 className={`font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                <span className="text-xl">🔬</span> Semantic Entropy
              </h4>
              <div className="space-y-3 text-sm">
                <div className={`flex justify-between items-center pb-2 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
                  <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Entropy Score:</span>
                  <span className={`font-mono font-bold ${detection.semantic_entropy.suspicious ? (theme === 'light' ? 'text-red-600' : 'text-red-400') : (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400')}`}>
                    {detection.semantic_entropy.semantic_entropy.toFixed(4)}
                  </span>
                </div>
                <div className={`flex justify-between items-center pb-2 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
                  <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Clusters:</span>
                  <span className={`font-bold ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>{detection.semantic_entropy.num_clusters}</span>
                </div>
                <div className={`flex justify-between items-center pb-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
                  <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Consensus:</span>
                  <span className={`font-bold font-mono ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>{(detection.semantic_entropy.consensus_strength * 100).toFixed(0)}%</span>
                </div>
                <p className={`text-xs italic leading-relaxed pt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {detection.semantic_entropy.interpretation}
                </p>
              </div>
            </div>
          )}

          {/* Claims Analysis */}
          {detection.claims && (
            <div className={`rounded-xl p-5 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-950/50 border-white/5'}`}>
              <h4 className={`font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                <span className="text-xl">📋</span> Claim Verification
              </h4>
              <div className="space-y-3 text-sm">
                <div className={`flex justify-between items-center pb-2 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
                  <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Total Claims:</span>
                  <span className={`font-bold ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>{detection.claims.num_claims}</span>
                </div>
                <div className={`flex justify-between items-center pb-2 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
                  <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Supported:</span>
                  <span className={`font-bold ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>{detection.claims.num_supported}</span>
                </div>
                <div className={`flex justify-between items-center pb-2 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
                  <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Contradicted:</span>
                  <span className={`font-bold ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>{detection.claims.num_contradicted}</span>
                </div>
                <div className={`flex justify-between items-center pb-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
                  <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Unverifiable:</span>
                  <span className={`font-bold ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>{detection.claims.num_unverifiable}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className={`text-xs uppercase tracking-wider font-bold ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Support Rate:</span>
                  <span className={`font-bold font-mono text-lg ${detection.claims.support_rate >= 0.7 ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'light' ? 'text-red-600' : 'text-red-400')}`}>
                    {(detection.claims.support_rate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* LLM Judge */}
          {detection.llm_judge && (
            <div className={`rounded-xl p-5 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-950/50 border-white/5'}`}>
              <h4 className={`font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                <span className="text-xl">⚖️</span> LLM-as-Judge
              </h4>
              <div className="space-y-4 text-sm">
                <div className={`flex justify-between items-center pb-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
                  <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Factuality Score:</span>
                  <span className={`font-bold font-mono text-2xl ${detection.llm_judge.factuality_score >= 7 ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'light' ? 'text-red-600' : 'text-red-400')}`}>
                    {detection.llm_judge.factuality_score}/10
                  </span>
                </div>
                {detection.llm_judge.reasoning && (
                  <div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold block mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Reasoning</span>
                    <p className={`text-sm leading-relaxed italic ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                      "{detection.llm_judge.reasoning}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Self-Consistency */}
          {detection.self_consistency && (
            <div className={`rounded-xl p-5 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-950/50 border-white/5'}`}>
              <h4 className={`font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                <span className="text-xl">🔄</span> Self-Consistency
              </h4>
              <div className="space-y-3 text-sm">
                <div className={`flex justify-between items-center pb-3 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
                  <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Consistency Score:</span>
                  <span className={`font-bold font-mono text-2xl ${detection.self_consistency.consistency_score >= 0.7 ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'light' ? 'text-red-600' : 'text-red-400')}`}>
                    {(detection.self_consistency.consistency_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Variations Tested:</span>
                  <span className={`font-bold px-3 py-1 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200 text-slate-700' : 'bg-slate-900 border-white/10 text-gray-300'}`}>
                    {detection.self_consistency.num_variations} runs
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Individual Claims (Expandable) */}
        {detection.claims?.claims && detection.claims.claims.length > 0 && (
          <details className={`rounded-xl border overflow-hidden transition-all group ${
            theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/10'
          }`}>
            <summary className={`p-4 cursor-pointer flex items-center justify-between outline-none ${
              theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-white/5 text-gray-400'
                }`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className={`font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>View Individual Claims ({detection.claims.claims.length})</span>
              </div>
              <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className={`p-5 border-t space-y-3 ${
              theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/5 bg-slate-950/50'
            }`}>
              {detection.claims.claims.map((claim, idx) => (
                <div key={idx} className={`rounded-xl p-4 border transition-all ${
                  theme === 'light' ? 'bg-white border-gray-200 shadow-sm hover:shadow-md' : 'bg-slate-900/80 border-white/5 hover:border-white/10'
                }`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className={`text-sm font-medium leading-relaxed flex-1 ${theme === 'light' ? 'text-slate-800' : 'text-gray-200'}`}>{claim.claim}</p>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
                      claim.verdict === 'supported' 
                        ? (theme === 'light' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20') :
                      claim.verdict === 'contradicted' 
                        ? (theme === 'light' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20') :
                      (theme === 'light' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')
                    }`}>
                      {claim.verdict}
                    </span>
                  </div>
                  <div className={`text-xs font-mono px-2 py-1 rounded inline-block ${
                    theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-black/30 text-gray-400'
                  }`}>
                    Confidence: <span className={theme === 'light' ? 'text-slate-900 font-semibold' : 'text-white font-semibold'}>{(claim.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
