import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useData } from '../../contexts/DataContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function StudentPortalPage() {
  const navigate = useNavigate()
  const { data, loading } = useData()
  const { t } = useLanguage()
  const { session } = useAuth()
  const assignedSessions = data.sessions.filter((item) => Number(item.studentId) === Number(session.id)).sort((a, b) => new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime))
  const nextExam = assignedSessions.find((item) => item.status !== 'COMPLETED') || assignedSessions[0]
  const completed = assignedSessions.filter((item) => item.status === 'COMPLETED')
  return <section className="student-page"><div className="student-hero"><div><p className="eyebrow blue-text">{t('student.portalEyebrow')}</p><h1>{t('student.portalTitle')}</h1><p>{t('student.portalText')}</p><div className="student-hero-meta"><span>● Phiên đã phân công: {assignedSessions.length}</span><span>✓ Đã hoàn thành: {completed.length}</span></div></div><div className="student-avatar">{session.name.charAt(0).toUpperCase()}</div></div><div className="student-grid"><article className="exam-next-card"><span className="status status-scheduled">{t('student.nextExam')}</span><h2>{loading ? t('student.loadingExam') : nextExam?.examTitle || t('student.noExam')}</h2><p>{nextExam?.subjectName || t('student.assignedSubject')} · {nextExam ? new Date(nextExam.scheduledStartTime).toLocaleString() : '—'}</p>{nextExam && nextExam.status !== 'COMPLETED' && <button className="button primary" onClick={() => { sessionStorage.setItem('aives-current-session', JSON.stringify(nextExam)); navigate('/student/pre-check') }}>{t('student.startCheck')}</button>}{nextExam?.status === 'COMPLETED' && <button className="button secondary" onClick={() => navigate('/student/report')}>Xem báo cáo gần nhất</button>}</article><article className="student-info-card"><h3>{t('student.rulesTitle')}</h3><ul><li>{t('student.ruleQuiet')}</li><li>{t('student.ruleDevices')}</li><li>{t('student.ruleAnswers')}</li><li>{t('student.ruleAudit')}</li></ul></article></div><div className="student-session-list"><h2>Lịch thi của tôi</h2>{assignedSessions.length ? assignedSessions.map((item) => <button className="student-session-row" key={item.id} onClick={() => { sessionStorage.setItem('aives-current-session', JSON.stringify(item)); item.status === 'COMPLETED' ? navigate('/student/report') : navigate('/student/pre-check') }}><span><strong>{item.examTitle}</strong><small>{item.subjectName || item.courseName || '—'}</small></span><span><strong>{new Date(item.scheduledStartTime).toLocaleString()}</strong><small className={`status status-${item.status.toLowerCase()}`}>{item.status}</small></span></button>) : <p className="muted">Chưa có ca thi nào được phân công cho tài khoản này.</p>}</div></section>
}
