import { resources, useData } from '../contexts/DataContext'
import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export function CrudModal({ resourceKey, item, onClose, onSave }) {
  const resource = resources[resourceKey]
  const { t } = useLanguage()
  const { data } = useData()
  const localized = t(`resources.${resourceKey}`)
  const [form, setForm] = useState(item || {})
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const subjectOptions = data.subjects.map((subject) => ({
    id: subject.id,
    label: [subject.code, subject.name].filter(Boolean).join(' — ') || subject.id,
  }))
  const rubricOptions = data.rubrics.map((rubric) => ({ id: rubric.id, label: rubric.name }))
  return <div className="modal-backdrop" onClick={onClose}><form className="modal" onSubmit={(event) => { event.preventDefault(); onSave(form) }} onClick={(event) => event.stopPropagation()}>
    <button className="modal-close" type="button" onClick={onClose}>×</button><p className="eyebrow blue-text">{item ? 'UPDATE' : 'CREATE'}</p><h2>{item ? `${t('common.edit')} ${localized.singular}` : `${t('common.create')} ${localized.singular}`}</h2>
    <div className="form-grid">{resource.fields.map(([key]) => <label key={key} className={key === 'title' || key === 'name' || key === 'content' ? 'wide' : ''}>{localized.fields?.[key] || key}{key === 'subjectId' ? <select required value={form[key] || ''} onChange={(event) => update(key, event.target.value)}><option value="">{t('common.selectSubject')}</option>{subjectOptions.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}</select> : key === 'rubricId' ? <select required value={form[key] || ''} onChange={(event) => update(key, event.target.value)}><option value="">Chọn rubric</option>{rubricOptions.map((rubric) => <option key={rubric.id} value={rubric.id}>{rubric.label}</option>)}</select> : key === 'status' ? <select value={form[key] || 'DRAFT'} onChange={(event) => update(key, event.target.value)}><option value="DRAFT">{t('status.DRAFT')}</option><option value="PENDING_REVIEW">Chờ duyệt</option><option value="APPROVED">{t('status.APPROVED')}</option><option value="REJECTED">Từ chối</option></select> : key === 'bloomLevel' ? <select required value={form[key] || ''} onChange={(event) => update(key, event.target.value)}><option value="">—</option><option value="REMEMBER">{t('bloom.REMEMBER')}</option><option value="UNDERSTAND">{t('bloom.UNDERSTAND')}</option><option value="APPLY">{t('bloom.APPLY')}</option><option value="ANALYZE">{t('bloom.ANALYZE')}</option><option value="EVALUATE">Đánh giá</option><option value="CREATE">Sáng tạo</option></select> : <input required value={form[key] || ''} type={key === 'date' ? 'date' : key.includes('Questions') || key.includes('Mins') ? 'number' : 'text'} onChange={(event) => update(key, event.target.value)} />}</label>)}</div>
    <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>{t('common.cancel')}</button><button className="button primary" type="submit">{t('common.save')}</button></div>
  </form></div>
}
