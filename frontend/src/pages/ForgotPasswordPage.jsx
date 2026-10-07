import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const { t, locale, setLocale } = useLanguage()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!email.trim()) {
      setError(t('forgotPassword.required'))
      return
    }
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setLoading(false)
    }
  }

  return <main className="login-page"><section className="login-card"><button className="language-button login-language" type="button" onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}>{locale.toUpperCase()}</button><div className="brand-mark">A</div><h1>{t('forgotPassword.title')}</h1><p className="login-subtitle">{t('forgotPassword.subtitle')}</p>{sent ? <div className="reset-success"><p>{t('forgotPassword.sent')}</p><button className="button primary full" type="button" onClick={() => navigate('/login')}>{t('forgotPassword.backToLogin')}</button></div> : <form onSubmit={submit}><label>{t('forgotPassword.email')}<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@university.edu" type="email" autoComplete="email" /></label>{error && <p className="form-error">{error}</p>}<button className="button primary full" type="submit" disabled={loading}>{loading ? t('forgotPassword.sending') : t('forgotPassword.submit')}</button></form>}<p className="login-help"><button className="text-link" type="button" onClick={() => navigate('/login')}>{t('forgotPassword.backToLogin')}</button></p></section></main>
}
