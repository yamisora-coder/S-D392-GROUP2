import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function LecturerDashboardPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useData()
  const { t } = useLanguage()
  const pending = data.questions.filter((question) => question.status === 'DRAFT').length
  const ungraded = data.sessions.filter((session) => session.finalTeacherScore === null).length
  return <section className="page-content"><div className="page-heading"><div><p className="eyebrow blue-text">{t('lecturer.eyebrow')}</p><h1>{t('overview.title')}</h1><p className="muted">{t('overview.subtitle')}</p></div></div>{error && <div className="api-error">{t('common.apiError')}: {error}</div>}{loading ? <p className="muted">{t('common.loading')}</p> : <><div className="stats-grid"><div className="stat-card"><span>{t('lecturer.activeExams')}</span><strong>{data.exams.length}</strong><small>{t('lecturer.activeExamsHint')}</small></div><div className="stat-card"><span>{t('lecturer.pendingQuestions')}</span><strong>{pending}</strong><small>{t('lecturer.pendingQuestionsHint')}</small></div><div className="stat-card"><span>{t('lecturer.awaitingGrading')}</span><strong>{ungraded}</strong><small>{t('lecturer.awaitingGradingHint')}</small></div></div><div className="dashboard-actions"><button className="button primary" onClick={() => navigate('/exams')}>+ {t('nav.exams')}</button><button className="button secondary" onClick={() => navigate('/questions')}>▤ {t('nav.questions')}</button><button className="button secondary" onClick={() => navigate('/sessions')}>◷ {t('nav.sessions')}</button></div><div className="workspace-grid"><article className="workspace-card"><p className="eyebrow blue-text">{t('lecturer.activityEyebrow')}</p><h2>{t('lecturer.controlTitle')}</h2><p>{t('lecturer.controlText')}</p><div className="workflow-steps"><span>01 {t('lecturer.stepQuestion')}</span><span>02 {t('lecturer.stepSchedule')}</span><span>03 {t('lecturer.stepViva')}</span><span>04 {t('lecturer.stepGrade')}</span></div></article><article className="workspace-card accent-card"><span className="workspace-icon">✦</span><h2>{t('lecturer.assistantTitle')}</h2><p>{t('lecturer.assistantText')}</p></article></div></>}</section>
}
