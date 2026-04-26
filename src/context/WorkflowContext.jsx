import React, { createContext, useContext, useState } from 'react'

const WorkflowContext = createContext(null)

const STORAGE_KEY = 'assis-wf-outputs'
const HISTORY_KEY = 'assis-wf-history'
const MAX_HISTORY = 4

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} }
}

export function WorkflowProvider({ children }) {
  const [outputs, setOutputs] = useState(() => load(STORAGE_KEY))
  const [history, setHistory] = useState(() => load(HISTORY_KEY))

  const saveOutput = (stepNum, text) => {
    // Save current output
    setOutputs(prev => {
      const next = { ...prev, [stepNum]: text }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
    // Save to history (keep last MAX_HISTORY)
    if (text) {
      setHistory(prev => {
        const prevArr = prev[stepNum] || []
        const entry = { text, timestamp: new Date().toISOString() }
        // Don't duplicate the same output
        if (prevArr.length && prevArr[0].text === text) return prev
        const next = {
          ...prev,
          [stepNum]: [entry, ...prevArr].slice(0, MAX_HISTORY),
        }
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch {}
        return next
      })
    }
  }

  const clearAll = () => {
    setOutputs({})
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    // Keep history when clearing current outputs
  }

  const clearHistory = (stepNum) => {
    setHistory(prev => {
      const next = { ...prev }
      delete next[stepNum]
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <WorkflowContext.Provider value={{ outputs, history, saveOutput, clearAll, clearHistory }}>
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  return useContext(WorkflowContext)
}
