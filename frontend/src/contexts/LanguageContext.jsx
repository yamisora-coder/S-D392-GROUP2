/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { translations } from '../locales/translations'

const LanguageContext = createContext(null)

const getValue = (source, path) => path.split('.').reduce((value, key) => value?.[key], source)

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('aives-locale') || 'vi')
  const changeLocale = (nextLocale) => { localStorage.setItem('aives-locale', nextLocale); setLocale(nextLocale) }
  const value = useMemo(() => ({ locale, setLocale: changeLocale, t: (key) => getValue(translations[locale], key) ?? key, dictionary: translations[locale] }), [locale])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() { return useContext(LanguageContext) }
