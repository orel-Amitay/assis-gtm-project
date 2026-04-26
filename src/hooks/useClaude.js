import { useState, useRef, useCallback } from 'react'

const API_URL = ''

// Auto-clear old Anthropic keys from localStorage
const storedRaw = localStorage.getItem('assis-api-key')
if (storedRaw && storedRaw.startsWith('sk-ant-')) {
  localStorage.removeItem('assis-api-key')
}

export function useClaude() {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const abortRef = useRef(null)

  const run = useCallback(async (prompt) => {
    setOutput('')
    setError(null)
    setDone(false)
    setLoading(true)

    // Get API key from localStorage if set there
    const storedKey = localStorage.getItem('assis-api-key') || undefined

    try {
      const resp = await fetch(`${API_URL}/api/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey: storedKey }),
      })

      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        if (j.error === 'NO_KEY') {
          setError('NO_KEY')
        } else {
          setError(j.error || 'Server error')
        }
        setLoading(false)
        return
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))
          if (data.error) {
            setError(data.error)
            setLoading(false)
            return
          }
          if (data.done) {
            setDone(true)
            setLoading(false)
            return
          }
          if (data.text) {
            setOutput(prev => prev + data.text)
          }
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setOutput('')
    setError(null)
    setDone(false)
    setLoading(false)
  }, [])

  return { output, loading, error, done, run, reset }
}

export async function saveApiKey(key) {
  // Save to localStorage for client use
  localStorage.setItem('assis-api-key', key)
  // Also save to server .env
  try {
    await fetch(`${API_URL}/api/save-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key }),
    })
  } catch {}
}

export async function checkKeyStatus() {
  const local = localStorage.getItem('assis-api-key')
  if (local) return { configured: true, masked: `sk-ant-...${local.slice(-4)}` }
  try {
    const resp = await fetch(`${API_URL}/api/key-status`)
    return await resp.json()
  } catch {
    return { configured: false }
  }
}
