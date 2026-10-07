import { useLanguage } from '../../contexts/LanguageContext'

export function StudentReportPage() {
  const { t } = useLanguage()
  return <section className="student-page"><div className="page-heading"><div><p className="eyebrow blue-text">{t('report.eyebrow')}</p><h1>{t('report.title')}</h1><p className="muted">{t('report.subtitle')}</p></div><span className="status status-completed">{t('report.completed')}</span></div><div className="report-hero"><div><span>{t('report.finalScore')}</span><strong>8.4 / 10</strong><small>{t('report.teacherConfirmed')}</small></div><div><span>{t('report.aiSuggested')}</span><strong>8.1 / 10</strong><small>{t('report.reviewed')}</small></div><div><span>{t('report.answers')}</span><strong>3 / 3</strong><small>{t('report.transcriptSaved')}</small></div></div><article className="feedback-card"><h2>{t('report.feedbackTitle')}</h2><div className="feedback-columns"><div><b className="positive">{t('report.strengths')}</b><p>{t('report.strengthsText')}</p></div><div><b className="improve">{t('report.improvement')}</b><p>{t('report.improvementText')}</p></div></div></article></section>
}
