import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useData } from '../../contexts/DataContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function StudentPortalPage() {
  const navigate = useNavigate()
  const { data, loading } = useData()
  const nextExam = data.sessions[0]
  const { t } = useLanguage()
  const { session } = useAuth()
  return <section className="student-page"><div className="student-hero"><div><p className="eyebrow blue-text">{t('student.portalEyebrow')}</p><h1>{t('student.portalTitle')}</h1><p>{t('student.portalText')}</p></div><div className="student-avatar">{session.name.charAt(0).toUpperCase()}</div></div><div className="student-grid"><article className="exam-next-card"><span className="status status-scheduled">{t('student.nextExam')}</span><h2>{loading ? t('student.loadingExam') : nextExam?.examTitle || t('student.noExam')}</h2><p>{nextExam?.subjectName || t('student.assignedSubject')} · {nextExam ? new Date(nextExam.scheduledStartTime).toLocaleString() : '—'}</p><button className="button primary" onClick={() => navigate('/student/pre-check')}>{t('student.startCheck')}</button></article><article className="student-info-card"><h3>{t('student.rulesTitle')}</h3><ul><li>{t('student.ruleQuiet')}</li><li>{t('student.ruleDevices')}</li><li>{t('student.ruleAnswers')}</li><li>{t('student.ruleAudit')}</li></ul></article></div></section>
}
