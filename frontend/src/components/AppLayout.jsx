import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AppFooter } from './AppFooter'
import { useLanguage } from '../contexts/LanguageContext'

const lecturerNavigation = [['dashboard', '▦', 'dashboard'], ['exams', '▣', 'exams'], ['questions', '▤', 'questions'], ['sessions', '◷', 'sessions']]
const adminNavigation = [['dashboard', '▦', 'dashboard'], ['users', '♙', 'users'], ['subjects', '◈', 'subjects']]
const studentNavigation = [['dashboard', '▦', 'dashboard'], ['student/pre-check', '✓', 'preCheck'], ['student/exam', '◉', 'examRoom'], ['student/report', '▤', 'report']]

export function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const navigation = session.role === 'STUDENT' ? studentNavigation : session.role === 'ADMIN' ? adminNavigation : lecturerNavigation
  const { t, locale, setLocale } = useLanguage()
  return <div className="app-shell">
    <aside className="sidebar"><div><div className="sidebar-brand"><span className="brand-small">A</span><div><strong>AIVES</strong><small>{session.role === 'STUDENT' ? t('roles.STUDENT') : session.role === 'ADMIN' ? t('roles.ADMIN') : t('roles.INSTRUCTOR')}</small></div></div><p className="nav-label">{t('nav.section')}</p><nav>{navigation.map(([path, icon, labelKey]) => <button className={location.pathname === `/${path}` ? 'active' : ''} key={path} onClick={() => navigate(`/${path}`)}><span>{icon}</span>{t(`nav.${labelKey}`) || labelKey}</button>)}</nav></div><div className="sidebar-bottom"><div className="sidebar-account"><div className="avatar">{session.name.charAt(0).toUpperCase()}</div><div><strong>{session.name}</strong><small>{t(`roles.${session.role}`)}</small></div><button onClick={() => navigate('/logout')} title={t('nav.logout')}>↪</button></div></div></aside>
    <div className="main-shell"><header className="topbar"><div className="topbar-search">⌕ <span>{t('nav.search')}</span></div><div className="user-menu"><button className="language-button" type="button" onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}>{locale.toUpperCase()}</button></div></header>{children}<AppFooter /></div>
  </div>
}
