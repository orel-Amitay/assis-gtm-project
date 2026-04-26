import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('assis-lang') || 'en')

  useEffect(() => {
    const isHe = lang === 'he'
    document.documentElement.dir = isHe ? 'rtl' : 'ltr'
    document.documentElement.lang = isHe ? 'he' : 'en'
    localStorage.setItem('assis-lang', lang)
  }, [lang])

  const toggle = () => setLang(l => l === 'en' ? 'he' : 'en')
  return (
    <LanguageContext.Provider value={{ lang, toggle, isHe: lang === 'he' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
