import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useLanguage } from '../../contexts/LanguageContext'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useData()
  const { t } = useLanguage()
  const instructors = data.users.filter((user) => ['INSTRUCTOR', 'LECTURER', 'TEACHER'].includes(user.role)).length
  const students = data.users.filter((user) => user.role === 'STUDENT').length

  return <section className="page-content"><div className="page-heading"><div><p className="eyebrow blue-text">{t('admin.eyebrow')}</p><h1>{t('admin.title')}</h1><p className="muted">{t('admin.subtitle')}</p></div></div>{error && <div className="api-error">{t('common.apiError')}: {error}</div>}{loading ? <p className="muted">{t('common.loading')}</p> : <><div className="stats-grid"><div className="stat-card"><span>{t('admin.accounts')}</span><strong>{data.users.length}</strong><small>{t('admin.accountsHint')}</small></div><div className="stat-card"><span>{t('admin.instructors')}</span><strong>{instructors}</strong><small>{t('admin.instructorsHint')}</small></div><div className="stat-card"><span>{t('admin.students')}</span><strong>{students}</strong><small>{t('admin.studentsHint')}</small></div></div><div className="dashboard-actions"><button className="button secondary" onClick={() => navigate('/users')}>♙ {t('nav.users')}</button><button className="button secondary" onClick={() => navigate('/subjects')}>◈ {t('nav.subjects')}</button></div><div className="admin-grid"><article className="workspace-card"><p className="eyebrow blue-text">{t('admin.governanceEyebrow')}</p><h2>{t('admin.governanceTitle')}</h2><p>{t('admin.governanceText')}</p><div className="workflow-steps"><span>01 {t('admin.stepUsers')}</span><span>02 {t('admin.stepSubjects')}</span><span>03 {t('admin.stepAccess')}</span><span>04 {t('admin.stepAudit')}</span></div></article><article className="workspace-card"><span className="workspace-icon">⚙</span><h2>{t('admin.configurationTitle')}</h2><p>{t('admin.configurationText')}</p><div className="admin-status-list"><span><b className="online-dot" /> {t('admin.apiStatus')}</span><span><b className="online-dot" /> {t('admin.languageStatus')}</span><span><b className="online-dot" /> {t('admin.auditStatus')}</span></div></article></div></>}</section>
}
