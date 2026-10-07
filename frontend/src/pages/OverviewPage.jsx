import { useData } from '../contexts/DataContext'
import { useLanguage } from '../contexts/LanguageContext'

export function OverviewPage() {
  const { data, loading, error } = useData()
  const { t } = useLanguage()
  return <section className="page-content"><div className="page-heading"><div><p className="eyebrow blue-text">{t('overview.eyebrow')}</p><h1>{t('overview.title')}</h1><p className="muted">{t('overview.subtitle')}</p></div></div>{error && <div className="api-error">{t('common.apiError')}: {error}</div>}{loading ? <p className="muted">{t('common.loading')}</p> : <div className="stats-grid">{[['users', data.users.length], ['subjects', data.subjects.length], ['exams', data.exams.length], ['questions', data.questions.length], ['sessions', data.sessions.length]].map(([key, value]) => <div className="stat-card" key={key}><span>{t(`nav.${key}`)}</span><strong>{value}</strong><small>{t(`overview.${key}`)}</small></div>)}</div>}</section>
}
