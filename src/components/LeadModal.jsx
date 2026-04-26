import React, { useState } from 'react'
import { X, Copy, Check, ChevronLeft, ChevronRight, Flag, ExternalLink, Pencil, Sparkles, Loader } from 'lucide-react'
import { useLeads } from '../context/LeadsContext'

const STATUSES = [
  'New','Reviewed','Sent','Replied','Positive',
  'Call Scheduled','Demo Done','Pilot Proposed','Pilot Live',
  'Not Interested','Future'
]

const STATUS_COLORS = {
  'New': 'bg-slate-100 text-slate-600',
  'Reviewed': 'bg-blue-100 text-blue-700',
  'Sent': 'bg-yellow-100 text-yellow-700',
  'Replied': 'bg-orange-100 text-orange-700',
  'Positive': 'bg-green-100 text-green-700',
  'Call Scheduled': 'bg-emerald-100 text-emerald-700',
  'Demo Done': 'bg-purple-100 text-purple-700',
  'Pilot Proposed': 'bg-indigo-100 text-indigo-700',
  'Pilot Live': 'bg-brand-100 text-brand-700',
  'Not Interested': 'bg-red-100 text-red-600',
  'Future': 'bg-slate-100 text-slate-500',
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-500 transition-colors">
          {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
        {value}
      </div>
    </div>
  )
}

// Run a focused Gemini query for a single field
async function runFieldAI(prompt) {
  const key = localStorage.getItem('assis-api-key') || undefined
  const resp = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, apiKey: key }),
  })
  if (!resp.ok) throw new Error(`API error ${resp.status}`)
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
        if (data.text) result += data.text
        if (data.done) return result.trim()
      } catch {}
    }
  }
  return result.trim()
}

function normalizeLinkedIn(raw) {
  if (!raw) return null
  const s = raw.trim()
  if (s.startsWith('https://')) return s
  if (s.startsWith('http://')) return s.replace('http://', 'https://')
  if (s.startsWith('linkedin.com') || s.startsWith('www.linkedin.com')) return `https://www.${s.replace(/^www\./, '')}`
  if (s.includes('linkedin.com/')) return `https://www.linkedin.com/${s.split('linkedin.com/')[1]}`
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(s)}`
}

function fieldSource(key, lead) {
  const domain = lead.domain?.replace(/^https?:\/\//, '') || ''
  const co = encodeURIComponent(lead.company)
  const sources = {
    shopify:          `https://${domain}`,
    estimatedRevenue: `https://www.similarweb.com/website/${domain}/`,
    estimatedSize:    `https://www.linkedin.com/search/results/companies/?keywords=${co}`,
    yearsInBusiness:  `https://www.linkedin.com/search/results/companies/?keywords=${co}`,
    aovEstimate:      `https://www.google.com/search?q=${co}+average+order+value`,
    monthlyOrders:    `https://www.trustpilot.com/review/${domain}`,
    monthlyTraffic:   `https://www.similarweb.com/website/${domain}/`,
    likelyBuyer:      `https://www.linkedin.com/search/results/companies/?keywords=${co}`,
    buyerName:        lead.buyerLinkedIn
                        ? normalizeLinkedIn(lead.buyerLinkedIn)
                        : `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent((lead.buyerName || '') + ' ' + lead.company)}`,
    painHypothesis:   `https://www.trustpilot.com/review/${domain}`,
    assisAngle:       `https://www.google.com/search?q=${co}+customer+support`,
  }
  return sources[key] || null
}

function buildLinks(lead) {
  const co     = encodeURIComponent(lead.company)
  const domain = (lead.domain || '').replace(/^https?:\/\//, '')
  const confirmed = []
  const fallback  = []

  confirmed.push({ label: 'Website', url: `https://${domain}`, icon: '🌐' })
  if (lead.instagramUrl)       confirmed.push({ label: 'Instagram',           url: lead.instagramUrl,       icon: '📸' })
  if (lead.facebookUrl)        confirmed.push({ label: 'Facebook',            url: lead.facebookUrl,        icon: '👥' })
  if (lead.twitterUrl)         confirmed.push({ label: 'Twitter / X',         url: lead.twitterUrl,         icon: '🐦' })
  if (lead.tiktokUrl)          confirmed.push({ label: 'TikTok',              url: lead.tiktokUrl,          icon: '🎵' })
  if (lead.linkedinCompanyUrl) confirmed.push({ label: 'LinkedIn – Company',  url: lead.linkedinCompanyUrl, icon: '💼' })
  if (lead.buyerLinkedIn && !lead.buyerLinkedIn.startsWith('SEARCH:'))
    confirmed.push({ label: `LinkedIn – ${lead.buyerName || 'Founder'}`, url: normalizeLinkedIn(lead.buyerLinkedIn), icon: '👤' })

  confirmed.push({ label: 'Trustpilot',      url: `https://www.trustpilot.com/review/${domain}`,                                                    icon: '⭐' })
  confirmed.push({ label: 'Google Reviews',  url: `https://www.google.com/search?q=${co}+reviews+site:trustpilot.com+OR+site:reddit.com`,           icon: '🔍' })
  confirmed.push({ label: 'BBB',             url: `https://www.bbb.org/search?find_text=${co}&find_country=USA`,                                     icon: '🏛' })
  confirmed.push({ label: 'Sitejabber',      url: `https://www.sitejabber.com/reviews/${domain}`,                                                   icon: '💬' })
  confirmed.push({ label: 'Reddit mentions', url: `https://www.reddit.com/search/?q=${co}&sort=relevance`,                                           icon: '🤖' })
  confirmed.push({ label: 'BuiltWith',       url: `https://builtwith.com/${domain}`,                                                                icon: '🔧' })
  confirmed.push({ label: 'SimilarWeb',      url: `https://www.similarweb.com/website/${domain}/`,                                                  icon: '📊' })
  confirmed.push({ label: 'Semrush',         url: `https://www.semrush.com/analytics/overview/?q=${domain}`,                                        icon: '📈' })
  confirmed.push({ label: 'Glassdoor',       url: `https://www.glassdoor.com/Search/Results.htm?keyword=${co}`,                                     icon: '🏢' })
  confirmed.push({ label: 'Crunchbase',      url: `https://www.crunchbase.com/search/organizations/field/organizations/facet_ids/company?query=${co}`, icon: '💡' })
  confirmed.push({ label: 'Store Leads',     url: `https://storeleads.app/results?q=${domain}`,                                                     icon: '🛍' })
  confirmed.push({ label: 'Wayback Machine', url: `https://web.archive.org/web/*/${domain}`,                                                        icon: '🕰' })
  if (lead.instagramUrl) {
    const handle = lead.instagramUrl.replace(/.*instagram\.com\/?/, '').replace(/\/$/, '')
    if (handle) confirmed.push({ label: 'Social Blade (IG)', url: `https://socialblade.com/instagram/user/${handle}`, icon: '📱' })
  }

  if (!lead.linkedinCompanyUrl)
    fallback.push({ label: 'LinkedIn Company', url: `https://www.linkedin.com/search/results/companies/?keywords=${co}`, icon: '💼' })
  if (!lead.buyerLinkedIn || lead.buyerLinkedIn.startsWith('SEARCH:')) {
    const searchQ = lead.buyerLinkedIn?.startsWith('SEARCH:')
      ? encodeURIComponent(lead.buyerLinkedIn.replace('SEARCH:', '').trim())
      : encodeURIComponent(`${lead.buyerName || ''} ${lead.company}`.trim())
    fallback.push({ label: 'LinkedIn Founder', url: `https://www.linkedin.com/search/results/people/?keywords=${searchQ}`, icon: '👤' })
  }
  if (!lead.instagramUrl)
    fallback.push({ label: 'Instagram', url: `https://www.instagram.com/${domain.split('.')[0]}/`, icon: '📸' })
  fallback.push({ label: 'Google News', url: `https://news.google.com/search?q=${co}`, icon: '📰' })
  fallback.push({ label: 'Inc 5000',    url: `https://www.inc.com/inc5000/search?q=${co}`, icon: '🏆' })

  return { confirmed, fallback }
}

// Always-visible inline editable field
function EditableField({ label, value, onSave, multiline = false, sourceUrl, sourceName, placeholder = 'Add…', className, monospace = false, extra }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  const commit = () => {
    setEditing(false)
    if (draft !== (value || '')) onSave(draft)
  }
  const startEdit = () => { setDraft(value || ''); setEditing(true) }

  return (
    <div className={`rounded-lg p-3 group ${className ?? 'bg-slate-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</span>
        <div className="flex items-center gap-1">
          {extra}
          {sourceUrl && !editing && (
            <a href={sourceUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-brand-500 px-1 py-0.5 rounded transition-colors">
              <ExternalLink size={9} />{sourceName}
            </a>
          )}
          {editing ? (
            <button onMouseDown={e => e.preventDefault()} onClick={commit}
              className="text-xs text-brand-500 font-semibold px-2 py-0.5 bg-white rounded border border-brand-200 hover:bg-brand-50">
              Save
            </button>
          ) : (
            <button onClick={startEdit}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-brand-500 p-0.5 rounded transition-all">
              <Pencil size={10} />
            </button>
          )}
        </div>
      </div>
      {editing ? (
        multiline ? (
          <textarea value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); setDraft(value || '') } }}
            autoFocus rows={3}
            className={`w-full text-sm bg-white border border-brand-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-y ${monospace ? 'font-mono text-xs' : ''}`}
          />
        ) : (
          <input value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value || '') } }}
            autoFocus
            className="w-full text-sm bg-white border border-brand-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        )
      ) : (
        <div onClick={startEdit}
          className={`cursor-text min-h-[20px] ${monospace ? 'font-mono text-xs whitespace-pre-wrap leading-relaxed' : 'text-sm'} ${value ? 'font-medium text-slate-800' : 'text-slate-300 italic text-xs'}`}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  )
}

// AI button to find LinkedIn URL
function AILinkedInButton({ lead, onFound }) {
  const [state, setState] = useState('idle')

  const find = async (e) => {
    e.stopPropagation()
    if (state === 'loading') return
    setState('loading')
    try {
      const name = lead.buyerName || 'the founder'
      const prompt = `Find the LinkedIn profile URL for ${name}, founder or CEO of ${lead.company} (${lead.domain}).
Return ONLY the LinkedIn URL in format https://linkedin.com/in/username — nothing else.
If you cannot find a confirmed URL, return: NOT FOUND`
      const result = await runFieldAI(prompt)
      const clean = result.replace(/[\*\n`]/g, ' ').trim().split(' ')[0]
      if (clean.includes('linkedin.com/in/')) {
        const url = clean.startsWith('http') ? clean : `https://www.${clean.replace(/^www\./, '')}`
        onFound(url)
        setState('done')
      } else {
        setState('notfound')
      }
    } catch {
      setState('error')
    }
    setTimeout(() => setState('idle'), 3000)
  }

  return (
    <button onClick={find} disabled={state === 'loading'} title="Find LinkedIn with AI"
      className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded transition-all ${
        state === 'done'     ? 'text-green-500' :
        state === 'loading'  ? 'text-purple-400 cursor-wait' :
        state === 'notfound' || state === 'error' ? 'text-slate-400' :
        'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
      }`}>
      {state === 'loading' ? <Loader size={9} className="animate-spin" /> :
       state === 'done'    ? <Check size={9} /> :
                             <Sparkles size={9} />}
      {state === 'idle' ? 'Find' : state === 'loading' ? '…' : state === 'done' ? 'Found!' : 'Not found'}
    </button>
  )
}

export default function LeadModal({ lead, onClose, onPrev, onNext, hasPrev, hasNext, position }) {
  const { updateLead, updateStatus } = useLeads()
  const [form, setForm] = useState(lead)
  const [activeTab, setActiveTab] = useState('overview')

  React.useEffect(() => { setForm(lead) }, [lead.id])

  const handleFieldSave = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    updateLead(lead.id, { [key]: value })
  }

  const TABS = ['overview', 'stack', 'outreach', 'scores', 'notes', 'links']

  const priorityColor = {
    High: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-slate-100 text-slate-600',
    Skip: 'bg-red-100 text-red-600',
  }[lead.priority] || 'bg-slate-100 text-slate-600'

  const handleKeyDown = React.useCallback((e) => {
    if (e.key === 'ArrowLeft' && hasPrev) onPrev?.()
    if (e.key === 'ArrowRight' && hasNext) onNext?.()
    if (e.key === 'Escape') onClose()
  }, [hasPrev, hasNext, onPrev, onNext, onClose])

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {lead.disqualified && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                    <Flag size={10} /> Low quality
                  </span>
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityColor}`}>
                  {lead.priority} Priority
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {lead.vertical}{lead.subCategory ? ` · ${lead.subCategory}` : ''}
                </span>
                {lead.totalScore != null && (
                  <span className="text-xs font-semibold text-brand-600">Score: {lead.totalScore}/100</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{lead.company}</h2>
              <a href={`https://${lead.domain}`} target="_blank" rel="noreferrer"
                className="text-sm text-brand-500 hover:underline">{lead.domain}</a>
            </div>

            <div className="flex items-center gap-1 ml-4 shrink-0">
              <button
                onClick={() => updateLead(lead.id, { disqualified: !lead.disqualified })}
                title={lead.disqualified ? 'Remove flag' : 'Flag as low quality'}
                className={`p-1.5 rounded-lg transition-colors ${lead.disqualified ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'hover:bg-slate-100 text-slate-400 hover:text-red-400'}`}
              >
                <Flag size={15} />
              </button>
              {(hasPrev || hasNext) && (
                <>
                  <button onClick={onPrev} disabled={!hasPrev} title="Previous lead (←)"
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} className="text-slate-500" />
                  </button>
                  {position && <span className="text-xs text-slate-400 tabular-nums px-1">{position}</span>}
                  <button onClick={onNext} disabled={!hasNext} title="Next lead (→)"
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={16} className="text-slate-500" />
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg ml-1">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={lead.status}
              onChange={e => updateStatus(lead.id, e.target.value)}
              className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 ${STATUS_COLORS[lead.status]}`}
            >
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-2.5">

              {/* Basic data grid — always show all 9 cells */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Shopify',           key: 'shopify',          sourceKey: 'shopify',          sourceName: 'Verify'     },
                  { label: 'Est. Revenue',      key: 'estimatedRevenue', sourceKey: 'estimatedRevenue', sourceName: 'SimilarWeb' },
                  { label: 'Team Size',         key: 'estimatedSize',    sourceKey: 'estimatedSize',    sourceName: 'LinkedIn'   },
                  { label: 'Years in Business', key: 'yearsInBusiness',  sourceKey: 'yearsInBusiness',  sourceName: 'LinkedIn'   },
                  { label: 'AOV',               key: 'aovEstimate',      sourceKey: 'aovEstimate',      sourceName: 'Google'     },
                  { label: 'Monthly Orders',    key: 'monthlyOrders',    sourceKey: 'monthlyOrders',    sourceName: 'Trustpilot' },
                  { label: 'Monthly Traffic',   key: 'monthlyTraffic',   sourceKey: 'monthlyTraffic',   sourceName: 'SimilarWeb' },
                  { label: 'Buyer Persona',     key: 'likelyBuyer',      sourceKey: 'likelyBuyer',      sourceName: 'LinkedIn'   },
                  { label: 'Buyer Name',        key: 'buyerName',        sourceKey: 'buyerName',        sourceName: 'LinkedIn'   },
                ].map(({ label, key, sourceKey, sourceName }) => (
                  <EditableField
                    key={key}
                    label={label}
                    value={form[key]}
                    onSave={v => handleFieldSave(key, v)}
                    sourceUrl={fieldSource(sourceKey, lead)}
                    sourceName={sourceName}
                    placeholder={`Add ${label.toLowerCase()}…`}
                  />
                ))}
              </div>

              {/* Founder LinkedIn — with AI Find button */}
              <EditableField
                label="Founder LinkedIn"
                value={form.buyerLinkedIn}
                onSave={v => handleFieldSave('buyerLinkedIn', v)}
                placeholder="Paste URL or use Find →"
                extra={<AILinkedInButton lead={form} onFound={url => handleFieldSave('buyerLinkedIn', url)} />}
              />
              {form.buyerLinkedIn && (
                <a href={normalizeLinkedIn(form.buyerLinkedIn)} target="_blank" rel="noreferrer"
                  className="block -mt-1 px-1 text-xs text-brand-500 hover:underline break-all">
                  {normalizeLinkedIn(form.buyerLinkedIn)}
                </a>
              )}

              {/* Discovery Reason */}
              <EditableField
                label="Found via"
                value={form.discoveryReason}
                onSave={v => handleFieldSave('discoveryReason', v)}
                placeholder="How was this lead discovered?"
              />

              {/* Consumer Reviews */}
              {(form.reviewsSummary || form.redditMentions || form.bbbInfo || form.glassdoorInfo) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Consumer Reviews</span>
                    <a href={`https://www.trustpilot.com/review/${(lead.domain || '').replace(/^https?:\/\//, '')}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-500 transition-colors">
                      <ExternalLink size={10} /> Trustpilot
                    </a>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-3 text-sm text-slate-700">
                    {form.reviewsSummary && (
                      <div className="whitespace-pre-wrap leading-relaxed">{form.reviewsSummary}</div>
                    )}
                    {(form.redditMentions || form.bbbInfo || form.glassdoorInfo) && (
                      <div className="border-t border-amber-100 pt-2 space-y-1.5">
                        {form.redditMentions && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-semibold text-slate-400 w-14 shrink-0 mt-0.5">Reddit</span>
                            <span className="text-xs text-slate-600">{form.redditMentions}</span>
                          </div>
                        )}
                        {form.bbbInfo && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-semibold text-slate-400 w-14 shrink-0 mt-0.5">BBB</span>
                            <span className="text-xs text-slate-600">{form.bbbInfo}</span>
                          </div>
                        )}
                        {form.glassdoorInfo && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-semibold text-slate-400 w-14 shrink-0 mt-0.5">Glassdoor</span>
                            <span className="text-xs text-slate-600">{form.glassdoorInfo}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pain Hypothesis */}
              <EditableField
                label="Pain Hypothesis"
                value={form.painHypothesis}
                onSave={v => handleFieldSave('painHypothesis', v)}
                multiline
                className="bg-orange-50 border border-orange-100"
                sourceUrl={fieldSource('painHypothesis', lead)}
                sourceName="Trustpilot"
                placeholder="What's the main friction point?"
              />

              {/* Assis Angle */}
              <EditableField
                label="Assis Angle"
                value={form.assisAngle}
                onSave={v => handleFieldSave('assisAngle', v)}
                multiline
                className="bg-green-50 border border-green-100"
                sourceUrl={fieldSource('assisAngle', lead)}
                sourceName="Verify"
                placeholder="Why does Assis specifically fit?"
              />

              {/* Next Action */}
              <EditableField
                label="Next Action"
                value={form.nextAction}
                onSave={v => handleFieldSave('nextAction', v)}
                className="bg-brand-50 border border-brand-100"
                placeholder="What needs to happen next?"
              />
            </div>
          )}

          {/* ── STACK ── */}
          {activeTab === 'stack' && (() => {
            // Parse "Key: Value" lines from currentStack
            const lines = (form.currentStack || '').split('\n').filter(l => l.trim())
            const parsed = lines.map(line => {
              const idx = line.indexOf(':')
              if (idx < 0) return { label: line.trim(), value: '' }
              return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
            }).filter(({ label }) => label)

            const statusOf = (val) => {
              if (!val) return 'unknown'
              const v = val.toLowerCase()
              if (['unknown', 'n/a', 'missing', 'not visible', 'not detected', 'not found', ''].includes(v)) return 'unknown'
              if (v === 'no' || v.startsWith('no ') || v === 'none' || v === 'email only') return 'no'
              return 'yes'
            }

            const ICONS = {
              yes:     { icon: '✓', bg: 'bg-green-50 border border-green-200',   label: 'text-green-700',  val: 'text-green-600 font-medium' },
              no:      { icon: '✗', bg: 'bg-red-50 border border-red-100',       label: 'text-red-600',    val: 'text-red-500' },
              unknown: { icon: '?', bg: 'bg-slate-50 border border-slate-200',   label: 'text-slate-500',  val: 'text-slate-400 italic' },
            }

            // Separate the "tool name" from yes/no — e.g. "Yes — Gorgias" → {status:'yes', tool:'Gorgias'}
            const parseTool = (val) => {
              const status = statusOf(val)
              if (status !== 'yes' && status !== 'no') return { status, tool: val || '—' }
              const parts = val.split(/\s*[—\-–]\s*/)
              const base = parts[0].trim()
              const tool = parts.slice(1).join(' ').trim()
              return { status, tool: tool || base }
            }

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">What {lead.company} uses today — confirmed from website, BuiltWith & Gemini research.</p>
                  <a href={`https://builtwith.com/${(lead.domain || '').replace(/^https?:\/\//, '')}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-500 transition-colors shrink-0 ml-2">
                    <ExternalLink size={10} /> BuiltWith
                  </a>
                </div>

                {parsed.length > 0 ? (
                  <div className="space-y-2">
                    {parsed.map(({ label, value }) => {
                      const { status, tool } = parseTool(value)
                      const style = ICONS[status]
                      return (
                        <div key={label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${style.bg}`}>
                          <span className={`text-sm font-bold w-5 text-center shrink-0 ${style.label}`}>{style.icon}</span>
                          <span className={`text-sm flex-1 ${style.label}`}>{label}</span>
                          <span className={`text-xs ${style.val} max-w-[180px] text-right truncate`}>{tool}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <div className="text-3xl">🔍</div>
                    <p className="text-sm text-slate-400">No stack data yet.</p>
                    <p className="text-xs text-slate-300">Run Step 2 in the Workflow to research this company's tools.</p>
                  </div>
                )}

                {/* Raw editable fallback */}
                <div className="pt-2 border-t border-slate-100">
                  <EditableField
                    label="Raw stack notes (editable)"
                    value={form.currentStack}
                    onSave={v => handleFieldSave('currentStack', v)}
                    multiline monospace
                    className="bg-slate-50"
                    placeholder={'Help Desk:\nChatbot:\nCRM:\nWhatsApp:\nOutsourcing:\nAI Tools:\n…'}
                  />
                </div>
              </div>
            )
          })()}

          {/* ── OUTREACH ── */}
          {activeTab === 'outreach' && (
            <div className="space-y-4">
              <CopyField label="LinkedIn Message" value={lead.linkedinDraft} />
              <CopyField label="Email Subject" value={lead.emailSubject} />
              <CopyField label="Email Body" value={lead.emailBody} />
              <CopyField label="Follow-up #1 (Day 4–5)" value={lead.followUp1} />
              <CopyField label="Follow-up #2 (Day 10–12)" value={lead.followUp2} />
            </div>
          )}

          {/* ── SCORES ── */}
          {activeTab === 'scores' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl font-bold text-slate-900">{lead.totalScore ?? '—'}</div>
                <div>
                  <div className="text-slate-400 text-sm">/ 100</div>
                  <div className="text-sm font-semibold mt-0.5">{lead.priority} Priority</div>
                </div>
              </div>
              {[
                { label: 'ICP Match',            value: lead.icpScore,       max: 20 },
                { label: 'Support Friction',     value: lead.frictionScore,  max: 20 },
                { label: 'Founder-Led',          value: lead.founderScore,   max: 15 },
                { label: 'Speed to Close',       value: lead.speedScore,     max: 15 },
                { label: 'Case Study Potential', value: lead.caseStudyScore, max: 15 },
                { label: 'AOV / Impact',         value: lead.aovScore,       max: 15 },
              ].map(({ label, value, max }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-800">{value ?? '—'}/{max}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: value != null ? `${(value / max) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── LINKS ── */}
          {activeTab === 'links' && (() => {
            const { confirmed, fallback } = buildLinks(lead)
            return (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">✓ Confirmed & reliable</div>
                  <div className="grid grid-cols-2 gap-2">
                    {confirmed.map(({ label, url, icon }) => (
                      <a key={label} href={url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 group transition-all">
                        <span className="text-base">{icon}</span>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-brand-600 truncate">{label}</span>
                        <ExternalLink size={11} className="text-slate-300 group-hover:text-brand-400 shrink-0 ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">🔎 Search fallbacks</div>
                  <div className="grid grid-cols-2 gap-2">
                    {fallback.map(({ label, url, icon }) => (
                      <a key={label} href={url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-slate-50/60 hover:bg-slate-100 border border-dashed border-slate-200 group transition-all">
                        <span className="text-base">{icon}</span>
                        <span className="text-sm text-slate-500 group-hover:text-slate-700 truncate">{label}</span>
                        <ExternalLink size={11} className="text-slate-300 shrink-0 ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">
                  לינקים ב"Confirmed" מגיעים ישירות מהאתר של החברה (Trustpilot, SimilarWeb) או משלב 2 של ה-Workflow. לינקי Search פותחים חיפוש — לא ישירות לפרופיל.
                </p>
              </div>
            )
          })()}

          {/* ── NOTES ── */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</label>
                <textarea
                  value={form.notes || ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  onBlur={() => updateLead(lead.id, { notes: form.notes })}
                  rows={6}
                  placeholder="Add research notes, call recap, or anything useful..."
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Next Action</label>
                <input type="text"
                  value={form.nextAction || ''}
                  onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}
                  onBlur={() => updateLead(lead.id, { nextAction: form.nextAction })}
                  placeholder="What needs to happen next?"
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              {lead.lastContactDate && (
                <div className="text-xs text-slate-400">
                  Last contact: {new Date(lead.lastContactDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
