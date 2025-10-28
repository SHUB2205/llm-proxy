'use client'

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
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe': return 'bg-green-900/20 border-green-500 text-green-300'
      case 'low': return 'bg-blue-900/20 border-blue-500 text-blue-300'
      case 'medium': return 'bg-yellow-900/20 border-yellow-500 text-yellow-300'
      case 'high': return 'bg-red-900/20 border-red-500 text-red-300'
      default: return 'bg-gray-900/20 border-gray-500 text-gray-300'
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
    <div className="mb-8 bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getRiskIcon(detection.risk_level)}</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Advanced Hallucination Detection</h2>
              <p className="text-gray-400 text-sm mt-1">Multi-layered AI safety analysis</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border ${getRiskColor(detection.risk_level)}`}>
            <div className="text-xs font-semibold uppercase">{detection.risk_level} Risk</div>
            <div className="text-lg font-bold">{(detection.risk_probability * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Explanation */}
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h3 className="font-semibold text-white mb-1">Analysis</h3>
              <p className="text-gray-300 text-sm">{detection.explanation}</p>
              <p className="text-gray-400 text-xs mt-2">
                Recommended Action: <span className="font-semibold text-indigo-400">{detection.action}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Checks Run */}
        <div>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span>🔍</span> Detection Methods Used
          </h3>
          <div className="flex flex-wrap gap-2">
            {detection.checks_run.map((check, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-indigo-900/30 border border-indigo-500/50 rounded-full text-xs text-indigo-300"
              >
                {check}
              </span>
            ))}
          </div>
        </div>

        {/* Issues Found */}
        {detection.issues_found.length > 0 && (
          <div>
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <span>⚠️</span> Issues Detected
            </h3>
            <div className="space-y-2">
              {detection.issues_found.map((issue, idx) => (
                <div key={idx} className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Semantic Entropy */}
          {detection.semantic_entropy && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span>🔬</span> Semantic Entropy
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Entropy Score:</span>
                  <span className={`font-semibold ${detection.semantic_entropy.suspicious ? 'text-red-400' : 'text-green-400'}`}>
                    {detection.semantic_entropy.semantic_entropy.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Clusters:</span>
                  <span className="text-gray-300">{detection.semantic_entropy.num_clusters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Consensus:</span>
                  <span className="text-gray-300">{(detection.semantic_entropy.consensus_strength * 100).toFixed(0)}%</span>
                </div>
                <p className="text-gray-400 text-xs mt-2 italic">
                  {detection.semantic_entropy.interpretation}
                </p>
              </div>
            </div>
          )}

          {/* Claims Analysis */}
          {detection.claims && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span>📋</span> Claim Verification
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Claims:</span>
                  <span className="text-gray-300">{detection.claims.num_claims}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Supported:</span>
                  <span className="text-green-400">{detection.claims.num_supported}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Contradicted:</span>
                  <span className="text-red-400">{detection.claims.num_contradicted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Unverifiable:</span>
                  <span className="text-yellow-400">{detection.claims.num_unverifiable}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-semibold">Support Rate:</span>
                    <span className={`font-bold ${detection.claims.support_rate >= 0.7 ? 'text-green-400' : 'text-red-400'}`}>
                      {(detection.claims.support_rate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LLM Judge */}
          {detection.llm_judge && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span>⚖️</span> LLM-as-Judge
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Factuality Score:</span>
                  <span className={`font-bold text-lg ${detection.llm_judge.factuality_score >= 7 ? 'text-green-400' : 'text-red-400'}`}>
                    {detection.llm_judge.factuality_score}/10
                  </span>
                </div>
                {detection.llm_judge.reasoning && (
                  <p className="text-gray-400 text-xs mt-2 italic">
                    {detection.llm_judge.reasoning}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Self-Consistency */}
          {detection.self_consistency && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span>🔄</span> Self-Consistency
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Consistency Score:</span>
                  <span className={`font-semibold ${detection.self_consistency.consistency_score >= 0.7 ? 'text-green-400' : 'text-red-400'}`}>
                    {(detection.self_consistency.consistency_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Variations Tested:</span>
                  <span className="text-gray-300">{detection.self_consistency.num_variations}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Individual Claims (Expandable) */}
        {detection.claims?.claims && detection.claims.claims.length > 0 && (
          <details className="bg-slate-900/30 rounded-lg border border-slate-700">
            <summary className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
              <span className="font-semibold text-white">View Individual Claims ({detection.claims.claims.length})</span>
            </summary>
            <div className="p-4 border-t border-slate-700 space-y-3">
              {detection.claims.claims.map((claim, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-gray-300 text-sm flex-1">{claim.claim}</p>
                    <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                      claim.verdict === 'supported' ? 'bg-green-900/30 text-green-400' :
                      claim.verdict === 'contradicted' ? 'bg-red-900/30 text-red-400' :
                      'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {claim.verdict}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Confidence: {(claim.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
