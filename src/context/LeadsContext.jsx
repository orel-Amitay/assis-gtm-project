import React, { createContext, useContext, useState, useEffect } from 'react'
import { SAMPLE_LEADS } from '../data/sampleLeads'

const LeadsContext = createContext(null)

const STORAGE_KEY = 'assis-gtm-leads'

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return SAMPLE_LEADS
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
  }, [leads])

  const addLead = (lead) => {
    const newLead = {
      ...lead,
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setLeads(prev => [newLead, ...prev])
    return newLead
  }

  const updateLead = (id, updates) => {
    setLeads(prev => prev.map(l =>
      l.id === id
        ? { ...l, ...updates, updatedAt: new Date().toISOString() }
        : l
    ))
  }

  const deleteLead = (id) => {
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  const updateStatus = (id, status) => {
    updateLead(id, {
      status,
      lastContactDate: ['Sent', 'Replied', 'Positive', 'Call Scheduled'].includes(status)
        ? new Date().toISOString().split('T')[0]
        : undefined,
    })
  }

  // Fuzzy company name match (same logic as parseLeads.js)
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

  // Merge enriched leads into existing leads by company name match.
  // Preserves: id, createdAt, status (don't override status with 'New').
  // Updates: all non-empty enrichment fields.
  const enrichLeads = (enrichedLeads) => {
    setLeads(prev => prev.map(existing => {
      const match = enrichedLeads.find(el => fuzzyMatch(existing.company, el.company))
      if (!match) return existing
      const safeUpdates = Object.fromEntries(
        Object.entries(match).filter(([k, v]) =>
          v !== null && v !== '' && v !== undefined &&
          !['id', 'createdAt', 'status'].includes(k)
        )
      )
      return { ...existing, ...safeUpdates, updatedAt: new Date().toISOString() }
    }))
  }

  return (
    <LeadsContext.Provider value={{ leads, addLead, updateLead, deleteLead, updateStatus, enrichLeads }}>
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  const ctx = useContext(LeadsContext)
  if (!ctx) throw new Error('useLeads must be used within LeadsProvider')
  return ctx
}
