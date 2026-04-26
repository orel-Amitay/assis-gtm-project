import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { SAMPLE_LEADS } from '../data/sampleLeads'
import { supabase } from '../lib/supabase'

const LeadsContext = createContext(null)
const LOCAL_KEY = 'assis-gtm-leads'

function domainKey(lead) {
  return lead.domain?.toLowerCase().replace(/^www\./, '').trim() || ''
}

function dedup(list) {
  const seen = new Set()
  return list.filter(lead => {
    const key = domainKey(lead) || lead.company?.toLowerCase().trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function makeId() {
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const migrated = useRef(false)

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('data, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error)
      try {
        const stored = localStorage.getItem(LOCAL_KEY)
        setLeads(stored ? dedup(JSON.parse(stored)) : SAMPLE_LEADS)
      } catch {
        setLeads(SAMPLE_LEADS)
      }
      setLoading(false)
      return
    }

    const remote = dedup(data.map(r => r.data))

    // One-time migration: if Supabase is empty and localStorage has real data, upload it
    if (remote.length === 0 && !migrated.current) {
      migrated.current = true
      try {
        const stored = localStorage.getItem(LOCAL_KEY)
        if (stored) {
          const local = dedup(JSON.parse(stored))
          if (local.length > 0 && local[0].id !== SAMPLE_LEADS[0]?.id) {
            const rows = local.map(l => ({ id: l.id || makeId(), data: { ...l, id: l.id || makeId() }, updated_at: l.updatedAt || new Date().toISOString() }))
            await supabase.from('leads').upsert(rows)
            setLeads(dedup(rows.map(r => r.data)))
            setLoading(false)
            return
          }
        }
      } catch {}
    }

    setLeads(remote.length > 0 ? remote : SAMPLE_LEADS)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()

    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchLeads])

  const upsertToSupabase = async (lead) => {
    await supabase.from('leads').upsert({
      id: lead.id,
      data: lead,
      updated_at: lead.updatedAt || new Date().toISOString(),
    })
  }

  const addLead = useCallback(async (lead) => {
    const key = domainKey(lead) || lead.company?.toLowerCase().trim()
    if (key && leads.some(l => (domainKey(l) || l.company?.toLowerCase().trim()) === key)) return null

    const newLead = {
      ...lead,
      id: makeId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setLeads(prev => [newLead, ...prev])
    await upsertToSupabase(newLead)
    return newLead
  }, [leads])

  const addLeads = useCallback(async (newLeads) => {
    const existingKeys = new Set(
      leads.map(l => domainKey(l) || l.company?.toLowerCase().trim()).filter(Boolean)
    )
    const seenInBatch = new Set()
    const toAdd = []

    for (const lead of newLeads) {
      const key = domainKey(lead) || lead.company?.toLowerCase().trim()
      if (key && (existingKeys.has(key) || seenInBatch.has(key))) continue
      if (key) seenInBatch.add(key)
      toAdd.push({
        ...lead,
        id: makeId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    if (!toAdd.length) return
    setLeads(prev => [...toAdd, ...prev])
    await supabase.from('leads').upsert(
      toAdd.map(l => ({ id: l.id, data: l, updated_at: l.updatedAt }))
    )
  }, [leads])

  const updateLead = useCallback(async (id, updates) => {
    const updatedAt = new Date().toISOString()
    let updated
    setLeads(prev => prev.map(l => {
      if (l.id !== id) return l
      updated = { ...l, ...updates, updatedAt }
      return updated
    }))
    if (updated) await upsertToSupabase(updated)
  }, [])

  const deleteLead = useCallback(async (id) => {
    setLeads(prev => prev.filter(l => l.id !== id))
    await supabase.from('leads').delete().eq('id', id)
  }, [])

  const updateStatus = useCallback((id, status) => {
    updateLead(id, {
      status,
      lastContactDate: ['Sent', 'Replied', 'Positive', 'Call Scheduled'].includes(status)
        ? new Date().toISOString().split('T')[0]
        : undefined,
    })
  }, [updateLead])

  function fuzzyMatch(a, b) {
    a = a.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
    b = b.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
    if (!a || !b) return false
    if (a === b) return true
    if (a.includes(b) || b.includes(a)) return true
    const aW = a.split(' ').filter(w => w.length > 2)
    const bW = b.split(' ').filter(w => w.length > 2)
    const shared = aW.filter(w => bW.some(bw => bw.includes(w) || w.includes(bw))).length
    return shared >= 1 && (shared / Math.max(aW.length, bW.length)) >= 0.4
  }

  const enrichLeads = useCallback((enrichedLeads) => {
    setLeads(prev => prev.map(existing => {
      const match = enrichedLeads.find(el => fuzzyMatch(existing.company, el.company))
      if (!match) return existing
      const safeUpdates = Object.fromEntries(
        Object.entries(match).filter(([k, v]) =>
          v !== null && v !== '' && v !== undefined &&
          !['id', 'createdAt', 'status'].includes(k)
        )
      )
      const updated = { ...existing, ...safeUpdates, updatedAt: new Date().toISOString() }
      upsertToSupabase(updated)
      return updated
    }))
  }, [])

  return (
    <LeadsContext.Provider value={{ leads, loading, addLead, addLeads, updateLead, deleteLead, updateStatus, enrichLeads }}>
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  const ctx = useContext(LeadsContext)
  if (!ctx) throw new Error('useLeads must be used within LeadsProvider')
  return ctx
}
