import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Workflow from './pages/Workflow'
import Pipeline from './pages/Pipeline'
import Playbooks from './pages/Playbooks'
import Settings from './pages/Settings'
import { LeadsProvider } from './context/LeadsContext'
import { LanguageProvider, useLang } from './context/LanguageContext'
import { WorkflowProvider } from './context/WorkflowContext'

function AppInner() {
  const { isHe } = useLang()
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {/* ms-56 = margin-inline-start: 14rem — flips automatically with dir=rtl */}
      <main className="ms-56 flex-1 p-8 min-w-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/playbooks" element={<Playbooks />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <LeadsProvider>
        <WorkflowProvider>
          <AppInner />
        </WorkflowProvider>
      </LeadsProvider>
    </LanguageProvider>
  )
}
