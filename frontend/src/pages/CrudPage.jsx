import { useMemo, useState } from 'react'
import { CrudModal } from '../components/CrudModal'
import { resources, useData } from '../contexts/DataContext'
import { useLanguage } from '../contexts/LanguageContext'

export function CrudPage({ resourceKey }) {
  const resource = resources[resourceKey]
  const { t } = useLanguage()
  const localized = t(`resources.${resourceKey}`)
  const { data, loading, error, createItem, updateItem, deleteItem } = useData()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const filtered = useMemo(() => data[resourceKey].filter((item) => resource.search.some((key) => String(item[key]).toLowerCase().includes(query.toLowerCase()))), [data, query, resource, resourceKey])
  const save = async (item) => { if (item.id) await updateItem(resourceKey, item); else await createItem(resourceKey, item); setEditing(null) }
  return <section className="page-content data-workspace"><div className="page-heading"><div><p className="eyebrow blue-text">{t('common.management')}</p><h1>{localized.label}</h1><p className="muted">{t('common.synced')}</p></div><div className="page-actions">{!resource.readOnly && <button className="button primary" onClick={() => setEditing({})}><span className="button-icon">+</span>{t('common.create')} {localized.singular}</button>}</div></div>{error && <div className="api-error">{t('common.apiError')}: {error}</div>}<div className="toolbar"><div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${t('common.create')} ${localized.singular}...`} /></div><span className="result-count">{filtered.length} {t('common.records')}</span></div><div className="table-card"><table><thead><tr>{localized.headings.map((heading) => <th key={heading}>{heading}</th>)}{!resource.readOnly && <th className="actions-column">{t('common.actions')}</th>}</tr></thead><tbody>{loading ? <tr><td colSpan={resource.columns.length + 1} className="empty-state">{t('common.loading')}</td></tr> : filtered.map((item) => <tr key={item.id}>{resource.columns.map((key) => <td key={key}>{key === 'status' ? <span className="status">{t(`status.${item[key]}`) || item[key]}</span> : key === 'scheduledStartTime' ? new Date(item[key]).toLocaleString() : item[key] ?? '—'}</td>)}{!resource.readOnly && <td className="row-actions"><button onClick={() => setEditing(item)}>{t('common.edit')}</button><button className="danger-text" onClick={async () => { if (window.confirm(`${t('common.delete')} ${localized.singular}?`)) await deleteItem(resourceKey, item.id) }}>{t('common.delete')}</button></td>}</tr>)}{!loading && !filtered.length && <tr><td colSpan={resource.columns.length + 1} className="empty-state">{t('common.noResults')}</td></tr>}</tbody></table></div>{editing && <CrudModal resourceKey={resourceKey} item={editing.id ? editing : null} onClose={() => setEditing(null)} onSave={save} />}</section>
}
