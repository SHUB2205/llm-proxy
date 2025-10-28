'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function DetectionSettingsPage() {
  const router = useRouter()
  const { proxyKey, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [selectedMode, setSelectedMode] = useState('balanced')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !proxyKey) {
      router.push('/login')
      return
    }
    loadConfig()
  }, [proxyKey])

  const loadConfig = async () => {
    if (!proxyKey) return

    try {
      const response = await axios.get(`${API_URL}/v1/detection/config`, {
        headers: { 'Authorization': `Bearer ${proxyKey}` }
      })
      setConfig(response.data)
      setSelectedMode(response.data.mode)
    } catch (err) {
      console.error('Error loading config:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!proxyKey) return

    setSaving(true)
    setMessage('')

    try {
      await axios.post(
        `${API_URL}/v1/detection/config`,
        { mode: selectedMode },
        { headers: { 'Authorization': `Bearer ${proxyKey}` } }
      )
      setMessage('✅ Detection mode updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error saving config:', err)
      setMessage('❌ Failed to update detection mode')
    } finally {
      setSaving(false)
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
    <div className="p-8 min-h-screen bg-[#0f172a] text-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/settings')}
          className="text-indigo-400 hover:text-indigo-300 mb-6 flex items-center gap-2"
        >
          ← Back to Settings
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Advanced Detection Settings</h1>
          <p className="text-gray-400">Configure hallucination detection modes and thresholds</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.startsWith('✅') ? 'bg-green-900/20 border border-green-500 text-green-300' : 'bg-red-900/20 border border-red-500 text-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Detection Modes */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Detection Mode</h2>
            <p className="text-gray-400 text-sm mt-1">Choose the detection mode that best fits your needs</p>
          </div>

          <div className="p-6 space-y-4">
            {config?.available_modes.map((mode: string) => (
              <div
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMode === mode
                    ? 'border-indigo-500 bg-indigo-900/20'
                    : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMode === mode ? 'border-indigo-500' : 'border-slate-600'
                    }`}>
                      {selectedMode === mode && (
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white capitalize">{mode} Mode</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {config?.mode_descriptions[mode]}
                      </p>
                    </div>
                  </div>
                  {mode === 'balanced' && (
                    <span className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                      RECOMMENDED
                    </span>
                  )}
                </div>

                {/* Mode Details */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {mode === 'fast' && (
                      <>
                        <div>
                          <span className="text-gray-400">Speed:</span>
                          <span className="text-green-400 font-semibold ml-2">~200ms</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Checks:</span>
                          <span className="text-gray-300 ml-2">Semantic Entropy</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Accuracy:</span>
                          <span className="text-yellow-400 font-semibold ml-2">Good</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Use Case:</span>
                          <span className="text-gray-300 ml-2">Real-time apps</span>
                        </div>
                      </>
                    )}
                    {mode === 'balanced' && (
                      <>
                        <div>
                          <span className="text-gray-400">Speed:</span>
                          <span className="text-blue-400 font-semibold ml-2">~2-3s</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Checks:</span>
                          <span className="text-gray-300 ml-2">Entropy + NLI + Judge</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Accuracy:</span>
                          <span className="text-green-400 font-semibold ml-2">Excellent</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Use Case:</span>
                          <span className="text-gray-300 ml-2">Production (90% accuracy)</span>
                        </div>
                      </>
                    )}
                    {mode === 'thorough' && (
                      <>
                        <div>
                          <span className="text-gray-400">Speed:</span>
                          <span className="text-orange-400 font-semibold ml-2">~5-7s</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Checks:</span>
                          <span className="text-gray-300 ml-2">All + Self-Consistency</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Accuracy:</span>
                          <span className="text-green-400 font-semibold ml-2">Maximum</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Use Case:</span>
                          <span className="text-gray-300 ml-2">Critical applications</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-slate-700 bg-slate-900/30">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Detection Mode'}
            </button>
          </div>
        </div>

        {/* Current Configuration */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Current Configuration</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-gray-400 mb-1">Semantic Entropy</div>
                <div className={`font-semibold ${config?.current_config.use_semantic_entropy ? 'text-green-400' : 'text-red-400'}`}>
                  {config?.current_config.use_semantic_entropy ? '✅ Enabled' : '❌ Disabled'}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-gray-400 mb-1">Claim-Level NLI</div>
                <div className={`font-semibold ${config?.current_config.use_claim_nli ? 'text-green-400' : 'text-red-400'}`}>
                  {config?.current_config.use_claim_nli ? '✅ Enabled' : '❌ Disabled'}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-gray-400 mb-1">LLM-as-Judge</div>
                <div className={`font-semibold ${config?.current_config.use_llm_judge ? 'text-green-400' : 'text-red-400'}`}>
                  {config?.current_config.use_llm_judge ? '✅ Enabled' : '❌ Disabled'}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-gray-400 mb-1">Self-Consistency</div>
                <div className={`font-semibold ${config?.current_config.use_self_consistency ? 'text-green-400' : 'text-red-400'}`}>
                  {config?.current_config.use_self_consistency ? '✅ Enabled' : '❌ Disabled'}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
              <h3 className="font-semibold text-white mb-2">📊 Detection Thresholds</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Entropy Threshold:</span>
                  <span className="text-gray-300 font-mono">{config?.current_config.entropy_threshold}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Claim Support Threshold:</span>
                  <span className="text-gray-300 font-mono">{config?.current_config.claim_support_threshold}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-900/20 border border-blue-500/30 rounded-xl">
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
            <span>💡</span> About Advanced Detection
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Our advanced hallucination detection system uses multiple state-of-the-art techniques including 
            Semantic Entropy (Nature 2024), Claim-level NLI verification, LLM-as-Judge evaluation, and 
            Self-Consistency checking. The system achieved <strong>90% accuracy</strong> on comprehensive 
            test suites with diverse hallucination scenarios.
          </p>
        </div>
      </div>
    </div>
  )
}
