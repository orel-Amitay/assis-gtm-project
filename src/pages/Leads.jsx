import React, { useState, useMemo } from 'react'
import { Plus, Search, ChevronUp, ChevronDown, ExternalLink, Trash2, CheckSquare, Square, ChevronDown as ChevronDownIcon, Flag, Zap, Loader } from 'lucide-react'
import { useLeads } from '../context/LeadsContext'
import LeadModal from '../components/LeadModal'
import { useEnrichLead } from '../hooks/useEnrichLead'

const STATUSES = ['New','Reviewed','Sent','Replied','Positive','Call Scheduled','Demo Done','Pilot Proposed','Pilot Live','Not Interested','Future']
const PRIORITIES = ['High','Medium','Low','Skip']
const VERTICALS = ['Home','Electronics','Beauty']

const STATUS_COLOR = {
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

const PRIORITY_COLOR = {
  High: 'text-green-600 font-semibold',
  Medium: 'text-yellow-600 font-semibold',
  Low: 'text-slate-400',
  Skip: 'text-red-400',
}

const EMPTY_LEAD = {
  company: '', domain: '', vertical: 'Home', subCategory: '',
  shopify: 'Likely', estimatedSize: '', estimatedRevenue: '',
  aovEstimate: '', likelyBuyer: 'Founder', buyerName: '', buyerLinkedIn: '',
  painHypothesis: '', assisAngle: '',
  icpScore: null, frictionScore: null, founderScore: null,
  speedScore: null, caseStudyScore: null, aovScore: null, totalScore: null,
  priority: 'Medium',
  linkedinDraft: '', emailSubject: '', emailBody: '', followUp1: '', followUp2: '',
  status: 'New', lastContactDate: '', nextAction: '', notes: '',
}

export default function Leads() {
  const { leads, addLead, updateStatus, updateLead, deleteLead } = useLeads()
  const { enrichBatch, enriching } = useEnrichLead()
  const [search, setSearch] = useState('')
  const [filterVertical, setFilterVertical] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortKey, setSortKey] = useState('totalScore')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [addingLead, setAddingLead] = useState(false)
  const [newLead, setNewLead] = useState(EMPTY_LEAD)
  // Bulk selection
  const [checkedIds, setCheckedIds] = useState(new Set())
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const filtered = useMemo(() => {
    let result = [...leads]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.company.toLowerCase().includes(q) ||
        l.domain.toLowerCase().includes(q) ||
        (l.buyerName || '').toLowerCase().includes(q)
      )
    }
    if (filterVertical) result = result.filter(l => l.vertical === filterVertical)
    if (filterPriority) result = result.filter(l => l.priority === filterPriority)
    if (filterStatus) result = result.filter(l => l.status === filterStatus)
    result.sort((a, b) => {
      const av = a[sortKey] ?? -1
      const bv = b[sortKey] ?? -1
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return result
  }, [leads, search, filterVertical, filterPriority, filterStatus, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : null

  const handleAdd = () => {
    if (!newLead.company || !newLead.domain) return
    addLead(newLead)
    setNewLead(EMPTY_LEAD)
    setAddingLead(false)
  }

  // ── Bulk helpers ──────────────────────────────────────────────────────────
  const allChecked = filtered.length > 0 && filtered.every(l => checkedIds.has(l.id))
  const someChecked = filtered.some(l => checkedIds.has(l.id))
  const checkedCount = [...checkedIds].filter(id => filtered.some(l => l.id === id)).length

  const toggleCheck = (id, e) => {
    e.stopPropagation()
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(prev => {
        const next = new Set(prev)
        filtered.forEach(l => next.delete(l.id))
        return next
      })
    } else {
      setCheckedIds(prev => {
        const next = new Set(prev)
        filtered.forEach(l => next.add(l.id))
        return next
      })
    }
  }

  const handleBulkStatus = (status) => {
    checkedIds.forEach(id => updateStatus(id, status))
    setCheckedIds(new Set())
    setBulkStatusOpen(false)
  }

  const handleBulkDelete = () => {
    checkedIds.forEach(id => deleteLead(id))
    setCheckedIds(new Set())
    setConfirmDelete(false)
    setSelectedIndex(null)
  }

  const handleBulkPriority = (priority) => {
    checkedIds.forEach(id => updateLead(id, { priority }))
    setCheckedIds(new Set())
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm">{filtered.length} of {leads.length} leads</p>
        </div>
        <button
          onClick={() => setAddingLead(true)}
          className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company, domain, buyer..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {[
          { value: filterVertical, set: setFilterVertical, options: VERTICALS, placeholder: 'All verticals' },
          { value: filterPriority, set: setFilterPriority, options: PRIORITIES, placeholder: 'All priorities' },
          { value: filterStatus, set: setFilterStatus, options: STATUSES, placeholder: 'All statuses' },
        ].map(({ value, set, options, placeholder }, i) => (
          <select key={i} value={value} onChange={e => set(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {(search || filterVertical || filterPriority || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterVertical(''); setFilterPriority(''); setFilterStatus('') }}
            className="text-sm text-slate-400 hover:text-slate-600">Clear</button>
        )}
      </div>

      {/* Bulk action bar */}
      {checkedCount > 0 && (
        <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-brand-700">
            {checkedCount} lead{checkedCount !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {/* Bulk enrich */}
            {(() => {
              const selectedLeads = filtered.filter(l => checkedIds.has(l.id))
              const anyEnriching = selectedLeads.some(l => enriching[l.id] && enriching[l.id] !== 'done' && enriching[l.id] !== 'error')
              const doneCount = selectedLeads.filter(l => enriching[l.id] === 'done').length
              return (
                <button
                  onClick={() => enrichBatch(selectedLeads)}
                  disabled={anyEnriching}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    anyEnriching ? 'bg-purple-100 text-purple-400 cursor-wait' : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  {anyEnriching ? <Loader size={12} className="animate-spin" /> : <Zap size={12} />}
                  {anyEnriching
                    ? `Enriching… (${doneCount}/${selectedLeads.length})`
                    : `Enrich ${checkedCount} lead${checkedCount !== 1 ? 's' : ''}`}
                </button>
              )
            })()}

            {/* Bulk priority */}
            <div className="flex items-center gap-1">
              {PRIORITIES.filter(p => p !== 'Skip').map(p => (
                <button key={p} onClick={() => handleBulkPriority(p)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-400 hover:text-brand-600 font-medium transition-colors">
                  → {p}
                </button>
              ))}
              <button onClick={() => handleBulkPriority('Skip')}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-red-400 hover:text-red-600 font-medium transition-colors">
                → Skip
              </button>
            </div>

            {/* Bulk status */}
            <div className="relative">
              <button
                onClick={() => setBulkStatusOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-400 hover:text-brand-600 font-medium transition-colors"
              >
                Change status <ChevronDownIcon size={12} />
              </button>
              {bulkStatusOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1 overflow-hidden">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => handleBulkStatus(s)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Delete {checkedCount} leads?</span>
                <button onClick={handleBulkDelete}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium transition-colors">
                  Yes, delete
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            )}

            <button onClick={() => { setCheckedIds(new Set()); setConfirmDelete(false) }}
              className="text-xs text-slate-400 hover:text-slate-600 ml-1">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Add lead form */}
      {addingLead && (
        <div className="bg-white border border-brand-200 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">Add New Lead</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Company name *', 'company', 'text'],
              ['Domain *', 'domain', 'text'],
              ['Sub-category', 'subCategory', 'text'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                <input type={type} value={newLead[key] || ''}
                  onChange={e => setNewLead(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Vertical</label>
              <select value={newLead.vertical} onChange={e => setNewLead(f => ({ ...f, vertical: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {VERTICALS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Priority</label>
              <select value={newLead.priority} onChange={e => setNewLead(f => ({ ...f, priority: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Buyer Persona</label>
              <select value={newLead.likelyBuyer} onChange={e => setNewLead(f => ({ ...f, likelyBuyer: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                {['Founder','COO','Head of CX'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Pain hypothesis</label>
            <textarea value={newLead.painHypothesis || ''} rows={2}
              onChange={e => setNewLead(f => ({ ...f, painHypothesis: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600">
              Add Lead
            </button>
            <button onClick={() => setAddingLead(false)}
              className="text-slate-500 px-4 py-2 rounded-lg text-sm hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="pl-4 pr-2 py-3 w-8">
                <button onClick={toggleAll} className="text-slate-400 hover:text-brand-500 transition-colors">
                  {allChecked
                    ? <CheckSquare size={15} className="text-brand-500" />
                    : someChecked
                      ? <CheckSquare size={15} className="text-brand-300" />
                      : <Square size={15} />
                  }
                </button>
              </th>
              {[
                { label: 'Company', key: 'company' },
                { label: 'Vertical', key: 'vertical' },
                { label: 'Buyer', key: 'likelyBuyer' },
                { label: 'Score', key: 'totalScore' },
                { label: 'Priority', key: 'priority' },
                { label: 'Status', key: 'status' },
                { label: '', key: null },
              ].map(({ label, key }) => (
                <th key={label}
                  onClick={() => key && handleSort(key)}
                  className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${key ? 'cursor-pointer hover:text-slate-700 select-none' : ''}`}>
                  <div className="flex items-center gap-1">
                    {label}
                    {key && <SortIcon k={key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                  No leads found. Add your first lead or run the workflow.
                </td>
              </tr>
            ) : filtered.map((lead, i) => (
              <tr key={lead.id}
                onClick={() => setSelectedIndex(i)}
                className={`cursor-pointer transition-colors ${
                  lead.disqualified ? 'opacity-50 bg-red-50/40 hover:bg-red-50/60' :
                  checkedIds.has(lead.id) ? 'bg-brand-50 hover:bg-brand-50' : 'hover:bg-slate-50'
                }`}>
                <td className="pl-4 pr-2 py-3 w-8" onClick={e => toggleCheck(lead.id, e)}>
                  {checkedIds.has(lead.id)
                    ? <CheckSquare size={15} className="text-brand-500" />
                    : <Square size={15} className="text-slate-300 hover:text-slate-400" />
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-800">{lead.company}</span>
                    {lead.disqualified && <Flag size={11} className="text-red-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-slate-400">{lead.domain}</span>
                    <a href={`https://${lead.domain}`} target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-slate-300 hover:text-brand-500">
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-slate-600">{lead.vertical}</div>
                  {lead.subCategory && <div className="text-xs text-slate-400">{lead.subCategory}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="text-slate-600">{lead.likelyBuyer}</div>
                  {lead.buyerName && <div className="text-xs text-slate-400">{lead.buyerName}</div>}
                </td>
                <td className="px-4 py-3">
                  {lead.totalScore != null
                    ? <span className="text-base font-bold text-brand-600">{lead.totalScore}</span>
                    : <span className="text-slate-300">—</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm ${PRIORITY_COLOR[lead.priority] || ''}`}>
                    {lead.priority}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <select
                    value={lead.status}
                    onChange={e => updateStatus(lead.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 ${STATUS_COLOR[lead.status]}`}
                  >
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-300 text-xs">→</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIndex !== null && filtered[selectedIndex] && (
        <LeadModal
          lead={leads.find(l => l.id === filtered[selectedIndex].id) || filtered[selectedIndex]}
          onClose={() => setSelectedIndex(null)}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < filtered.length - 1}
          onPrev={() => setSelectedIndex(i => Math.max(0, i - 1))}
          onNext={() => setSelectedIndex(i => Math.min(filtered.length - 1, i + 1))}
          position={`${selectedIndex + 1} / ${filtered.length}`}
        />
      )}
    </div>
  )
}
