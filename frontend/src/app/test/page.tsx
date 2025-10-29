'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function TestPage() {
  const { isAuthenticated, proxyKey } = useAuth()
  const router = useRouter()
  const [prompt, setPrompt] = useState('What is the capital of France?')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isAuthenticated || !proxyKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">🔒 Please Log In</h1>
          <p className="text-gray-400 mb-4">You need to be logged in to test requests</p>
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

  const sendRequest = async () => {
    if (!proxyKey) {
      setError('No proxy key found')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch(`${API_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${proxyKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }

      const data = await res.json()
      setResponse(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-20 px-8 pb-16 min-h-screen bg-[#0f172a] text-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Test Request</h1>
        <p className="text-gray-400 mb-8">Send a test request to see advanced detection in action</p>

        {/* Input */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            rows={4}
            placeholder="Enter your prompt here..."
          />
          
          <button
            onClick={sendRequest}
            disabled={loading || !prompt}
            className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            {loading ? '⏳ Sending...' : '🚀 Send Request'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-red-300 mb-2">❌ Error</h2>
            <pre className="text-sm text-red-200 whitespace-pre-wrap font-mono">{error}</pre>
          </div>
        )}

        {/* Response */}
        {response && (
          <>
            {/* Answer */}
            <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">💬 Response</h2>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-gray-200 whitespace-pre-wrap">
                  {response.choices?.[0]?.message?.content || 'No response'}
                </p>
              </div>
            </div>

            {/* Advanced Detection */}
            {response.observability?.advanced_detection && (
              <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-xl rounded-2xl shadow-lg border border-indigo-500/50 p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">🔬 Advanced Hallucination Detection</h2>
                
                {(() => {
                  const adv = response.observability.advanced_detection
                  const riskColors = {
                    safe: 'text-green-400',
                    low: 'text-blue-400',
                    medium: 'text-yellow-400',
                    high: 'text-red-400'
                  }
                  const riskBgs = {
                    safe: 'bg-green-900/30 border-green-500/50',
                    low: 'bg-blue-900/30 border-blue-500/50',
                    medium: 'bg-yellow-900/30 border-yellow-500/50',
                    high: 'bg-red-900/30 border-red-500/50'
                  }
                  
                  return (
                    <>
                      {/* Risk Level */}
                      <div className={`${riskBgs[adv.risk_level as keyof typeof riskBgs]} border rounded-lg p-4 mb-4`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-400">Risk Level</div>
                            <div className={`text-2xl font-bold ${riskColors[adv.risk_level as keyof typeof riskColors]}`}>
                              {adv.risk_level.toUpperCase()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Probability</div>
                            <div className="text-2xl font-bold text-white">
                              {(adv.risk_probability * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                        <div className="text-sm font-semibold text-gray-400 mb-2">Explanation</div>
                        <p className="text-gray-200">{adv.explanation}</p>
                      </div>

                      {/* Action */}
                      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                        <div className="text-sm font-semibold text-gray-400 mb-2">Recommended Action</div>
                        <p className="text-gray-200">{adv.action}</p>
                      </div>

                      {/* Issues */}
                      {adv.issues_found && adv.issues_found.length > 0 && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                          <div className="text-sm font-semibold text-red-300 mb-2">⚠️ Issues Found</div>
                          <ul className="list-disc list-inside text-red-200 space-y-1">
                            {adv.issues_found.map((issue: string, i: number) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Claims Analysis */}
                      {adv.claims && (
                        <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                          <div className="text-sm font-semibold text-gray-400 mb-3">📋 Claims Analysis</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500">Total Claims</div>
                              <div className="text-xl font-bold text-white">{adv.claims.num_claims}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Support Rate</div>
                              <div className="text-xl font-bold text-green-400">
                                {(adv.claims.support_rate * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Supported</div>
                              <div className="text-lg font-semibold text-green-400">{adv.claims.num_supported}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Contradicted</div>
                              <div className="text-lg font-semibold text-red-400">{adv.claims.num_contradicted}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Semantic Entropy */}
                      {adv.semantic_entropy && (
                        <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                          <div className="text-sm font-semibold text-gray-400 mb-2">🔬 Semantic Entropy</div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-500">Entropy Score</div>
                              <div className="text-lg font-bold text-white">
                                {adv.semantic_entropy.semantic_entropy?.toFixed(4)}
                              </div>
                            </div>
                            <div>
                              {adv.semantic_entropy.suspicious ? (
                                <span className="px-3 py-1 bg-yellow-900/30 border border-yellow-500/50 rounded-full text-yellow-300 text-sm">
                                  ⚠️ Suspicious
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-green-900/30 border border-green-500/50 rounded-full text-green-300 text-sm">
                                  ✅ Normal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* LLM Judge */}
                      {adv.llm_judge && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <div className="text-sm font-semibold text-gray-400 mb-2">⚖️ LLM Judge</div>
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-xs text-gray-500">Factuality Score</div>
                              <div className="text-2xl font-bold text-white">
                                {adv.llm_judge.factuality_score}/10
                              </div>
                            </div>
                            {adv.llm_judge.reasoning && (
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">Reasoning</div>
                                <p className="text-sm text-gray-300">{adv.llm_judge.reasoning}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}

            {/* Raw JSON */}
            <details className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 p-6">
              <summary className="text-lg font-bold text-white cursor-pointer mb-4">
                🔍 Raw Response (JSON)
              </summary>
              <pre className="text-xs text-gray-300 overflow-auto max-h-96 bg-slate-900/50 rounded-lg p-4 font-mono">
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          </>
        )}
      </div>
    </div>
  )
}
