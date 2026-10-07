import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

export function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const { t, locale, setLocale } = useLanguage()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const token = params.get('token') || ''

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!token) return setError(t('forgotPassword.invalidToken'))
    if (password.length < 6) return setError(t('forgotPassword.passwordMin'))
    if (password !== confirmPassword) return setError(t('forgotPassword.passwordMismatch'))
    setLoading(true)
    try {
      await resetPassword({ token, newPassword: password, confirmPassword })
      setCompleted(true)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-page"><section className="login-card"><button className="language-button login-language" type="button" onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}>{locale.toUpperCase()}</button><div className="brand-mark">A</div><h1>{t('forgotPassword.resetTitle')}</h1><p className="login-subtitle">{t('forgotPassword.resetSubtitle')}</p>{completed ? <div className="reset-success"><p>{t('forgotPassword.resetSuccess')}</p><button className="button primary full" type="button" onClick={() => navigate('/login')}>{t('forgotPassword.backToLogin')}</button></div> : <form onSubmit={submit}><label>{t('forgotPassword.newPassword')}<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" /></label><label>{t('forgotPassword.confirmPassword')}<input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" /></label>{error && <p className="form-error">{error}</p>}<button className="button primary full" type="submit" disabled={loading}>{loading ? t('forgotPassword.saving') : t('forgotPassword.resetSubmit')}</button></form>}<p className="login-help"><button className="text-link" type="button" onClick={() => navigate('/login')}>{t('forgotPassword.backToLogin')}</button></p></section></main>
}
