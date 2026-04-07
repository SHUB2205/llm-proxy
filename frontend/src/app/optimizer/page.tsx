'use client'
import { useState } from 'react'
import axios from 'axios'
import { useTheme } from '@/contexts/ThemeContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function OptimizerPage() {
  const { theme } = useTheme()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const analyzePrompt = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/v1/reliability/analyze-prompt`, {
        prompt: prompt
      })
      setResult(response.data)
    } catch (error) {
      console.error('Error analyzing prompt:', error)
      alert('Error analyzing prompt. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme === 'light' ? 'text-red-700 bg-red-50 border-red-200' : 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'high': return theme === 'light' ? 'text-orange-700 bg-orange-50 border-orange-200' : 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'medium': return theme === 'light' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      default: return theme === 'light' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'
    if (score >= 0.5) return theme === 'light' ? 'text-amber-600' : 'text-amber-400'
    return theme === 'light' ? 'text-red-600' : 'text-red-400'
  }

  return (
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : 'bg-slate-950 text-gray-100'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className={`text-4xl font-bold tracking-tight mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Prompt Optimizer</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Analyze and optimize your prompts for better reliability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Your Prompt</h2>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here to analyze it for reliability, clarity, and potential hallucinations..."
              className={`w-full h-64 px-4 py-3 rounded-xl resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                theme === 'light' 
                  ? 'bg-gray-50 border border-gray-200 text-slate-900 placeholder-gray-400 hover:border-gray-300' 
                  : 'bg-slate-900/50 border border-white/10 text-white placeholder-gray-600 hover:border-white/20'
              }`}
            />
            <button
              onClick={analyzePrompt}
              disabled={loading || !prompt.trim()}
              className={`mt-4 w-full px-6 py-3 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 ${
                theme === 'light' 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-gray-200 disabled:text-gray-400' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none shadow-blue-900/20'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Prompt...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Analyze Prompt
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className={`rounded-2xl p-6 transition-all ${
            theme === 'light' 
              ? 'bg-white border border-gray-200 shadow-sm' 
              : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                theme === 'light' ? 'bg-fuchsia-50 text-fuchsia-600' : 'bg-fuchsia-500/20 text-fuchsia-400'
              }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Analysis Results</h2>
            </div>
            
            {!result ? (
              <div className={`flex flex-col items-center justify-center h-64 text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  theme === 'light' ? 'bg-gray-50' : 'bg-white/5'
                }`}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p>Enter a prompt and click Analyze to see reliability score,<br/>potential issues, and an optimized version.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Reliability Score */}
                <div className={`rounded-xl p-5 border flex items-center justify-between ${
                  theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-white/10'
                }`}>
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Reliability Score
                    </div>
                    <div className="mt-1 text-sm">
                      <span className={`font-semibold ${getScoreColor(result.reliability_score)}`}>
                        {result.assessment}
                      </span>
                    </div>
                  </div>
                  <div className={`text-5xl font-bold tracking-tight ${getScoreColor(result.reliability_score)}`}>
                    {(result.reliability_score * 100).toFixed(0)}%
                  </div>
                </div>

                {/* Issues Found */}
                {result.issues_found && result.issues_found.length > 0 && (
                  <div>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Issues Found</h3>
                    <div className="space-y-3">
                      {result.issues_found.map((issue: any, idx: number) => (
                        <div key={idx} className={`border rounded-xl p-4 transition-all ${getSeverityColor(issue.severity)}`}>
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <div className="font-bold mb-1 tracking-tight">{issue.type}</div>
                              <div className="text-sm mb-3 opacity-90">{issue.description}</div>
                              <div className="text-sm border-t border-current/20 pt-2 mt-2 opacity-90">
                                <strong className="font-semibold uppercase text-[10px] tracking-wider block mb-1">Suggestion</strong> 
                                {issue.suggestion}
                              </div>
                              {issue.example && (
                                <div className={`mt-3 text-xs rounded-lg p-3 font-mono border border-current/20 ${theme === 'light' ? 'bg-white/50' : 'bg-black/20'}`}>
                                  {issue.example}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimized Prompt */}
                {result.optimized_prompt && (
                  <div>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Optimized Prompt</h3>
                    <div className={`rounded-xl border overflow-hidden ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-white/10'}`}>
                      <div className={`px-4 py-2 border-b flex items-center justify-between ${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-white/[0.02] border-white/10'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className={`text-xs font-mono ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>optimized.txt</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(result.optimized_prompt)
                            alert('Copied to clipboard!')
                          }}
                          className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                            theme === 'light' ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-white/10 text-gray-400'
                          }`}
                        >
                          Copy
                        </button>
                      </div>
                      <pre className={`p-4 text-sm whitespace-pre-wrap font-mono ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
                        {result.optimized_prompt}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Templates Section */}
        <div className={`mt-8 rounded-2xl p-6 transition-all ${
          theme === 'light' 
            ? 'bg-white border border-gray-200 shadow-sm' 
            : 'bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-lg'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              theme === 'light' ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Pre-Built Templates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Factual Q&A', score: 92, desc: 'Forces citations and prevents hallucination' },
              { name: 'Data Analysis', score: 90, desc: 'Strict formatting with step-by-step reasoning' },
              { name: 'Decision Support', score: 88, desc: 'Requires considering alternative perspectives' },
            ].map((template, idx) => (
              <div key={idx} className={`rounded-xl p-5 transition-all border cursor-pointer ${
                theme === 'light' 
                  ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' 
                  : 'bg-slate-900/50 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{template.name}</div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-md ${
                    theme === 'light' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {template.score}%
                  </div>
                </div>
                <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{template.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
