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
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-500'
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-500'
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500'
      default: return 'text-blue-400 bg-blue-900/30 border-blue-500'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-400'
    if (score >= 0.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className={`pt-20 px-8 pb-16 min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-[#0f172a] text-gray-100'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Prompt Optimizer</h1>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Analyze and optimize your prompts for better reliability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className={`rounded-2xl shadow-lg p-6 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Your Prompt</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className={`w-full h-64 px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2 ${theme === 'light' ? 'bg-white border border-gray-300 text-black placeholder-gray-400 focus:ring-black' : 'bg-slate-900/50 border border-slate-600 text-white placeholder-gray-500 focus:ring-indigo-500'}`}
            />
            <button
              onClick={analyzePrompt}
              disabled={loading || !prompt.trim()}
              className={`mt-4 w-full px-6 py-3 text-white rounded-xl font-medium transition-colors ${theme === 'light' ? 'bg-black hover:bg-gray-800 disabled:bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600'}`}
            >
              {loading ? 'Analyzing...' : 'Analyze Prompt'}
            </button>
          </div>

          {/* Results Section */}
          <div className={`rounded-2xl shadow-lg p-6 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Analysis Results</h2>
            
            {!result ? (
              <div className={`flex items-center justify-center h-64 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                Enter a prompt and click "Analyze Prompt" to see results
              </div>
            ) : (
              <div className="space-y-6">
                {/* Reliability Score */}
                <div className={`rounded-lg p-4 ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
                  <div className="text-sm text-gray-400 mb-2">Reliability Score</div>
                  <div className={`text-5xl font-bold ${getScoreColor(result.reliability_score)}`}>
                    {(result.reliability_score * 100).toFixed(0)}%
                  </div>
                  <div className="mt-2 text-sm">
                    <span className={`font-semibold ${getScoreColor(result.reliability_score)}`}>
                      {result.assessment}
                    </span>
                  </div>
                </div>

                {/* Issues Found */}
                {result.issues_found && result.issues_found.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Issues Found</h3>
                    <div className="space-y-3">
                      {result.issues_found.map((issue: any, idx: number) => (
                        <div key={idx} className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}>
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div className="flex-1">
                              <div className="font-semibold mb-1">{issue.type}</div>
                              <div className="text-sm mb-2">{issue.description}</div>
                              <div className="text-sm opacity-90">
                                <strong>Suggestion:</strong> {issue.suggestion}
                              </div>
                              {issue.example && (
                                <div className={`mt-2 text-xs rounded p-2 ${theme === 'light' ? 'bg-gray-100' : 'bg-slate-950/50'}`}>
                                  <strong>Example:</strong> {issue.example}
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
                    <h3 className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Optimized Prompt</h3>
                    <div className={`rounded-lg p-4 ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
                      <pre className={`text-sm whitespace-pre-wrap ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>
                        {result.optimized_prompt}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(result.optimized_prompt)
                          alert('Copied to clipboard!')
                        }}
                        className={`mt-3 px-4 py-2 text-white rounded-lg text-sm transition-colors ${theme === 'light' ? 'bg-black hover:bg-gray-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                      >
                        Copy Optimized Prompt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Templates Section */}
        <div className={`mt-8 rounded-2xl shadow-lg p-6 ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-slate-800/70 backdrop-blur-xl border border-slate-700'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Pre-Built Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Factual Q&A', score: 92, desc: 'For fact-based questions' },
              { name: 'Data Analysis', score: 90, desc: 'For analyzing data' },
              { name: 'Decision Support', score: 88, desc: 'For making decisions' },
            ].map((template, idx) => (
              <div key={idx} className={`rounded-lg p-4 transition-colors cursor-pointer ${theme === 'light' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-slate-900/50 hover:bg-slate-900'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>{template.name}</div>
                  <div className="text-green-400 font-bold">{template.score}%</div>
                </div>
                <div className="text-sm text-gray-400">{template.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
