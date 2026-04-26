import React, { useState } from 'react'
import { useLeads } from '../context/LeadsContext'
import LeadModal from '../components/LeadModal'
import { useLang } from '../context/LanguageContext'
import { t } from '../data/translations'

const COLUMNS = [
  { id: 'to-contact',   labelKey: 'pipe_col_contact',  statuses: ['New', 'Reviewed'],                color: 'border-slate-300',  bg: 'bg-slate-50',   dot: 'bg-slate-400'   },
  { id: 'outreach',     labelKey: 'pipe_col_outreach',  statuses: ['Sent'],                           color: 'border-blue-300',   bg: 'bg-blue-50',    dot: 'bg-blue-500'    },
  { id: 'engaged',      labelKey: 'pipe_col_engaged',   statuses: ['Replied', 'Positive'],            color: 'border-orange-300', bg: 'bg-orange-50',  dot: 'bg-orange-500'  },
  { id: 'calls',        labelKey: 'pipe_col_calls',     statuses: ['Call Scheduled', 'Demo Done'],    color: 'border-purple-300', bg: 'bg-purple-50',  dot: 'bg-purple-500'  },
  { id: 'pilots',       labelKey: 'pipe_col_pilots',    statuses: ['Pilot Proposed', 'Pilot Live'],   color: 'border-green-300',  bg: 'bg-green-50',   dot: 'bg-green-500'   },
  { id: 'closed',       labelKey: 'pipe_col_closed',    statuses: ['Not Interested', 'Future'],       color: 'border-red-200',    bg: 'bg-red-50',     dot: 'bg-red-400'     },
]

const PRIORITY_DOT = {
  High:   'bg-green-500',
  Medium: 'bg-yellow-400',
  Low:    'bg-slate-300',
  Skip:   'bg-red-400',
}

export default function Pipeline() {
  const { leads, updateStatus } = useLeads()
  const [selectedLead, setSelectedLead] = useState(null)
  const { lang } = useLang()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('pipe_title', lang)}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{leads.length} {t('pipe_sub', lang)}</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const colLeads = leads.filter(l => col.statuses.includes(l.status))
          return (
            <div key={col.id} className="flex-shrink-0 w-64">
              {/* Column header */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl border-t border-x ${col.color} ${col.bg}`}>
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-slate-700">{t(col.labelKey, lang)}</span>
                <span className="ml-auto text-xs font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded-full">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className={`min-h-[200px] rounded-b-xl border-b border-x ${col.color} ${col.bg} p-2 space-y-2`}>
                {colLeads.length === 0 && (
                  <div className="text-center py-8 text-slate-300 text-xs">{t('pipe_no_leads', lang)}</div>
                )}
                {colLeads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div className="font-medium text-slate-800 text-sm leading-tight">{lead.company}</div>
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${PRIORITY_DOT[lead.priority]}`} title={lead.priority} />
                    </div>
                    <div className="text-xs text-slate-400 truncate mb-2">{lead.domain}</div>
                    {lead.totalScore != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{lead.vertical}</span>
                        <span className="text-xs font-bold text-brand-600">{lead.totalScore}</span>
                      </div>
                    )}
                    {lead.nextAction && (
                      <div className="mt-2 text-xs text-brand-600 font-medium truncate">
                        → {lead.nextAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selectedLead && (
        <LeadModal
          lead={leads.find(l => l.id === selectedLead.id) || selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  )
}
