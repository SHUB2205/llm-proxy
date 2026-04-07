'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function DetectionSettingsPage() {
  const router = useRouter()
  const { proxyKey, isAuthenticated } = useAuth()
  const { theme } = useTheme()
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
  }, [proxyKey, isAuthenticated, router])

  const loadConfig = async () => {
    if (!proxyKey) return

    try {
      const response = await axios.get(`${API_URL}/v1/detection/config`, {
        headers: { 'Authorization': `Bearer ${proxyKey}` }
      })
      const data = response.data as any
      setConfig(data)
      setSelectedMode(data.mode)
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
      <div className={`flex items-center justify-center min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-950'}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'light' ? 'border-blue-600' : 'border-blue-500'}`}></div>
      </div>
    )
  }

  return (
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/settings')}
          className={`mb-6 flex items-center gap-2 text-sm font-medium transition-colors ${
            theme === 'light' ? 'text-gray-500 hover:text-slate-900' : 'text-gray-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Settings
        </button>

        <div className="mb-10">
          <h1 className={`text-4xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Detection Settings</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Configure hallucination detection modes and thresholds</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 transition-all ${
            message.startsWith('✅') 
              ? (theme === 'light' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400')
              : (theme === 'light' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-red-500/10 border border-red-500/20 text-red-400')
          }`}>
            <span className="font-medium text-sm">{message}</span>
          </div>
        )}

        {/* Detection Modes */}
        <div className={`rounded-2xl overflow-hidden mb-8 transition-all ${
          theme === 'light' 
            ? 'bg-white border border-gray-200 shadow-sm' 
            : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
        }`}>
          <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/20 text-blue-400'
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Detection Mode</h2>
                <p className={`text-sm mt-0.5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Choose the detection mode that best fits your needs</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {config?.available_modes.map((mode: string) => (
              <div
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMode === mode
                    ? (theme === 'light' ? 'border-blue-600 bg-blue-50' : 'border-blue-500 bg-blue-900/10')
                    : (theme === 'light' ? 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50' : 'border-white/10 bg-slate-900/30 hover:border-white/20 hover:bg-white/5')
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                      selectedMode === mode 
                        ? (theme === 'light' ? 'border-[6px] border-blue-600' : 'border-[6px] border-blue-500')
                        : (theme === 'light' ? 'border-2 border-gray-300' : 'border-2 border-slate-600')
                    }`}></div>
                    <div>
                      <h3 className={`text-lg font-bold tracking-tight capitalize ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{mode} Mode</h3>
                      <p className={`text-sm mt-1 leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {config?.mode_descriptions[mode]}
                      </p>
                    </div>
                  </div>
                  {mode === 'balanced' && (
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border self-start ${
                      theme === 'light' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      RECOMMENDED
                    </span>
                  )}
                </div>

                {/* Mode Details */}
                <div className={`mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm ${
                  selectedMode === mode
                    ? (theme === 'light' ? 'border-blue-200' : 'border-blue-500/20')
                    : (theme === 'light' ? 'border-gray-200' : 'border-white/10')
                }`}>
                  {mode === 'fast' && (
                    <>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Speed:</span>
                        <span className={theme === 'light' ? 'text-emerald-600 font-semibold' : 'text-emerald-400 font-semibold'}>~200ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Checks:</span>
                        <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Semantic Entropy</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Accuracy:</span>
                        <span className={theme === 'light' ? 'text-amber-600 font-semibold' : 'text-amber-400 font-semibold'}>Good</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Use Case:</span>
                        <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Real-time apps</span>
                      </div>
                    </>
                  )}
                  {mode === 'balanced' && (
                    <>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Speed:</span>
                        <span className={theme === 'light' ? 'text-blue-600 font-semibold' : 'text-blue-400 font-semibold'}>~2-3s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Checks:</span>
                        <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Entropy + NLI + Judge</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Accuracy:</span>
                        <span className={theme === 'light' ? 'text-emerald-600 font-semibold' : 'text-emerald-400 font-semibold'}>Excellent</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Use Case:</span>
                        <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Production</span>
                      </div>
                    </>
                  )}
                  {mode === 'thorough' && (
                    <>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Speed:</span>
                        <span className={theme === 'light' ? 'text-orange-600 font-semibold' : 'text-orange-400 font-semibold'}>~5-7s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Checks:</span>
                        <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>All + Consistency</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Accuracy:</span>
                        <span className={theme === 'light' ? 'text-fuchsia-600 font-semibold' : 'text-fuchsia-400 font-semibold'}>Maximum</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Use Case:</span>
                        <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Critical apps</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={`p-6 border-t flex justify-end ${theme === 'light' ? 'border-gray-200 bg-gray-50/50' : 'border-white/5 bg-slate-900/30'}`}>
            <button
              onClick={saveConfig}
              disabled={saving}
              className={`px-8 py-3 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 min-w-[200px] ${
                theme === 'light' 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-gray-300 disabled:text-gray-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none shadow-blue-900/20'
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Detection Mode'}
            </button>
          </div>
        </div>

        {/* Current Configuration */}
        <div className={`rounded-2xl overflow-hidden mb-8 transition-all ${
          theme === 'light' 
            ? 'bg-white border border-gray-200 shadow-sm' 
            : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
        }`}>
          <div className={`p-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-white/5'}`}>
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Active Configuration</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div className={`rounded-xl p-4 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-white/5'}`}>
                <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Semantic Entropy</div>
                <div className={`font-semibold flex items-center gap-1.5 ${config?.current_config.use_semantic_entropy ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'light' ? 'text-gray-400' : 'text-gray-500')}`}>
                  {config?.current_config.use_semantic_entropy ? '✓ Enabled' : '✕ Disabled'}
                </div>
              </div>

              <div className={`rounded-xl p-4 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-white/5'}`}>
                <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Claim-Level NLI</div>
                <div className={`font-semibold flex items-center gap-1.5 ${config?.current_config.use_claim_nli ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'light' ? 'text-gray-400' : 'text-gray-500')}`}>
                  {config?.current_config.use_claim_nli ? '✓ Enabled' : '✕ Disabled'}
                </div>
              </div>

              <div className={`rounded-xl p-4 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-white/5'}`}>
                <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>LLM-as-Judge</div>
                <div className={`font-semibold flex items-center gap-1.5 ${config?.current_config.use_llm_judge ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'light' ? 'text-gray-400' : 'text-gray-500')}`}>
                  {config?.current_config.use_llm_judge ? '✓ Enabled' : '✕ Disabled'}
                </div>
              </div>

              <div className={`rounded-xl p-4 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-white/5'}`}>
                <div className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Self-Consistency</div>
                <div className={`font-semibold flex items-center gap-1.5 ${config?.current_config.use_self_consistency ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'light' ? 'text-gray-400' : 'text-gray-500')}`}>
                  {config?.current_config.use_self_consistency ? '✓ Enabled' : '✕ Disabled'}
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-5 border ${
              theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/10 border-blue-500/20'
            }`}>
              <h3 className={`text-[10px] uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5 ${
                theme === 'light' ? 'text-blue-700' : 'text-blue-400'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Detection Thresholds
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-3 border-b border-current/10">
                  <span className={`font-medium ${theme === 'light' ? 'text-blue-900' : 'text-blue-100'}`}>Entropy Threshold:</span>
                  <span className={`font-mono font-bold ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>{config?.current_config.entropy_threshold}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${theme === 'light' ? 'text-blue-900' : 'text-blue-100'}`}>Claim Support Threshold:</span>
                  <span className={`font-mono font-bold ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>{config?.current_config.claim_support_threshold}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className={`rounded-xl p-6 border transition-all ${
          theme === 'light' 
            ? 'bg-slate-50 border-gray-200' 
            : 'bg-slate-900/50 border-white/5'
        }`}>
          <h3 className={`text-sm font-bold tracking-tight mb-2 flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <span className="text-amber-500">💡</span> About Advanced Detection
          </h3>
          <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            Our advanced hallucination detection system uses multiple state-of-the-art techniques including 
            Semantic Entropy (Nature 2024), Claim-level NLI verification, LLM-as-Judge evaluation, and 
            Self-Consistency checking. The system achieved <strong className={theme === 'light' ? 'text-slate-900 font-semibold' : 'text-white font-semibold'}>90% accuracy</strong> on comprehensive 
            test suites with diverse hallucination scenarios.
          </p>
        </div>
      </div>
    </div>
  )
}
