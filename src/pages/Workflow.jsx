import React, { useState, useEffect, useRef } from 'react'
import {
  Search, Database, BarChart2, MessageSquare,
  FileText, Send, ChevronRight, Clock, Zap,
  Play, Copy, Check, Download, AlertCircle, Trash2, ArrowRight,
  History, X, PlayCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { WORKFLOW_STEPS, VERTICAL_OPTIONS, SUBCATEGORIES } from '../data/prompts'
import { buildCompleteLeads, mergeStep2, mergeStep3, mergeStep4, parseStep1, stripMd } from '../data/parseLeads'
import { useClaude } from '../hooks/useClaude'
import { useLeads } from '../context/LeadsContext'
import { useWorkflow } from '../context/WorkflowContext'
import { useLang } from '../context/LanguageContext'
import { t } from '../data/translations'

const ICON_MAP = { Search, Database, BarChart2, MessageSquare, FileText, Send }

const COLOR_CLASSES = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700',   border: 'border-blue-200',   btn: 'bg-blue-500 hover:bg-blue-600'   },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', border: 'border-purple-200', btn: 'bg-purple-500 hover:bg-purple-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', border: 'border-orange-200', btn: 'bg-orange-500 hover:bg-orange-600' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  badge: 'bg-green-100 text-green-700',  border: 'border-green-200',  btn: 'bg-green-500 hover:bg-green-600'  },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200', btn: 'bg-indigo-500 hover:bg-indigo-600' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   badge: 'bg-teal-100 text-teal-700',   border: 'border-teal-200',   btn: 'bg-teal-500 hover:bg-teal-600'   },
}

const STEP1_COUNT_OPTIONS = [10, 15, 20, 25, 30]
const EXPECTED_SIZE = { 1: 9000, 2: 7000, 3: 6000, 4: 8000, 5: 4000, 6: 3000 }
const CHAIN_STEPS = { 2: 1, 3: 2, 4: 3 } // step N gets its input from step CHAIN_STEPS[N]
const AUTO_FLOW_STEPS = [1, 2, 3, 4] // steps that run automatically in full flow

// Re-export for use in StepRunner's individual import
const parseLeadsFromOutput = parseStep1

function ProgressBar({ output, loading, done, step, isHe }) {
  if (!loading && !done && !output) return null
  const expected = EXPECTED_SIZE[step] || 6000
  const pct = done ? 100 : Math.min(93, Math.round((output.length / expected) * 100))
  const wordCount = output.trim() ? output.trim().split(/\s+/).length : 0
  const stage = done
    ? (isHe ? '✓ הושלם' : '✓ Done')
    : output.length === 0
      ? (isHe ? 'מתחבר ל-Gemini...' : 'Connecting to Gemini...')
      : output.length < 300
        ? (isHe ? 'מתחיל לייצר...' : 'Starting...')
        : (isHe ? `מקבל תוצאות... ${wordCount} מילים` : `Streaming... ${wordCount} words`)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={`flex items-center gap-1.5 font-medium ${done ? 'text-green-600' : 'text-brand-500'}`}>
          {!done && loading && <span className="inline-block w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />}
          {stage}
        </span>
        <span className="text-slate-400 tabular-nums">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-green-500' : 'bg-brand-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function HistoryPanel({ stepNum, isHe, onRestore }) {
  const { history, clearHistory } = useWorkflow()
  const [open, setOpen] = useState(false)
  const entries = history[stepNum] || []
  if (!entries.length) return null
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        <History size={11} />
        {isHe ? `היסטוריה (${entries.length})` : `History (${entries.length})`}
        <ChevronRight size={10} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 border border-slate-100 rounded-xl overflow-hidden">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 mb-0.5">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                <div className="text-xs text-slate-600 truncate font-mono">
                  {entry.text.slice(0, 120)}...
                </div>
              </div>
              <button
                onClick={() => { onRestore(entry.text); setOpen(false) }}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium shrink-0"
              >
                {isHe ? 'שחזר' : 'Restore'}
              </button>
            </div>
          ))}
          <div className="p-2 bg-slate-50">
            <button
              onClick={() => { clearHistory(stepNum); setOpen(false) }}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              {isHe ? 'נקה היסטוריה' : 'Clear history'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepRunner({
  step, vertical, subCategoryLabel,
  forceOpen, autoRun, fullFlowMode,
  onAutoAdvance, onFullFlowComplete,
  prevStepOutput,
}) {
  const [open, setOpen] = useState(false)
  const [input1, setInput1] = useState('')
  const [input2, setInput2] = useState('')
  const [leadCount, setLeadCount] = useState(25)
  const [copied, setCopied] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [restoredOutput, setRestoredOutput] = useState('')

  const { output: liveOutput, loading, error, done, run, reset } = useClaude()
  const { outputs, saveOutput } = useWorkflow()
  const { addLead, addLeads } = useLeads()
  const navigate = useNavigate()
  const { lang } = useLang()
  const isHe = lang === 'he'

  const savedOutput = outputs[step.step] || ''
  const displayOutput = restoredOutput || liveOutput || savedOutput
  const isDone = done || (!loading && !liveOutput && !!savedOutput)

  const colors = COLOR_CLASSES[step.color] || COLOR_CLASSES.blue
  const Icon = ICON_MAP[step.icon] || Search
  const needsInput1 = step.step >= 2
  const needsInput2 = step.step >= 5

  // Force open — also reset input1 so it gets refilled from the current prevStepOutput
  useEffect(() => {
    if (forceOpen) {
      setOpen(true)
      setRestoredOutput('')
      setInput1('')
      ranAutoRef.current = false
    }
  }, [forceOpen])

  // Auto-fill input1 from previous step output
  useEffect(() => {
    if (prevStepOutput && !input1 && CHAIN_STEPS[step.step]) {
      setInput1(prevStepOutput)
    }
  }, [prevStepOutput])

  // Auto-run trigger
  const ranAutoRef = useRef(false)
  useEffect(() => {
    if (autoRun && open && !loading && !ranAutoRef.current) {
      const canRun = !needsInput1 || input1
      if (canRun) {
        ranAutoRef.current = true
        reset()
        setRestoredOutput('')
        const prompt = step.generatePrompt(vertical, input1 || undefined, input2 || undefined, leadCount)
        run(prompt)
      }
    }
  }, [autoRun, open, input1])

  // Save output + trigger full flow advance
  useEffect(() => {
    if (done && liveOutput) {
      saveOutput(step.step, liveOutput)

      // In full flow mode, step 1 auto-imports leads immediately (no need to click the button)
      if (fullFlowMode && step.step === 1) {
        handleImportLeads()
      }

      // In full flow mode (steps 1-4), auto-advance to next step
      if (fullFlowMode && AUTO_FLOW_STEPS.includes(step.step)) {
        const nextStep = step.step + 1
        const capturedOutput = liveOutput
        const capturedStep = step.step
        setTimeout(() => {
          if (nextStep <= 4) {
            onAutoAdvance?.(nextStep, true)
          } else {
            // Pass the fresh step 4 output directly to avoid stale closure
            onFullFlowComplete?.({ stepNum: capturedStep, output: capturedOutput })
          }
        }, 600)
      }
    }
  }, [done, liveOutput, fullFlowMode])

  const handleRun = () => {
    ranAutoRef.current = false
    reset()
    setImportDone(false)
    setRestoredOutput('')
    const prompt = step.generatePrompt(vertical, input1 || undefined, input2 || undefined, leadCount)
    run(prompt)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(displayOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleImportLeads = () => {
    const mainVertical = vertical.split(' — specifically:')[0].trim().split(' / ')[0]
    // Use all saved outputs if available, otherwise just step 1
    const allOutputs = {
      1: displayOutput,
      2: outputs[2] || '',
      3: outputs[3] || '',
      4: outputs[4] || '',
    }
    const hasEnrichment = outputs[2] || outputs[3] || outputs[4]
    let parsed
    if (hasEnrichment) {
      parsed = buildCompleteLeads(allOutputs, vertical, subCategoryLabel)
    } else {
      parsed = parseLeadsFromOutput(displayOutput).map(l => ({
        ...l,
        company: stripMd(l.company),
        domain: stripMd(l.domain),
        vertical: mainVertical || 'Home',
        subCategory: subCategoryLabel || l.subCategory || '',
      }))
    }
    addLeads(parsed)
    setImportDone(true)
  }

  const INPUT1_LABELS = {
    2: { label: isHe ? 'לידים גולמיים (משלב 1)' : 'Raw leads (from Step 1)', ph: isHe ? 'הדבק תוצאות שלב 1 כאן...' : 'Paste Step 1 output here...' },
    3: { label: isHe ? 'לידים מועשרים (משלב 2)' : 'Enriched leads (from Step 2)', ph: isHe ? 'הדבק תוצאות שלב 2 כאן...' : 'Paste Step 2 output here...' },
    4: { label: isHe ? 'לידים עם ציונים (משלב 3)' : 'Scored leads (from Step 3)', ph: isHe ? 'הדבק תוצאות שלב 3 כאן...' : 'Paste Step 3 output here...' },
    5: { label: isHe ? 'שם חברה' : 'Company name', ph: 'e.g., Drift & Wren Sleep Co.' },
    6: { label: isHe ? 'שם חברה' : 'Company name', ph: 'e.g., Croft & Mallow Furniture' },
  }

  const canAdvance = (isDone || done) && step.step < WORKFLOW_STEPS.length && !fullFlowMode
  const nextStepObj = WORKFLOW_STEPS.find(s => s.step === step.step + 1)
  const canAutoRunNext = step.step < 4

  return (
    <div className={`bg-white rounded-xl border ${colors.border} shadow-sm overflow-hidden`}>
      <div
        className="flex items-center p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon size={18} className={colors.text} />
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
              {isHe ? `שלב ${step.step}` : `Step ${step.step}`}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={11} /> {step.estimatedTime}
            </div>
            {(isDone || done) && !loading && (
              <span className="text-xs text-green-600 font-medium">✓ {isHe ? 'הושלם' : 'Done'}</span>
            )}
            {loading && (
              <span className="flex items-center gap-1 text-xs text-brand-500 font-medium">
                <span className="inline-block w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                {isHe ? 'רץ...' : 'Running...'}
              </span>
            )}
          </div>
          <div className="font-semibold text-slate-900">{step.title}</div>
          <div className="text-sm text-slate-500 mt-0.5">{step.description}</div>
        </div>
        <div className="ml-4 shrink-0">
          <ChevronRight size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-4">

          {/* Step 1: lead count */}
          {step.step === 1 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-slate-700">
                {isHe ? 'כמה עסקים למצוא?' : 'How many companies?'}
              </span>
              <div className="flex items-center gap-1.5">
                {STEP1_COUNT_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setLeadCount(n)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      leadCount === n ? 'bg-brand-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inputs */}
          {needsInput1 && INPUT1_LABELS[step.step] && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  {INPUT1_LABELS[step.step].label}
                </label>
                {CHAIN_STEPS[step.step] && prevStepOutput && !input1 && (
                  <button
                    onClick={() => setInput1(prevStepOutput)}
                    className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                  >
                    <ArrowRight size={11} />
                    {isHe ? 'מלא מהשלב הקודם' : 'Fill from previous step'}
                  </button>
                )}
              </div>
              {step.step >= 5 ? (
                <input
                  value={input1}
                  onChange={e => setInput1(e.target.value)}
                  placeholder={INPUT1_LABELS[step.step].ph}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <textarea
                  value={input1}
                  onChange={e => setInput1(e.target.value)}
                  placeholder={INPUT1_LABELS[step.step].ph}
                  rows={4}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
                />
              )}
            </div>
          )}

          {needsInput2 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {isHe ? 'סוג שיחה' : 'Call type'}
              </label>
              <input
                value={input2}
                onChange={e => setInput2(e.target.value)}
                placeholder="Intro call / Demo / Pilot close"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <div className="text-sm text-red-700">
                {error === 'NO_KEY'
                  ? <span>{isHe ? 'לא הוגדר API key. ' : 'No API key configured. '}<button onClick={() => navigate('/settings')} className="underline font-medium">{isHe ? 'עבור להגדרות' : 'Go to Settings'}</button></span>
                  : error}
              </div>
            </div>
          )}

          {/* Progress */}
          <ProgressBar output={liveOutput} loading={loading} done={done} step={step.step} isHe={isHe} />

          {/* Output */}
          {displayOutput && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">
                  {isHe ? 'תוצאה' : 'Output'}
                  {loading && <span className="ml-2 inline-block w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />}
                  {restoredOutput && <span className="ml-2 text-xs text-amber-500">{isHe ? '(שוחזר)' : '(restored)'}</span>}
                </label>
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-500">
                  {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                  {copied ? (isHe ? 'הועתק' : 'Copied') : (isHe ? 'העתק' : 'Copy')}
                </button>
              </div>
              <textarea
                readOnly
                value={displayOutput}
                rows={14}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 bg-slate-50 font-mono resize-y focus:outline-none leading-relaxed"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRun}
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colors.btn}`}
            >
              <Play size={14} />
              {loading
                ? (isHe ? 'רץ...' : 'Running...')
                : (isDone || done) ? (isHe ? 'הרץ שוב' : 'Run again')
                : (isHe ? 'הרץ עם Gemini' : 'Run with Gemini')}
            </button>

            {/* Step 1: import */}
            {step.step === 1 && (isDone || done) && displayOutput && (
              <button
                onClick={handleImportLeads}
                disabled={importDone}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 transition-all"
              >
                <Download size={14} />
                {importDone ? (isHe ? '✓ יובאו!' : '✓ Imported!') : (isHe ? 'ייבא לידים' : 'Import leads')}
              </button>
            )}
            {importDone && (
              <button onClick={() => navigate('/leads')} className="text-sm text-brand-500 hover:text-brand-600 underline font-medium">
                {isHe ? 'עבור לטבלה →' : 'View leads →'}
              </button>
            )}

            {/* Continue to next step (manual mode) */}
            {canAdvance && !loading && nextStepObj && (
              <button
                onClick={() => onAutoAdvance?.(step.step + 1, canAutoRunNext && !!CHAIN_STEPS[step.step + 1])}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-700 text-white hover:bg-slate-800 transition-all"
              >
                <ArrowRight size={14} />
                {isHe ? `המשך לשלב ${step.step + 1}` : `Continue to Step ${step.step + 1}`}
              </button>
            )}

            {/* Clear saved */}
            {savedOutput && !liveOutput && (
              <button
                onClick={() => { saveOutput(step.step, ''); setRestoredOutput('') }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors ml-auto"
              >
                <Trash2 size={11} />
                {isHe ? 'נקה' : 'Clear'}
              </button>
            )}
          </div>

          {/* History */}
          <HistoryPanel stepNum={step.step} isHe={isHe} onRestore={(text) => setRestoredOutput(text)} />
        </div>
      )}
    </div>
  )
}

// ── Leads preview table (shown after full flow completes) ─────────────────
function LeadsPreview({ leads, subCategoryLabel, onImport, onDismiss, isHe }) {
  const [selected, setSelected] = useState(() => new Set(leads.map((_, i) => i)))
  const [imported, setImported] = useState(false)
  const navigate = useNavigate()

  const toggle = (i) => setSelected(prev => {
    const next = new Set(prev)
    if (next.has(i)) next.delete(i); else next.add(i)
    return next
  })
  const toggleAll = () => setSelected(
    selected.size === leads.length ? new Set() : new Set(leads.map((_, i) => i))
  )

  const handleImport = () => {
    const toImport = leads.filter((_, i) => selected.has(i))
    onImport(toImport)
    setImported(true)
  }

  if (!leads.length) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-700">
      {isHe ? 'לא נמצאו לידים בפורמט הנכון בפלט שלב 1. בדקי שהפלט כולל בלוקים עם "Company:" ו-"Domain:".' : 'No leads found in Step 1 output. Make sure the output contains blocks with "Company:" and "Domain:" fields.'}
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-green-300 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-green-50 border-b border-green-200">
        <div>
          <div className="font-semibold text-green-800 flex items-center gap-2">
            <Check size={15} className="text-green-600" />
            {isHe ? `${leads.length} לידים נמצאו` : `${leads.length} leads found`}
            {subCategoryLabel && (
              <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{subCategoryLabel}</span>
            )}
          </div>
          <div className="text-xs text-green-600 mt-0.5">
            {isHe ? `${selected.size} נבחרו לייבוא` : `${selected.size} selected for import`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {imported ? (
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all"
            >
              {isHe ? 'עבור לטבלת הלידים →' : 'View leads table →'}
            </button>
          ) : (
            <>
              <button onClick={onDismiss} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1">
                {isHe ? 'סגור' : 'Dismiss'}
              </button>
              <button
                onClick={handleImport}
                disabled={!selected.size}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-40 transition-all"
              >
                <Download size={14} />
                {isHe ? `ייבא ${selected.size} לידים` : `Import ${selected.size} leads`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      {!imported && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.size === leads.length}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
                {[
                  isHe ? 'חברה' : 'Company',
                  isHe ? 'תת-קטגוריה' : 'Sub-category',
                  'AOV',
                  isHe ? 'עסקאות/חודש' : 'Monthly Orders',
                  isHe ? 'קונה' : 'Buyer',
                  isHe ? 'כאב' : 'Pain',
                ].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.map((lead, i) => (
                <tr
                  key={i}
                  onClick={() => toggle(i)}
                  className={`cursor-pointer transition-colors ${selected.has(i) ? 'hover:bg-slate-50' : 'opacity-40 hover:opacity-60'}`}
                >
                  <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} className="cursor-pointer" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800">{lead.company}</div>
                    <div className="text-xs text-slate-400">{lead.domain}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{lead.subCategory || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 font-medium">{lead.aovEstimate || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{lead.monthlyOrders || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{lead.likelyBuyer}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400 max-w-xs">
                    <div className="truncate max-w-[220px]">{lead.painHypothesis || '—'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {imported && (
        <div className="p-5 text-sm text-green-700 bg-green-50">
          ✓ {isHe ? `${selected.size} לידים יובאו בהצלחה לטבלה` : `${selected.size} leads imported successfully`}
        </div>
      )}
    </div>
  )
}

// ── Full flow global progress banner ──────────────────────────────────────
function FullFlowBanner({ currentStep, totalSteps, onStop, isHe }) {
  const steps = [1, 2, 3, 4]
  return (
    <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-brand-700">
            {currentStep > 4
              ? (isHe ? '✓ הריצה הושלמה!' : '✓ Full flow complete!')
              : isHe ? `מריץ שלב ${currentStep} מתוך ${totalSteps}...` : `Running Step ${currentStep} of ${totalSteps}...`}
          </span>
        </div>
        <button
          onClick={onStop}
          className="flex items-center gap-1 text-xs text-brand-400 hover:text-red-500 transition-colors"
        >
          <X size={12} />
          {isHe ? 'עצור' : 'Stop'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        {steps.map((s, idx) => {
          const isDone = currentStep > s
          const isActive = currentStep === s
          const isPending = currentStep < s
          return (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isDone ? 'bg-green-100 text-green-700' :
                isActive ? 'bg-brand-500 text-white' :
                'bg-slate-100 text-slate-400'
              }`}>
                {isDone ? '✓' : isActive ? <span className="inline-block w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> : null}
                {isHe ? `שלב ${s}` : `Step ${s}`}
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-px w-4 ${currentStep > s ? 'bg-green-300' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
      {currentStep > 4 && (
        <div className="mt-3 text-xs text-brand-600">
          {isHe
            ? '✓ כל הלידים יובאו ועושרו. עברי ל-Leads לראות את כולם עם ציונים וטיוטות פנייה. לפני שיחה — הרצי שלב 5.'
            : '✓ All leads imported and enriched. Go to Leads to see scores and outreach drafts. Before a call — run Step 5.'}
        </div>
      )}
    </div>
  )
}

export default function Workflow() {
  const [vertical, setVertical] = useState('Home / Mattress / Furniture')
  const [subCategory, setSubCategory] = useState('')
  const [customSubCat, setCustomSubCat] = useState('')
  const [pendingStep, setPendingStep] = useState(null)
  const [pendingAutoRun, setPendingAutoRun] = useState(null)
  const [fullFlowMode, setFullFlowMode] = useState(false)
  const [fullFlowCurrentStep, setFullFlowCurrentStep] = useState(null)
  const [previewLeads, setPreviewLeads] = useState(null) // null = hidden, [] = shown
  const { lang } = useLang()
  const { outputs, clearAll } = useWorkflow()
  const { leads, addLead, addLeads, updateLead } = useLeads()
  const navigate = useNavigate()
  const isHe = lang === 'he'

  // Auto-enrich leads whenever a step output changes or new leads are imported.
  // Uses a ref to track which output text has already been applied, so we never double-apply.
  const enrichedRef = useRef({ 2: '', 3: '', 4: '' })
  const updateLeadRef = useRef(updateLead)
  useEffect(() => { updateLeadRef.current = updateLead }, [updateLead])

  useEffect(() => {
    if (!leads.length) return
    const toApply = [2, 3, 4].filter(s => outputs[s] && outputs[s] !== enrichedRef.current[s])
    if (!toApply.length) return

    let enriched = leads.map(l => ({ ...l }))
    toApply.forEach(s => {
      enrichedRef.current[s] = outputs[s]
      if (s === 2) enriched = mergeStep2(outputs[2], enriched)
      else if (s === 3) enriched = mergeStep3(outputs[3], enriched)
      else if (s === 4) enriched = mergeStep4(outputs[4], enriched)
    })
    enriched.forEach(l => updateLeadRef.current(l.id, l))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputs[2], outputs[3], outputs[4], leads.length])

  const startFullFlow = () => {
    setFullFlowMode(true)
    setFullFlowCurrentStep(1)
    setPendingStep(1)
    setPendingAutoRun(1)
    setPreviewLeads(null)
    setTimeout(() => {
      const el = document.getElementById('step-card-1')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const stopFullFlow = () => {
    setFullFlowMode(false)
    setFullFlowCurrentStep(null)
    setPendingStep(null)
    setPendingAutoRun(null)
  }

  const handleAutoAdvance = (nextStepNum, shouldAutoRun) => {
    if (fullFlowMode) setFullFlowCurrentStep(nextStepNum)
    setPendingStep(nextStepNum)
    setPendingAutoRun(shouldAutoRun ? nextStepNum : null)
    setTimeout(() => {
      const el = document.getElementById(`step-card-${nextStepNum}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  const handleFullFlowComplete = ({ stepNum, output } = {}) => {
    setFullFlowCurrentStep(5) // mark as "past step 4" = done
    setPendingStep(null)
    setPendingAutoRun(null)
    // Merge fresh step output with saved outputs to avoid stale closure
    const activeSub = subCategory === '__custom__' ? customSubCat : subCategory
    const freshOutputs = stepNum ? { ...outputs, [stepNum]: output } : outputs
    const complete = buildCompleteLeads(freshOutputs, vertical, activeSub)
    if (complete.length > 0) {
      setPreviewLeads(complete)
      setTimeout(() => {
        const el = document.getElementById('leads-preview-section')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 400)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('wf_title', lang)}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('wf_sub', lang)}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-500">{t('wf_vertical', lang)}</span>
          <select
            value={vertical}
            onChange={e => { setVertical(e.target.value); setSubCategory(''); setCustomSubCat(''); clearAll() }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700"
          >
            {VERTICAL_OPTIONS.map(v => <option key={v}>{v}</option>)}
          </select>
          <select
            value={subCategory}
            onChange={e => { setSubCategory(e.target.value); if (e.target.value !== '__custom__') setCustomSubCat('') }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700"
          >
            <option value="">{isHe ? 'כל תת-קטגוריות' : 'All sub-categories'}</option>
            {(SUBCATEGORIES[vertical] || []).map(s => <option key={s} value={s}>{s}</option>)}
            <option value="__custom__">{isHe ? '+ הוסף מותאם אישית...' : '+ Custom...'}</option>
          </select>
          {subCategory === '__custom__' && (
            <input
              value={customSubCat}
              onChange={e => setCustomSubCat(e.target.value)}
              placeholder={isHe ? 'הכנס תת-קטגוריה...' : 'Type sub-category...'}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white w-44"
            />
          )}
          {!fullFlowMode ? (
            <button
              onClick={startFullFlow}
              className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-600 transition-all shadow-sm"
            >
              <PlayCircle size={15} />
              {isHe ? 'הרץ שלבים 1-4 אוטומטית' : 'Run Steps 1–4 Automatically'}
            </button>
          ) : (
            <button
              onClick={stopFullFlow}
              className="flex items-center gap-2 bg-red-50 text-red-500 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all"
            >
              <X size={15} />
              {isHe ? 'עצור ריצה' : 'Stop flow'}
            </button>
          )}
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 border border-slate-200 rounded-lg"
          >
            <Trash2 size={11} />
            {isHe ? 'נקה הכל' : 'Clear all'}
          </button>
        </div>
      </div>

      {/* Full flow progress banner */}
      {fullFlowMode && (
        <FullFlowBanner
          currentStep={fullFlowCurrentStep}
          totalSteps={4}
          onStop={stopFullFlow}
          isHe={isHe}
        />
      )}

      {/* Leads preview (auto-shown after full flow completes) */}
      {previewLeads !== null && (
        <div id="leads-preview-section">
          <LeadsPreview
            leads={previewLeads}
            subCategoryLabel={subCategory === '__custom__' ? customSubCat : subCategory}
            onImport={(toImport) => {
              addLeads(toImport)
            }}
            onDismiss={() => setPreviewLeads(null)}
            isHe={isHe}
          />
        </div>
      )}

      {/* How it works (only when not in full flow) */}
      {!fullFlowMode && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          {/* Main flow — 3 steps */}
          <div className="flex items-stretch gap-2">
            {(isHe ? [
              { n: '1', title: 'בחרי ורטיקל', sub: 'ולחצי "הרץ שלבים 1-4"' },
              { n: '2', title: 'ייבאי לידים', sub: 'כששלב 1 מסיים' },
              { n: '3', title: 'עברי ל-Leads', sub: 'ותראי את התוצאות' },
            ] : [
              { n: '1', title: 'Pick a vertical', sub: 'then click "Run Steps 1–4"' },
              { n: '2', title: 'Import leads', sub: 'when Step 1 finishes' },
              { n: '3', title: 'Go to Leads', sub: 'and see the results' },
            ]).map((item, i, arr) => (
              <React.Fragment key={item.n}>
                <div className="flex-1 bg-white rounded-lg px-3 py-2.5 border border-slate-200 text-center">
                  <div className="text-xs font-bold text-brand-500 mb-0.5">{item.n}</div>
                  <div className="text-sm font-semibold text-slate-800 leading-tight">{item.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.sub}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-center text-slate-300 text-lg shrink-0">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Secondary note */}
          <p className="text-xs text-slate-400 mt-3 text-center">
            {isHe
              ? 'שלבים 2-4 מעשירים את הלידים אוטומטית תוך כדי. לפני שיחה — שלב 5. אחרי שיחה חיובית — שלב 6.'
              : 'Steps 2–4 enrich leads automatically in the background. Before a call — Step 5. After a positive call — Step 6.'}
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {WORKFLOW_STEPS.map((step, i) => {
          const isLast = i === WORKFLOW_STEPS.length - 1
          const prevStepNum = CHAIN_STEPS[step.step]
          const prevStepOutput = prevStepNum ? (outputs[prevStepNum] || '') : ''
          const activeSub = subCategory === '__custom__' ? customSubCat : subCategory
          const effectiveVertical = activeSub
            ? `${vertical} — specifically: ${activeSub}`
            : vertical
          return (
            <div key={step.id} id={`step-card-${step.step}`}>
              <StepRunner
                step={step}
                vertical={effectiveVertical}
                subCategoryLabel={activeSub}
                forceOpen={pendingStep === step.step}
                autoRun={pendingAutoRun === step.step}
                fullFlowMode={fullFlowMode && AUTO_FLOW_STEPS.includes(step.step)}
                prevStepOutput={prevStepOutput}
                onAutoAdvance={handleAutoAdvance}
                onFullFlowComplete={handleFullFlowComplete}
              />
              {!isLast && (
                <div className="flex justify-center py-1">
                  <div className="w-px h-4 bg-slate-200" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
