import { useState } from 'react'
import { useData } from '../../contexts/DataContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function SessionPage() {
  const { data, loading, error, gradeSession, deleteItem } = useData()
  const [grading, setGrading] = useState(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const { t } = useLanguage()
  const submitGrade = async (event) => {
    event.preventDefault()
    const value = Number(score)
    if (value < 0 || value > 10 || score === '') return
    await gradeSession(grading.id, { finalScore: value, feedback })
    setGrading(null)
  }
  return <section className="page-content data-workspace"><div className="page-heading"><div><p className="eyebrow blue-text">{t('sessions.eyebrow')}</p><h1>{t('sessions.title')}</h1><p className="muted">{t('sessions.subtitle')}</p></div></div>{error && <div className="api-error">{t('common.apiError')}: {error}</div>}<div className="table-card"><table><thead><tr>{['exam', 'student', 'time', 'status', 'aiScore', 'finalScore'].map((key) => <th key={key}>{t(`sessions.${key}`)}</th>)}<th>{t('common.actions')}</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="empty-state">{t('sessions.loading')}</td></tr> : data.sessions.map((session) => <tr key={session.id}><td><strong>{session.examTitle}</strong><small className="cell-subtitle">{session.subjectName}</small></td><td>{session.studentName}<small className="cell-subtitle">{session.studentCode}</small></td><td>{new Date(session.scheduledStartTime).toLocaleString()}</td><td><span className="status">{t(`status.${session.status}`) || session.status}</span></td><td>{session.aiSuggestedScore ?? '—'}</td><td><strong className={session.finalTeacherScore === null ? 'score-pending' : ''}>{session.finalTeacherScore ?? t('sessions.ungraded')}</strong></td><td className="row-actions">{session.status !== 'ABSENT' && <button onClick={() => { setGrading(session); setScore(session.finalTeacherScore ?? ''); setFeedback(session.teacherFeedback || '') }}>{t('sessions.grade')}</button>}<button className="danger-text" onClick={async () => { if (window.confirm(t('sessions.confirmDelete'))) await deleteItem('sessions', session.id) }}>{t('common.delete')}</button></td></tr>)}{!loading && !data.sessions.length && <tr><td colSpan="7" className="empty-state">{t('sessions.none')}</td></tr>}</tbody></table></div>{grading && <div className="modal-backdrop"><form className="modal grade-modal" onSubmit={submitGrade}><button className="modal-close" type="button" onClick={() => setGrading(null)}>×</button><p className="eyebrow blue-text">{t('sessions.grading')}</p><h2>{t('sessions.gradeFor')}: {grading.studentName}</h2><div className="score-highlight"><span>{t('sessions.suggested')}</span><strong>{grading.aiSuggestedScore ?? '—'} / 10</strong></div><label>{t('sessions.teacherScore')}<input required min="0" max="10" step="0.1" type="number" value={score} onChange={(event) => setScore(event.target.value)} /></label><label>{t('sessions.feedback')}<textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows="4" placeholder={t('sessions.feedbackPlaceholder')} /></label><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setGrading(null)}>{t('common.cancel')}</button><button className="button primary" type="submit">{t('sessions.save')}</button></div></form></div>}</section>
}
