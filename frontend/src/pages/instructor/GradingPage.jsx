import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gradingApi } from '../../api'
import { useLanguage } from '../../contexts/LanguageContext'

const fmt = (text, vars) => Object.entries(vars).reduce((result, [key, value]) => result.replace(`{${key}}`, value), text)
const score = (value) => (value === null || value === undefined ? '—' : Number(value))
const dateTime = (value) => (value ? new Date(value).toLocaleString() : '—')

function StatusBadge({ status }) {
  const { t } = useLanguage()
  const label = t(`grading.statuses.${status}`)
  return <span className={`status grading-status-${String(status).toLowerCase()}`}>{label.startsWith('grading.') ? status : label}</span>
}

export function GradingListPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    gradingApi.list()
      .then((items) => setSessions(Array.isArray(items) ? items : []))
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false))
  }, [])

  return <section className="page-content data-workspace">
    <div className="page-heading"><div><p className="eyebrow blue-text">{t('grading.eyebrow')}</p><h1>{t('grading.title')}</h1><p className="muted">{t('grading.subtitle')}</p></div></div>
    {error && <div className="api-error">{t('common.apiError')}: {error}</div>}
    <div className="table-card"><table>
      <thead><tr>{['exam', 'student', 'status', 'answered', 'aiScore', 'finalScore'].map((key) => <th key={key}>{t(`grading.${key}`)}</th>)}<th>{t('common.actions')}</th></tr></thead>
      <tbody>
        {loading && <tr><td colSpan="7" className="empty-state">{t('grading.loading')}</td></tr>}
        {!loading && sessions.map((s) => <tr key={s.sessionId}>
          <td><strong>{s.examTitle}</strong><small className="cell-subtitle">{s.courseCode} · {dateTime(s.startedAt)}</small></td>
          <td>{s.studentName}<small className="cell-subtitle">{s.studentEmail}</small></td>
          <td><StatusBadge status={s.status} /></td>
          <td>{s.answeredTurns}</td>
          <td>{score(s.aiSuggestedScore)}{s.answeredTurns > 0 && !s.aiScoreComplete && <small className="cell-subtitle score-pending">{t('grading.incomplete')}</small>}</td>
          <td><strong className={s.finalScore === null ? 'score-pending' : ''}>{s.finalScore ?? t('grading.ungraded')}</strong></td>
          <td className="row-actions"><button onClick={() => navigate(`/grading/${s.sessionId}`)}>{t('grading.review')}</button></td>
        </tr>)}
        {!loading && !sessions.length && <tr><td colSpan="7" className="empty-state">{t('grading.none')}</td></tr>}
      </tbody>
    </table></div>
  </section>
}

function AiSuggestionBox({ turn, canRegrade, busy, onRegrade }) {
  const { t } = useLanguage()
  if (!turn.answered) return null
  const hasAi = turn.aiSuggestedScore !== null && turn.aiSuggestedScore !== undefined
  return <div className={`grading-ai ${turn.aiFallback ? 'is-warning' : ''}`}>
    <div className="grading-ai-head">
      <span>{t('grading.aiSuggestion')}</span>
      {hasAi && !turn.aiFallback && <strong>{score(turn.aiSuggestedScore)} / 10</strong>}
    </div>
    {turn.aiFallback && <p className="grading-ai-warning">{t('grading.fallback')}</p>}
    {!hasAi && <p className="muted">{t('grading.noAi')}</p>}
    {hasAi && !turn.aiFallback && <dl>
      {turn.strengths && <><dt>{t('grading.strengths')}</dt><dd>{turn.strengths}</dd></>}
      {turn.weaknesses && <><dt>{t('grading.weaknesses')}</dt><dd>{turn.weaknesses}</dd></>}
      {turn.missingPoints && <><dt>{t('grading.missingPoints')}</dt><dd>{turn.missingPoints}</dd></>}
    </dl>}
    {canRegrade && <button className="text-link grading-ai-regrade" type="button" disabled={busy} onClick={() => onRegrade(turn.turnId)}>↻ {t('grading.regradeTurn')}</button>}
  </div>
}

function QuestionCard({ question, index, canRegrade, busy, onRegradeTurn }) {
  const { t } = useLanguage()
  return <article className="grading-question">
    <header className="grading-question-head">
      <div><p className="eyebrow blue-text">{t('grading.question')} {question.questionOrder ?? index + 1}</p><h2>{question.questionText}</h2></div>
      <div className="grading-question-score"><small>{t('grading.questionScore')}</small><strong>{score(question.aiQuestionScore)}</strong></div>
    </header>
    <details className="grading-reference">
      <summary>{t('grading.sampleAnswer')} & {t('grading.rubric')}{question.rubricName ? ` — ${question.rubricName}` : ''}</summary>
      <p className="grading-sample">{question.sampleAnswer || t('grading.noSample')}</p>
      {question.criteria?.length > 0 && <ul className="grading-criteria">{question.criteria.map((c) => <li key={c.criterionName}>
        <strong>{c.criterionName}</strong> <span className="grading-max">{score(c.maxScore)} {t('grading.points')}</span>
        {c.expectedAnswerKeywords && <small>{t('grading.keywords')}: {c.expectedAnswerKeywords}</small>}
      </li>)}</ul>}
    </details>
    {question.turns.map((turn) => <div key={turn.turnId} className={`grading-turn ${turn.turnType === 'FOLLOW_UP' ? 'is-follow-up' : ''}`}>
      <p className="grading-turn-label">#{turn.sequenceNumber} · {turn.turnType === 'FOLLOW_UP' ? t('grading.followUp') : t('grading.mainTurn')}</p>
      {turn.turnType === 'FOLLOW_UP' && <p className="grading-turn-question">{turn.questionText}</p>}
      <div className="grading-transcript">
        <span>{t('grading.answer')}{turn.answerDurationSeconds ? ` · ${turn.answerDurationSeconds} ${t('grading.seconds')}` : ''}</span>
        {turn.answered ? <p>{turn.answerText}</p> : <p className="muted">{t('grading.noAnswer')}</p>}
      </div>
      <AiSuggestionBox turn={turn} canRegrade={canRegrade} busy={busy} onRegrade={onRegradeTurn} />
    </div>)}
  </article>
}

export function GradingReviewPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [finalScore, setFinalScore] = useState('')
  const [feedback, setFeedback] = useState('')

  const applyReview = useCallback((data, resetForm) => {
    setReview(data)
    if (resetForm) {
      setFinalScore(data.finalGrade?.finalScore ?? '')
      setFeedback(data.finalGrade?.lecturerFeedback ?? '')
    }
  }, [])

  useEffect(() => {
    gradingApi.review(sessionId)
      .then((data) => applyReview(data, true))
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false))
  }, [sessionId, applyReview])

  const run = async (action, successMessage) => {
    setBusy(true); setError(''); setNotice('')
    try {
      const data = await action()
      applyReview(data, false)
      if (data.failedTurnIds?.length) setError(fmt(t('grading.regradeFailed'), { n: data.failedTurnIds.length }))
      else if (successMessage) setNotice(successMessage)
      return data
    } catch (cause) { setError(cause.message) } finally { setBusy(false) }
  }

  const regradeAll = () => { if (window.confirm(t('grading.confirmRegradeAll'))) run(() => gradingApi.regradeSession(sessionId, false), t('grading.regradeDone')) }
  const regradeMissing = () => run(() => gradingApi.regradeSession(sessionId, true), t('grading.regradeDone'))
  const regradeTurn = (turnId) => run(() => gradingApi.regradeTurn(sessionId, turnId), t('grading.regradeDone'))

  const submit = async (event) => {
    event.preventDefault()
    const value = Number(finalScore)
    if (finalScore === '' || Number.isNaN(value) || value < 0 || value > 10) return setError(t('grading.invalidScore'))
    const data = await run(() => gradingApi.confirm(sessionId, { finalScore: value, feedback }), t('grading.saved'))
    if (data) applyReview(data, true)
  }

  if (loading) return <section className="page-content"><p className="muted">{t('grading.loading')}</p></section>
  if (!review) return <section className="page-content"><button className="text-link" type="button" onClick={() => navigate('/grading')}>{t('grading.back')}</button>{error && <div className="api-error grading-alert">{error}</div>}</section>

  const completed = review.status === 'COMPLETED'
  const aiTotal = review.aiSuggestedScore
  const diff = aiTotal !== null && aiTotal !== undefined && finalScore !== '' && !Number.isNaN(Number(finalScore)) ? (Number(finalScore) - Number(aiTotal)).toFixed(2) : null
  const missingAi = review.answeredTurns - review.aiGradedTurns

  return <section className="page-content data-workspace grading-page">
    <button className="text-link grading-back" type="button" onClick={() => navigate('/grading')}>{t('grading.back')}</button>
    <div className="page-heading"><div>
      <p className="eyebrow blue-text">{t('grading.eyebrow')} · {review.courseCode}</p>
      <h1>{review.studentName}</h1>
      <p className="muted">{review.examTitle} · {review.studentEmail} · {dateTime(review.startedAt)} <StatusBadge status={review.status} /></p>
    </div></div>
    <div className="grading-note">ⓘ {t('grading.humanNote')}</div>
    {error && <div className="api-error grading-alert">{error}</div>}
    {notice && <div className="grading-notice">{notice}</div>}
    {!completed && <div className="grading-notice is-warning">{t('grading.notCompleted')}</div>}

    <div className="grading-layout">
      <div className="grading-questions">
        {completed && review.answeredTurns > 0 && <div className="grading-toolbar">
          {missingAi > 0 && <button className="button primary" type="button" disabled={busy} onClick={regradeMissing}>{busy ? t('grading.regrading') : t('grading.regradeMissing')}</button>}
          <button className="button secondary" type="button" disabled={busy} onClick={regradeAll}>{busy ? t('grading.regrading') : t('grading.regradeAll')}</button>
        </div>}
        {review.questions.length === 0 && <div className="table-card empty-state">{t('grading.noTurns')}</div>}
        {review.questions.map((question, index) => <QuestionCard key={question.turns[0]?.turnId ?? index} question={question} index={index} canRegrade={completed} busy={busy} onRegradeTurn={regradeTurn} />)}
      </div>

      <aside className="grading-panel">
        <div className="score-highlight"><span>{t('grading.aiTotal')}</span><strong>{score(aiTotal)} / 10</strong></div>
        <p className="grading-hint">{t('grading.aiTotalHint')}</p>
        <p className={`grading-hint ${review.aiScoreComplete ? '' : 'score-pending'}`}>{fmt(t('grading.gradedTurns'), { a: review.aiGradedTurns, b: review.answeredTurns })}</p>
        <form onSubmit={submit}>
          <h3>{t('grading.decision')}</h3>
          <label>{t('grading.finalScoreLabel')}
            <div className="grading-score-input">
              <input type="number" min="0" max="10" step="0.1" value={finalScore} disabled={!completed || busy} onChange={(event) => setFinalScore(event.target.value)} />
              {aiTotal !== null && aiTotal !== undefined && <button className="button secondary" type="button" disabled={!completed || busy} onClick={() => setFinalScore(String(Number(aiTotal)))}>{t('grading.useAi')}</button>}
            </div>
          </label>
          {diff !== null && <p className="grading-hint">{fmt(t('grading.diff'), { d: diff > 0 ? `+${diff}` : diff })}</p>}
          <label>{t('grading.feedback')}<textarea rows="5" value={feedback} disabled={!completed || busy} placeholder={t('grading.feedbackPlaceholder')} onChange={(event) => setFeedback(event.target.value)} /></label>
          <button className="button primary full" type="submit" disabled={!completed || busy}>{busy ? t('grading.saving') : review.finalGrade ? t('grading.update') : t('grading.confirm')}</button>
        </form>
        {review.finalGrade && <p className="grading-hint grading-confirmed">✓ {fmt(t('grading.confirmedBy'), { name: review.finalGrade.confirmedByName ?? '—', time: dateTime(review.finalGrade.confirmedAt) })}</p>}
      </aside>
    </div>
  </section>
}
