import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function StudentReportPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { data } = useData()
  const report = JSON.parse(localStorage.getItem('aives-student-report') || 'null')
  const answers = useMemo(() => report?.answers || [], [report])
  const session = data.sessions.find((item) => String(item.id) === String(report?.sessionId))
  const questions = useMemo(() => answers.map((answer) => data.questions.find((question) => String(question.id) === String(answer.questionId)) || answer), [answers, data.questions])
  const finalScore = session?.finalTeacherScore ?? session?.finalScore
  const aiScore = session?.aiSuggestedScore
  return <section className="student-page"><div className="page-heading"><div><p className="eyebrow blue-text">{t('report.eyebrow')}</p><h1>{t('report.title')}</h1><p className="muted">{report?.examTitle || session?.examTitle || t('report.subtitle')}</p></div><span className="status status-completed">{session?.status || 'LOCAL TRANSCRIPT'}</span></div><div className="report-hero"><div><span>{t('report.finalScore')}</span><strong>{finalScore ?? '—'}{finalScore !== null && finalScore !== undefined ? ' / 10' : ''}</strong><small>{finalScore === null || finalScore === undefined ? 'Chưa được giảng viên chốt' : t('report.teacherConfirmed')}</small></div><div><span>{t('report.aiSuggested')}</span><strong>{aiScore ?? '—'}{aiScore !== null && aiScore !== undefined ? ' / 10' : ''}</strong><small>{aiScore === null || aiScore === undefined ? 'AI chưa có điểm đề xuất từ backend' : t('report.reviewed')}</small></div><div><span>{t('report.answers')}</span><strong>{answers.length}</strong><small>{t('report.transcriptSaved')}</small></div></div><article className="feedback-card"><h2>{t('report.feedbackTitle')}</h2>{session?.teacherFeedback && <p>{session.teacherFeedback}</p>}<div className="report-answer-list">{questions.length ? questions.map((question, index) => <div className="report-answer" key={`${question.id || index}-${index}`}><div><strong>Câu {index + 1}</strong><span>{question.content || question.questionText || 'Câu hỏi vấn đáp'}</span></div><p>{answers[index]?.transcript}</p></div>) : <p className="muted">Chưa có transcript cục bộ. Hãy hoàn thành một phiên thi để xem lại câu trả lời.</p>}</div></article><div className="wizard-footer"><button className="button secondary" onClick={() => navigate('/dashboard')}>Quay lại cổng sinh viên</button></div></section>
}
