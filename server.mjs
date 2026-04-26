import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const GEMINI_MODEL = 'gemini-2.5-flash'

function getApiKey(reqKey) {
  if (reqKey) return reqKey
  try {
    const envPath = join(__dirname, '.env')
    if (existsSync(envPath)) {
      const env = readFileSync(envPath, 'utf8')
      const match = env.match(/GOOGLE_API_KEY=(.+)/)
      if (match) return match[1].trim()
    }
  } catch {}
  return null
}

app.post('/api/save-key', (req, res) => {
  const { apiKey } = req.body
  if (!apiKey) return res.status(400).json({ error: 'No API key provided' })
  try {
    writeFileSync(join(__dirname, '.env'), `GOOGLE_API_KEY=${apiKey}\n`)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/key-status', (req, res) => {
  const key = getApiKey(null)
  res.json({ configured: !!key, masked: key ? `...${key.slice(-4)}` : null })
})

// Gemini streaming via direct fetch — no SDK
app.post('/api/claude', async (req, res) => {
  const { prompt, apiKey } = req.body
  const key = getApiKey(apiKey)

  if (!key) {
    return res.status(400).json({ error: 'NO_KEY' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${key}&alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 65536,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      res.write(`data: ${JSON.stringify({ error: `${resp.status} ${errText.slice(0, 200)}` })}\n\n`)
      res.end()
      return
    }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw || raw === '[DONE]') continue
        try {
          const json = JSON.parse(raw)
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`)
        } catch {}
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`✓ Assis API server (Gemini ${GEMINI_MODEL}) on http://localhost:${PORT}`)
})
