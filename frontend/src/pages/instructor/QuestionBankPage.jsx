import { useMemo, useState } from 'react'
import { CrudModal } from '../../components/CrudModal'
import { useData } from '../../contexts/DataContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function QuestionBankPage() {
  const { data, loading, error, createItem, updateItem, deleteItem, setQuestionStatus } = useData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [level, setLevel] = useState('')
  const [editing, setEditing] = useState(null)
  const { t } = useLanguage()
  const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE']
  const statuses = ['DRAFT', 'APPROVED', 'ARCHIVED']
  const questions = useMemo(() => data.questions.filter((question) => {
    const textMatch = [question.content, question.subjectName].some((value) => String(value || '').toLowerCase().includes(query.toLowerCase()))
    return textMatch && (!status || question.status === status) && (!level || question.bloomLevel === level)
  }), [data.questions, query, status, level])
  const save = async (item) => {
    if (item.id) await updateItem('questions', item)
    else await createItem('questions', item)
    setEditing(null)
  }
  return <section className="page-content data-workspace">
    <div className="page-heading"><div><p className="eyebrow blue-text">{t('questionBank.eyebrow')}</p><h1>{t('questionBank.title')}</h1><p className="muted">{t('questionBank.subtitle')}</p></div><button className="button primary" onClick={() => setEditing({})}>+ {t('questionBank.create')}</button></div>
    {error && <div className="api-error">{t('common.apiError')}: {error}</div>}
    <div className="filter-panel"><div className="search-box wide-search">⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('questionBank.search')} /></div><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="">{t('questionBank.allLevels')}</option>{levels.map((key) => <option key={key} value={key}>{t(`bloom.${key}`)}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">{t('questionBank.allStatuses')}</option>{statuses.map((key) => <option key={key} value={key}>{t(`status.${key}`)}</option>)}</select></div>
    <div className="question-summary"><strong>{questions.length}</strong> {t('questionBank.matching')} <span>·</span> {t('questionBank.rubric')}</div>
    <div className="table-card"><table><thead><tr>{['question', 'subject', 'bloom', 'score'].map((key) => <th key={key}>{t(`questionBank.${key}`)}</th>)}<th>{t('questionBank.statusLabel')}</th><th>{t('common.actions')}</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="empty-state">{t('questionBank.loading')}</td></tr> : questions.map((question) => <tr key={question.id}><td className="question-cell"><strong>{question.content}</strong><small>{question.isAiGenerated ? t('questionBank.generated') : `${t('questionBank.createdBy')} ${question.createdByName || t('questionBank.teacher')}`}</small></td><td>{question.subjectName || '—'}</td><td><span className="level-chip">{t(`bloom.${question.bloomLevel}`) || question.bloomLevel}</span></td><td>{question.totalRubricScore ?? 0} {t('questionBank.score')}</td><td><span className="status">{t(`status.${question.status}`) || question.status}</span></td><td className="row-actions"><button onClick={() => setEditing(question)}>{t('common.edit')}</button>{question.status !== 'APPROVED' && <button onClick={async () => setQuestionStatus(question.id, 'APPROVED')}>{t('questionBank.approve')}</button>}<button className="danger-text" onClick={async () => { if (window.confirm(t('questionBank.confirmDelete'))) await deleteItem('questions', question.id) }}>{t('common.delete')}</button></td></tr>)}{!loading && !questions.length && <tr><td colSpan="6" className="empty-state">{t('common.noResults')}</td></tr>}</tbody></table></div>
    {editing && <CrudModal resourceKey="questions" item={editing.id ? editing : null} onClose={() => setEditing(null)} onSave={save} />}
  </section>
}
