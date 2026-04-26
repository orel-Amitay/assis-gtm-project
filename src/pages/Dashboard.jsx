import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Send, Phone, Rocket, TrendingUp, ArrowRight, Pencil, Check, X } from 'lucide-react'
import { useLeads } from '../context/LeadsContext'
import { useLang } from '../context/LanguageContext'
import { t } from '../data/translations'

// ── Goal settings (stored in localStorage) ────────────────────────────────
const GOAL_KEY = 'assis-arr-goal'
function loadGoal() {
  try { return JSON.parse(localStorage.getItem(GOAL_KEY)) || { arrTarget: 500000, acv: 25000 } }
  catch { return { arrTarget: 500000, acv: 25000 } }
}
function saveGoal(g) {
  try { localStorage.setItem(GOAL_KEY, JSON.stringify(g)) } catch {}
}

function fmt(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

// ── Pipeline stages ────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { statuses: ['New', 'Reviewed'],                    label: 'To Contact',    color: 'bg-slate-100 text-slate-700'    },
  { statuses: ['Sent'],                               label: 'Outreach Sent', color: 'bg-blue-100 text-blue-700'     },
  { statuses: ['Replied', 'Positive'],                label: 'Engaged',       color: 'bg-orange-100 text-orange-700' },
  { statuses: ['Call Scheduled', 'Demo Done'],        label: 'In Calls',      color: 'bg-purple-100 text-purple-700' },
  { statuses: ['Pilot Proposed', 'Pilot Live'],       label: 'Pilots',        color: 'bg-green-100 text-green-700'   },
]

const STATUS_COLOR = {
  'New': 'bg-slate-100 text-slate-600',
  'Reviewed': 'bg-blue-50 text-blue-700',
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

// ── ARR Goal block ─────────────────────────────────────────────────────────
function ARRGoal({ leads }) {
  const [goal, setGoal] = useState(loadGoal)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(goal)

  const customersNeeded = Math.ceil(goal.arrTarget / goal.acv)
  const pilots          = leads.filter(l => ['Pilot Proposed', 'Pilot Live'].includes(l.status)).length
  const currentArr      = pilots * goal.acv
  const arrPct          = Math.min(100, Math.round((currentArr / goal.arrTarget) * 100))
  const remaining       = Math.max(0, customersNeeded - pilots)
  const inCalls         = leads.filter(l => ['Call Scheduled', 'Demo Done'].includes(l.status)).length
  const engaged         = leads.filter(l => ['Replied', 'Positive'].includes(l.status)).length
  const inOutreach      = leads.filter(l => l.status === 'Sent').length

  const saveEdit = () => {
    const updated = {
      arrTarget: parseInt(draft.arrTarget) || goal.arrTarget,
      acv:       parseInt(draft.acv)       || goal.acv,
    }
    setGoal(updated)
    saveGoal(updated)
    setEditing(false)
  }
  const cancelEdit = () => { setDraft(goal); setEditing(false) }

  // Pipeline steps needed (working backwards from goal)
  // Assumes: ~30% of calls → pilot, ~50% of engaged → call, ~25% of outreach → reply
  const needPilots    = remaining
  const needCalls     = Math.max(0, needPilots - inCalls)   // already in calls
  const needEngaged   = Math.max(0, needCalls  - engaged)
  const needOutreach  = Math.max(0, needEngaged - inOutreach)
  const onTrack       = remaining === 0

  return (
    <div className={`rounded-xl p-6 ${onTrack ? 'bg-green-900' : 'bg-slate-900'} text-white`}>

      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg">ARR Goal</h2>
            {onTrack && (
              <span className="text-xs bg-green-400 text-green-900 font-bold px-2 py-0.5 rounded-full">
                GOAL REACHED
              </span>
            )}
          </div>
          {editing ? (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <label className="text-xs text-slate-400">
                Target ARR ($):
                <input
                  type="number"
                  value={draft.arrTarget}
                  onChange={e => setDraft(d => ({ ...d, arrTarget: e.target.value }))}
                  className="ml-2 w-28 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </label>
              <label className="text-xs text-slate-400">
                ACV per customer ($):
                <input
                  type="number"
                  value={draft.acv}
                  onChange={e => setDraft(d => ({ ...d, acv: e.target.value }))}
                  className="ml-2 w-24 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </label>
              <button onClick={saveEdit} className="flex items-center gap-1 text-xs bg-brand-500 text-white px-3 py-1 rounded-lg hover:bg-brand-600">
                <Check size={11} /> Save
              </button>
              <button onClick={cancelEdit} className="text-xs text-slate-400 hover:text-white">
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-400 text-sm">
                {customersNeeded} customers × {fmt(goal.acv)}/yr = {fmt(goal.arrTarget)}
              </p>
              <button onClick={() => { setDraft(goal); setEditing(true) }}
                className="text-slate-500 hover:text-slate-300 transition-colors">
                <Pencil size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Big numbers */}
        <div className="text-right shrink-0 ml-6">
          <div className="text-3xl font-bold tabular-nums">
            {pilots}
            <span className="text-slate-500 text-xl">/{customersNeeded}</span>
          </div>
          <div className="text-slate-400 text-xs mt-0.5">customers signed</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>{fmt(currentArr)} ARR</span>
          <span>{arrPct}%</span>
          <span>{fmt(goal.arrTarget)}</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${onTrack ? 'bg-green-400' : 'bg-brand-500'}`}
            style={{ width: `${arrPct}%` }}
          />
        </div>
        {remaining > 0 && (
          <div className="text-xs text-slate-400 mt-1.5">
            {fmt(remaining * goal.acv)} remaining · {remaining} more customer{remaining !== 1 ? 's' : ''} needed
          </div>
        )}
      </div>

      {/* Pipeline funnel toward goal */}
      <div>
        <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Pipeline toward goal</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: 'Outreach',
              current: inOutreach,
              needed: needOutreach,
              color: 'bg-blue-900/60',
              highlight: 'bg-blue-400',
            },
            {
              label: 'Engaged',
              current: engaged,
              needed: needEngaged,
              color: 'bg-orange-900/60',
              highlight: 'bg-orange-400',
            },
            {
              label: 'Calls',
              current: inCalls,
              needed: needCalls,
              color: 'bg-purple-900/60',
              highlight: 'bg-purple-400',
            },
            {
              label: 'Pilots',
              current: pilots,
              needed: needPilots,
              color: 'bg-green-900/60',
              highlight: 'bg-green-400',
            },
          ].map(({ label, current, needed, color, highlight }) => (
            <div key={label} className={`${color} rounded-lg p-3`}>
              <div className="text-xs text-slate-400 mb-1">{label}</div>
              <div className="text-xl font-bold tabular-nums">{current}</div>
              {needed > 0 ? (
                <div className={`text-xs mt-1 font-medium text-amber-300`}>
                  +{needed} needed
                </div>
              ) : (
                <div className="text-xs mt-1 text-green-400 font-medium">✓ on track</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { leads } = useLeads()
  const navigate  = useNavigate()
  const { lang }  = useLang()

  const total     = leads.length
  const contacted = leads.filter(l => !['New','Reviewed','Not Interested','Future'].includes(l.status)).length
  const replied   = leads.filter(l => ['Replied','Positive','Call Scheduled','Demo Done','Pilot Proposed','Pilot Live'].includes(l.status)).length
  const calls     = leads.filter(l => ['Call Scheduled','Demo Done','Pilot Proposed','Pilot Live'].includes(l.status)).length
  const pilots    = leads.filter(l => ['Pilot Proposed','Pilot Live'].includes(l.status)).length

  const highPriority   = leads.filter(l => l.priority === 'High' && ['New','Reviewed'].includes(l.status))
  const recentActivity = [...leads]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6)

  const stats = [
    { labelKey: 'dash_total',     value: total,     icon: Users,      color: 'text-slate-600',  bg: 'bg-slate-50'  },
    { labelKey: 'dash_contacted', value: contacted, icon: Send,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { labelKey: 'dash_replied',   value: replied,   icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { labelKey: 'dash_calls',     value: calls,     icon: Phone,      color: 'text-purple-600', bg: 'bg-purple-50' },
    { labelKey: 'dash_pilots',    value: pilots,    icon: Rocket,     color: 'text-green-600',  bg: 'bg-green-50'  },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('dash_title', lang)}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t('dash_sub', lang)}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {stats.map(({ labelKey, value, icon: Icon, color, bg }) => (
          <div key={labelKey} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{t(labelKey, lang)}</div>
          </div>
        ))}
      </div>

      {/* Pipeline bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">{t('dash_pipeline', lang)}</h2>
        <div className="flex items-center gap-0 rounded-lg overflow-hidden h-10">
          {PIPELINE_STAGES.map((stage) => {
            const count = leads.filter(l => stage.statuses.includes(l.status)).length
            const pct   = total > 0 ? (count / total) * 100 : 0
            if (pct === 0) return null
            return (
              <div
                key={stage.label}
                className={`${stage.color} flex items-center justify-center text-xs font-semibold transition-all h-full`}
                style={{ width: `${pct}%`, minWidth: '60px' }}
                title={`${stage.label}: ${count}`}
              >
                {count} {stage.label}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* High priority */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">
              {t('dash_ready', lang)}
              {highPriority.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {highPriority.length}
                </span>
              )}
            </h2>
            <button onClick={() => navigate('/leads')}
              className="text-xs text-brand-500 hover:text-brand-700 flex items-center gap-1">
              {t('dash_view_all', lang)} <ArrowRight size={12} />
            </button>
          </div>
          {highPriority.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">{t('dash_no_high', lang)}</div>
          ) : (
            <div className="space-y-2">
              {highPriority.slice(0, 5).map(lead => (
                <div key={lead.id}
                  onClick={() => navigate('/leads')}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{lead.company}</div>
                    <div className="text-xs text-slate-400 truncate">{lead.nextAction || lead.likelyBuyer}</div>
                  </div>
                  <div className="text-sm font-bold text-brand-600 ml-3 shrink-0">{lead.totalScore}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">{t('dash_activity', lang)}</h2>
          <div className="space-y-2">
            {recentActivity.map(lead => (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{lead.company}</div>
                  <div className="text-xs text-slate-400">{lead.domain}</div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-3 shrink-0 ${STATUS_COLOR[lead.status]}`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ARR Goal tracker */}
      <ARRGoal leads={leads} />
    </div>
  )
}
