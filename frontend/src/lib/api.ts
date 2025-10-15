const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function fetchRuns(params: Record<string, string | number> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString()
  const res = await fetch(`${API_URL}/v1/runs?${query}`)
  if (!res.ok) throw new Error('Failed to fetch runs')
  return res.json()
}

export async function fetchRun(id: string) {
  const res = await fetch(`${API_URL}/v1/runs/${id}`)
  if (!res.ok) throw new Error('Failed to fetch run')
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/v1/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}
