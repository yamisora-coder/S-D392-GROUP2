import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

export function LoginPage() {
  const { login, loginWithSso } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(() => localStorage.getItem('aives-remembered-email') || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('INSTRUCTOR')
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('aives-remembered-email')))
  const [error, setError] = useState('')
  const { t, locale, setLocale } = useLanguage()
  const submit = (event) => { event.preventDefault(); if (!login(email, password, role)) { setError(t('login.required')); return } if (rememberMe) localStorage.setItem('aives-remembered-email', email.trim()); else localStorage.removeItem('aives-remembered-email'); navigate('/dashboard') }
  return <main className="login-page"><section className="login-card"><button className="language-button login-language" type="button" onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}>{locale.toUpperCase()}</button><div className="brand-mark">A</div><h1>AIVES Portal</h1><p className="login-subtitle">{t('login.subtitle')}</p><form onSubmit={submit}><label>{t('login.identity')}<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@university.edu" autoComplete="username" /></label><label>{t('login.password')}<input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" type="password" autoComplete="current-password" /></label><label>{t('login.role')}<span className="role-select-wrap"><select className="role-select" value={role} onChange={(event) => setRole(event.target.value)}><option value="INSTRUCTOR">{t('login.lecturer')}</option><option value="STUDENT">{t('login.student')}</option><option value="ADMIN">{t('login.admin')}</option></select></span></label><div className="login-options"><label className="remember-option"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />{t('login.rememberMe')}</label><button className="text-link forgot-link" type="button" onClick={() => setError(t('login.resetUnavailable'))}>{t('login.forgotPassword')}</button></div>{error && <p className="form-error">{error}</p>}<button className="button primary full" type="submit">{t('login.signIn')}</button></form><div className="login-divider">{t('login.or')}</div><button className="button secondary full" type="button" onClick={() => { loginWithSso(); navigate('/dashboard') }}>{t('login.sso')}</button><p className="login-help">{t('login.noAccount')} <button className="text-link" type="button" onClick={() => navigate('/register')}>{t('login.register')}</button></p><p className="login-help">{t('login.support')} <a href="mailto:support@aives.edu.vn">{t('login.contact')}</a></p></section></main>
}
