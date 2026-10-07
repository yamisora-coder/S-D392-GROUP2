import { useLanguage } from '../contexts/LanguageContext'

export function AppFooter() {
  const { t } = useLanguage()
  return <footer className="app-footer"><span>{t('common.footer')}</span><span>{t('common.secure')} <b className="online-dot" /></span></footer>
}
