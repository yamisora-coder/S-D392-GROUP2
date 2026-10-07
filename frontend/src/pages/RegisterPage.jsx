import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { t, locale, setLocale } = useLanguage()
  const [form, setForm] = useState({ name: '', studentCode: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.studentCode.trim() || !form.email.trim() || !form.password.trim()) return setError(t('register.required'))
    if (form.password.length < 6) return setError(t('register.passwordMin'))
    if (form.password !== form.confirmPassword) return setError(t('register.passwordMismatch'))
    try { await register(form); navigate('/dashboard') } catch (cause) { setError(cause.message) }
  }
  return <main className="login-page"><section className="login-card register-card"><button className="language-button login-language" type="button" onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}>{locale.toUpperCase()}</button><div className="brand-mark">A</div><h1>{t('register.title')}</h1><p className="login-subtitle">{t('register.subtitle')}</p><form onSubmit={submit}><label>{t('register.name')}<input value={form.name} onChange={update('name')} autoComplete="name" /></label><label>{t('register.studentCode')}<input value={form.studentCode} onChange={update('studentCode')} /></label><label>{t('register.email')}<input value={form.email} onChange={update('email')} type="email" autoComplete="email" /></label><label>{t('register.password')}<input value={form.password} onChange={update('password')} type="password" autoComplete="new-password" /></label><label>{t('register.confirmPassword')}<input value={form.confirmPassword} onChange={update('confirmPassword')} type="password" autoComplete="new-password" /></label>{error && <p className="form-error">{error}</p>}<button className="button primary full" type="submit">{t('register.submit')}</button></form><p className="login-help">{t('register.hasAccount')} <button className="text-link" type="button" onClick={() => navigate('/login')}>{t('register.signIn')}</button></p></section></main>
}
