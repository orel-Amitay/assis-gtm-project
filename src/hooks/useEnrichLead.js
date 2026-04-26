import { useState, useCallback } from 'react'
import { useLeads } from '../context/LeadsContext'
import { mergeStep2, mergeStep3, mergeStep4 } from '../data/parseLeads'
import { WORKFLOW_STEPS } from '../data/prompts'

async function streamGemini(prompt) {
  const apiKey = localStorage.getItem('assis-api-key') || undefined
  const resp = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, apiKey }),
  })
  if (!resp.ok) {
    const j = await resp.json().catch(() => ({}))
    throw new Error(j.error === 'NO_KEY' ? 'NO_KEY' : j.error || 'API error')
  }
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = '', result = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const data = JSON.parse(line.slice(6))
        if (data.error) throw new Error(data.error)
        if (data.text) result += data.text
        if (data.done) return result.trim()
      } catch (e) {
        if (e.message && e.message !== 'Unexpected token') throw e
      }
    }
  }
  return result.trim()
}

function leadToRawText(lead) {
  return `---
Company: ${lead.company}
Domain: ${lead.domain}
Sub-category: ${lead.subCategory || ''}
Shopify: ${lead.shopify || 'Unknown'}
Estimated employees: ${lead.estimatedSize || 'Unknown'}
AOV signal: ${lead.aovEstimate || 'Unknown'}
Monthly Orders: ${lead.monthlyOrders || 'Unknown'}
Monthly Traffic: ${lead.monthlyTraffic || 'Unknown'}
Years active: ${lead.yearsInBusiness || 'Unknown'}
Found via: ${lead.discoveryReason || 'Manual'}
Discovery reason: ${lead.discoveryReason || ''}
Why it might fit: ${lead.assisAngle || ''}
Likely buyer: ${lead.likelyBuyer || 'Founder'}
Pain hypothesis: ${lead.painHypothesis || ''}
Red flags: ${lead.notes || ''}
---`
}

// enriching state per lead: null | 'step2' | 'step3' | 'step4' | 'done' | 'error'
export function useEnrichLead() {
  const { updateLead } = useLeads()
  const [enriching, setEnriching] = useState({})

  const setStep = (id, step) => setEnriching(prev => ({ ...prev, [id]: step }))

  const clearStep = (id) => setEnriching(prev => {
    const next = { ...prev }
    delete next[id]
    return next
  })

  const enrich = useCallback(async (lead) => {
    const vertical = lead.vertical + (lead.subCategory ? ` / ${lead.subCategory}` : '')
    const rawText = leadToRawText(lead)
    let current = { ...lead }

    try {
      // Step 2: Enrichment
      setStep(lead.id, 'step2')
      const step2Prompt = WORKFLOW_STEPS.find(s => s.step === 2).generatePrompt(vertical, rawText)
      const step2Text = await streamGemini(step2Prompt)
      current = { ...current, ...mergeStep2(step2Text, [current])[0] }
      updateLead(lead.id, current)

      // Step 3: Scoring
      setStep(lead.id, 'step3')
      const step3Prompt = WORKFLOW_STEPS.find(s => s.step === 3).generatePrompt(vertical, step2Text)
      const step3Text = await streamGemini(step3Prompt)
      current = { ...current, ...mergeStep3(step3Text, [current])[0] }
      updateLead(lead.id, current)

      // Step 4: Outreach
      setStep(lead.id, 'step4')
      const step4Prompt = WORKFLOW_STEPS.find(s => s.step === 4).generatePrompt(vertical, step3Text)
      const step4Text = await streamGemini(step4Prompt)
      current = { ...current, ...mergeStep4(step4Text, [current])[0] }
      updateLead(lead.id, current)

      setStep(lead.id, 'done')
      setTimeout(() => clearStep(lead.id), 3000)
    } catch (e) {
      setStep(lead.id, 'error')
      setTimeout(() => clearStep(lead.id), 4000)
      throw e
    }
  }, [updateLead])

  const enrichBatch = useCallback(async (leads) => {
    for (const lead of leads) {
      try { await enrich(lead) } catch {}
    }
  }, [enrich])

  return { enrich, enrichBatch, enriching }
}
