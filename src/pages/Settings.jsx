import React, { useState, useEffect } from 'react'
import { Key, Check, Eye, EyeOff, ExternalLink, AlertCircle } from 'lucide-react'
import { saveApiKey, checkKeyStatus } from '../hooks/useClaude'
import { useLang } from '../context/LanguageContext'

export default function Settings() {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState(null)
  const [current, setCurrent] = useState(null)
  const { lang } = useLang()
  const isHe = lang === 'he'

  useEffect(() => {
    checkKeyStatus().then(s => setCurrent(s))
  }, [])

  const handleSave = async () => {
    if (!key.trim()) return
    setStatus('saving')
    try {
      await saveApiKey(key.trim())
      setStatus('saved')
      setCurrent({ configured: true, masked: `...${key.trim().slice(-4)}` })
      setKey('')
      setTimeout(() => setStatus(null), 3000)
    } catch {
      setStatus('error')
    }
  }

  const handleClear = () => {
    localStorage.removeItem('assis-api-key')
    setCurrent({ configured: false, masked: null })
    setKey('')
    setStatus(null)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isHe ? 'הגדרות' : 'Settings'}</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {isHe
            ? 'חבר את Google Gemini API כדי להריץ את כל שלבי ה-Workflow ישירות מהאפליקציה'
            : 'Connect Google Gemini API to run all Workflow steps directly inside the app'}
        </p>
      </div>

      {/* API Key card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <Key size={17} className="text-blue-500" />
          </div>
          <div>
            <div className="font-semibold text-slate-800">{isHe ? 'מפתח Google AI API' : 'Google AI API Key'}</div>
            <div className="text-xs text-slate-400">
              {isHe ? 'מופיע בלבד במכשיר זה — לא נשלח לשום מקום אחר' : 'Stored on this device only — never sent anywhere else'}
            </div>
          </div>
        </div>

        {current?.configured && (
          <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Check size={13} className="text-green-500" />
              <span className="text-sm text-green-700 font-medium">
                {isHe ? 'מפתח מוגדר:' : 'Key configured:'} {current.masked}
              </span>
            </div>
            <button
              onClick={handleClear}
              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
            >
              {isHe ? 'נקה' : 'Clear'}
            </button>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            {current?.configured
              ? (isHe ? 'עדכן מפתח' : 'Update key')
              : (isHe ? 'הכנס מפתח API' : 'Enter API key')}
          </label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="AIza..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 pr-10"
            />
            <button
              onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!key.trim() || status === 'saving'}
          className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
            status === 'saved'
              ? 'bg-green-500 text-white'
              : 'bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          {status === 'saving' ? (isHe ? 'שומר...' : 'Saving...') :
           status === 'saved'  ? (isHe ? '✓ נשמר' : '✓ Saved') :
           isHe ? 'שמור מפתח' : 'Save key'}
        </button>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-500 transition-colors"
        >
          <ExternalLink size={11} />
          {isHe ? 'קבל מפתח API מ-Google AI Studio' : 'Get API key from Google AI Studio'}
        </a>
      </div>

      {/* How it works */}
      <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-3">
        <div className="font-semibold text-slate-700 text-sm">{isHe ? 'איך זה עובד' : 'How it works'}</div>
        <ol className="space-y-2 text-sm text-slate-500 list-decimal list-inside">
          <li>{isHe ? 'הכנס את מפתח ה-API שלך למעלה' : 'Enter your Google AI API key above'}</li>
          <li>{isHe ? 'עבור ל-Workflow' : 'Go to Workflow'}</li>
          <li>{isHe ? 'לחץ "הרץ" בכל שלב — Gemini רץ ישירות כאן' : 'Click "Run" on any step — Gemini runs right here'}</li>
          <li>{isHe ? 'שלב 1: ייבא לידים ישירות לטבלה' : 'Step 1: Import leads directly to the table'}</li>
          <li>{isHe ? 'שלבים 2–4: תוצאות מוצגות ישירות באפליקציה' : 'Steps 2–4: Results appear right inside the app'}</li>
        </ol>

        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 mt-2">
          <AlertCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            {isHe
              ? 'Gemini 2.0 Flash — מהיר, חינמי עד מכסה גבוהה מאוד, מושלם לכלי GTM כזה.'
              : 'Gemini 2.0 Flash — fast, free up to a very high quota, perfect for this GTM tool.'}
          </p>
        </div>
      </div>
    </div>
  )
}
