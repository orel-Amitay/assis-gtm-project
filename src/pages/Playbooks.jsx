import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Copy, Check, Pencil, X, Save } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { t } from '../data/translations'

const DEFAULT_PLAYBOOKS = [
  {
    id: 'icp',
    title: 'ICP Definition',
    tag: 'Research',
    tagColor: 'bg-blue-100 text-blue-700',
    sections: [
      {
        heading: 'Ideal Customer Profile',
        content: `COMPANY
• Shopify (confirmed or likely)
• Revenue $1M–$10M
• 5–50 employees
• DTC channel active (not wholesale-only)
• 500–5,000 support tickets/month

VERTICALS (in priority order)
1. Home / Mattress / Furniture
2. Consumer Electronics
3. Beauty / Lifestyle

PRODUCT CHARACTERISTICS
• High AOV ($300+ for Home, $100+ for Electronics/Beauty)
• Delivery window 5+ days, OR
• Complex product (configuration, sizing, customization), OR
• High return rate / post-purchase anxiety

BUYER PERSONA
• Founder (primary): <25 employees, active on LinkedIn, revenue-focused
• Head of CX (secondary): 25–75 employees, workload-focused
• COO (secondary): operational + ROI-focused

PAIN PATTERN
The business is losing revenue at predictable friction points:
• The anxious customer at day 5 of a 9-day shipping window
• The buyer with a pre-purchase question that doesn't get answered
• The escalation that should have resolved on first contact

NEGATIVE ICP (exclude)
• Wholesale-primary (e.g. Wayfair vendors)
• Under $500K revenue
• Non-Shopify with complex tech integration
• Casper, Purple, Leesa, Saatva, Nectar (too large)
• Amazon-primary brands`,
      },
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring Model',
    tag: 'Scoring',
    tagColor: 'bg-orange-100 text-orange-700',
    sections: [
      {
        heading: 'Scoring Dimensions (100 pts)',
        content: `ICP MATCH (20 pts)
• Shopify confirmed: +8 | Likely: +5
• Revenue $2M–$8M: +6 | $1M–2M or $8M–15M: +3
• Size 10–40 employees: +4 | 5–10 or 40–75: +2
• AOV $400+: +2

SUPPORT FRICTION SIGNAL (20 pts)
• Reviews mention "delay", "wait", "cancel": +8
• 3+ reviews describe shipping/delivery problem: +3 bonus
• Currently hiring for CX/support role: +6
• No chat widget (email-only): +4
• Delivery window 3+ weeks: +2

FOUNDER-LED PROBABILITY (15 pts)
• Founder posted on LinkedIn in last 30 days: +8
• Founder is public face of brand: +5
• Under 25 employees: +2

SPEED TO CLOSE (15 pts)
• No procurement process signals: +8
• Decision maker identifiable and reachable: +5
• Company actively growing (hiring, launches): +2

CASE STUDY POTENTIAL (15 pts)
• Brand recognizable in sub-category: +6
• AOV $600+: +6
• Founder likely to give public testimonial: +3

AOV / REVENUE IMPACT (15 pts)
• $1,000+: +15
• $600–$999: +12
• $400–$599: +9
• $200–$399: +5
• $100–$199: +2
• Under $100: +0`,
      },
      {
        heading: 'Priority Tiers',
        content: `85–100: High — Outreach this week
70–84: High — Outreach within 2 weeks
55–69: Medium — Research more, then outreach
40–54: Low — Hold 60 days
Under 40: Skip

CALIBRATION RULES
• No more than 5–6 companies should score 85+
• No Shopify Unknown above 60
• No AOV under $200 above 65`,
      },
    ],
  },
  {
    id: 'messaging',
    title: 'Messaging Framework',
    tag: 'Outreach',
    tagColor: 'bg-green-100 text-green-700',
    sections: [
      {
        heading: 'Structure (follow exactly)',
        content: `1. Name their specific situation — something found in enrichment
2. Name the problem in their language (not product language)
3. One sentence on what we do (outcome-focused)
4. One ask: 15-minute call`,
      },
      {
        heading: 'Banned Words',
        content: `NEVER USE:
AI, chatbot, automation, platform, tool, automated responses,
"I wanted to reach out", "I hope this finds you well",
"leverage", "synergy", "streamline", "solution"

LEAD WITH:
saved revenue, prevented cancellations, saved orders,
conversion, trust, fast response, real answer`,
      },
      {
        heading: 'Format Limits',
        content: `LinkedIn connection note: under 250 characters
LinkedIn message: under 120 words
Email body: under 150 words
Follow-up #1: under 80 words (Day 4–5)
Follow-up #2: under 60 words (Day 10–12)
Subject line: lowercase, curiosity-based`,
      },
      {
        heading: 'Persona Tone',
        content: `FOUNDER: peer-to-peer, revenue-focused, direct
→ "What's your conversion rate on that shipping delay window?"

HEAD OF CX: collegial, workload-focused, operational
→ "That's probably 30 tickets a week your team handles manually."

COO: analytical, ROI-first, give the math frame
→ "At $950 AOV, saving 20 orders/month = $19,000."`,
      },
    ],
  },
  {
    id: 'stories',
    title: 'Proof Stories',
    tag: 'Sales',
    tagColor: 'bg-purple-100 text-purple-700',
    sections: [
      {
        heading: 'Mattress — Shipping Delay',
        content: `A customer ordered a $900 mattress. Day 5, shipping pushed back 8 days.
They messaged: "I need to cancel."

Assis responded in 3 minutes — acknowledged the delay, offered a $75 credit, confirmed the new date.

Customer replied: "OK, thank you." Order saved.`,
      },
      {
        heading: 'Furniture — Week-7 Cancellation',
        content: `A customer's $2,200 sofa was 6 weeks into an 8-week lead time. They messaged asking to cancel.

Assis responded immediately, confirmed it was in final production, offered a credit.

Order saved.`,
      },
      {
        heading: 'Bedding — Pre-Purchase Question',
        content: `A customer couldn't decide which sheet set was right for her California King. No answer on the site.

She bought from a competitor.

Assis answers that question in real-time, with personalization.`,
      },
    ],
  },
  {
    id: 'objections',
    title: 'Objection Handling',
    tag: 'Sales',
    tagColor: 'bg-purple-100 text-purple-700',
    sections: [
      {
        heading: 'Common Objections',
        content: `"We already have Gorgias / Zendesk"
→ Assis works on top of your existing helpdesk. This isn't a replacement — it's the layer that handles conversations before they become tickets, or escalates them with full context when they do.

"We don't have budget right now"
→ The pilot is free. You're a design partner. We want outcomes, not a contract. If it doesn't work, you've lost 30 days of testing. If it does, we can talk terms.

"Our team handles this fine"
→ Based on [specific review / signal you found], there's at least one pattern they're handling manually at volume. Let's measure it: what's the response time on a shipping delay inquiry at 11pm?

"We're too small / too big"
→ Our sweet spot is exactly your size — founder-led, 10–40 people, where support quality is tied directly to the founder's reputation.

"We tried AI tools before"
→ Assis isn't an AI tool. It's not a bot. It's the conversation infrastructure that makes you look like you have a 10-person CX team, without hiring one.`,
      },
    ],
  },
  {
    id: 'pilot',
    title: 'Pilot Structure',
    tag: 'Closing',
    tagColor: 'bg-teal-100 text-teal-700',
    sections: [
      {
        heading: 'Design Partner Offer',
        content: `DURATION: 30–45 days

WHAT WE PROVIDE
• Fully configured Assis layer for one use case
• Integration with existing helpdesk (Gorgias / Zendesk / Shopify Inbox)
• Weekly review call (30 min)
• Measurement report at end of pilot

WHAT WE NEED FROM YOU
• Shopify read access
• Helpdesk integration access
• 30-minute kickoff call
• One point of contact

COST: Free (design partner program)

IN RETURN
• Case study (with your approval)
• Product feedback sessions
• Testimonial (if results warrant it)`,
      },
      {
        heading: 'Top Use Cases by Vertical',
        content: `HOME / MATTRESS / FURNITURE
1. Save cancellations during shipping delay window (days 5–9)
2. Handle week-6/7 anxiety for custom/made-to-order
3. Convert pre-purchase sizing/product questions

ELECTRONICS
1. Reduce setup support volume with proactive onboarding
2. Handle compatibility questions pre-purchase
3. Manage warranty and returns efficiently

BEAUTY / LIFESTYLE
1. Convert subscription pre-purchase questions
2. Handle ingredient/allergy inquiries
3. Reduce "where is my order" volume`,
      },
    ],
  },
]

const STORAGE_KEY = 'assis-playbooks-content'

function loadSavedContent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveContent(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

function PlaybookCard({ playbook, savedContent, onSave }) {
  const [open, setOpen] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [editingIdx, setEditingIdx] = useState(null)
  const [draftText, setDraftText] = useState('')
  const { lang } = useLang()
  const isHe = lang === 'he'

  const getContent = (idx) => {
    const key = `${playbook.id}_${idx}`
    return savedContent[key] !== undefined ? savedContent[key] : playbook.sections[idx].content
  }

  const copy = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const startEdit = (idx) => {
    setDraftText(getContent(idx))
    setEditingIdx(idx)
  }

  const cancelEdit = () => {
    setEditingIdx(null)
    setDraftText('')
  }

  const confirmSave = (idx) => {
    const key = `${playbook.id}_${idx}`
    onSave(key, draftText)
    setEditingIdx(null)
    setDraftText('')
  }

  const resetToDefault = (idx) => {
    const key = `${playbook.id}_${idx}`
    onSave(key, playbook.sections[idx].content)
    setEditingIdx(null)
    setDraftText('')
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${playbook.tagColor}`}>
            {playbook.tag}
          </span>
          <span className="font-semibold text-slate-900">{playbook.title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {playbook.sections.map((section, idx) => {
            const content = getContent(idx)
            const isEditing = editingIdx === idx
            const isModified = savedContent[`${playbook.id}_${idx}`] !== undefined &&
              savedContent[`${playbook.id}_${idx}`] !== section.content

            return (
              <div key={idx} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">{section.heading}</h3>
                    {isModified && !isEditing && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                        {isHe ? 'ערוך' : 'edited'}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => resetToDefault(idx)}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {isHe ? 'איפוס' : 'Reset'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={11} />
                        {isHe ? 'ביטול' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => confirmSave(idx)}
                        className="flex items-center gap-1 text-xs bg-brand-500 text-white px-2.5 py-1 rounded-lg hover:bg-brand-600 transition-colors font-medium"
                      >
                        <Save size={11} />
                        {isHe ? 'שמור' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copy(content, idx)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-500 transition-colors"
                      >
                        {copiedIdx === idx ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                        {copiedIdx === idx ? (isHe ? 'הועתק' : 'Copied') : (isHe ? 'העתק' : 'Copy')}
                      </button>
                      <button
                        onClick={() => startEdit(idx)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-500 transition-colors"
                      >
                        <Pencil size={11} />
                        {isHe ? 'ערוך' : 'Edit'}
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <textarea
                    value={draftText}
                    onChange={e => setDraftText(e.target.value)}
                    rows={Math.max(6, content.split('\n').length + 2)}
                    className="w-full border border-brand-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white font-sans resize-y focus:outline-none focus:ring-2 focus:ring-brand-400 leading-relaxed"
                    autoFocus
                  />
                ) : (
                  <pre className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">
                    {content}
                  </pre>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Playbooks() {
  const { lang } = useLang()
  const [savedContent, setSavedContent] = useState(loadSavedContent)

  const handleSave = (key, value) => {
    setSavedContent(prev => {
      const next = { ...prev, [key]: value }
      saveContent(next)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('pb_title', lang)}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('pb_sub', lang)}</p>
      </div>

      <div className="space-y-3">
        {DEFAULT_PLAYBOOKS.map(pb => (
          <PlaybookCard
            key={pb.id}
            playbook={pb}
            savedContent={savedContent}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  )
}
