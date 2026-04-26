import React, { useState } from 'react'
import { X, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

export default function PromptModal({ step, vertical, onClose }) {
  const [copied, setCopied] = useState(false)
  const [input1, setInput1] = useState('')
  const [input2, setInput2] = useState('')
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)

  const prompt = step.generatePrompt(vertical, input1 || undefined, input2 || undefined)

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const needsInput1 = step.step >= 2
  const needsInput2 = step.step === 5

  const INPUT1_LABELS = {
    2: { label: 'Raw leads (from Step 1)', placeholder: 'Paste the raw lead list output from Step 1 here...' },
    3: { label: 'Enriched leads (from Step 2)', placeholder: 'Paste the enriched lead list output from Step 2 here...' },
    4: { label: 'Scored leads (from Step 3)', placeholder: 'Paste the scored leads output from Step 3 here — include enrichment data for personalization...' },
    5: { label: 'Company name', placeholder: 'e.g., Drift & Wren Sleep Co.' },
    6: { label: 'Company name', placeholder: 'e.g., Croft & Mallow Furniture' },
  }

  const INPUT2_LABELS = {
    5: { label: 'Call type', placeholder: 'Intro call / Demo / Pilot close' },
    6: { label: 'Use case', placeholder: 'e.g., Save cancellations during shipping delay window' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${step.color}-100 text-${step.color}-700`}>
                Step {step.step}
              </span>
              <span className="text-xs text-slate-400">{step.estimatedTime}</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{step.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 text-sm">
            <div className="font-medium text-blue-800 mb-1">How to use this prompt</div>
            <ol className="text-blue-700 space-y-1 list-decimal list-inside">
              <li>Open Claude (claude.ai or Claude Code)</li>
              <li>Start a new conversation</li>
              <li>Click "Copy prompt" below and paste into Claude</li>
              <li>Save the output to: <code className="bg-blue-100 px-1 rounded text-xs">{step.output}</code></li>
            </ol>
          </div>

          {/* Optional inputs */}
          {needsInput1 && INPUT1_LABELS[step.step] && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {INPUT1_LABELS[step.step].label}
                <span className="text-slate-400 font-normal ml-1">(optional — embeds into prompt)</span>
              </label>
              {step.step === 5 || step.step === 6 ? (
                <input
                  type="text"
                  value={input1}
                  onChange={e => setInput1(e.target.value)}
                  placeholder={INPUT1_LABELS[step.step].placeholder}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <textarea
                  value={input1}
                  onChange={e => setInput1(e.target.value)}
                  placeholder={INPUT1_LABELS[step.step].placeholder}
                  rows={4}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              )}
            </div>
          )}

          {needsInput2 && INPUT2_LABELS[step.step] && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {INPUT2_LABELS[step.step].label}
              </label>
              <input
                type="text"
                value={input2}
                onChange={e => setInput2(e.target.value)}
                placeholder={INPUT2_LABELS[step.step].placeholder}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Generated prompt preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">Generated prompt</label>
              <button
                onClick={() => setShowSystemPrompt(v => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
              >
                {showSystemPrompt ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                {showSystemPrompt ? 'Hide' : 'Show'} full prompt
              </button>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={showSystemPrompt ? prompt : prompt.slice(prompt.indexOf('TASK:'))}
                rows={10}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-600 bg-slate-50 font-mono resize-none focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Output → <span className="font-mono text-slate-500">{step.output}</span>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy full prompt'}
          </button>
        </div>
      </div>
    </div>
  )
}
