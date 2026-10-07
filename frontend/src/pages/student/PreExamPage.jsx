import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

export function PreExamPage() {
  const navigate = useNavigate()
  const [completed, setCompleted] = useState([])
  const { t } = useLanguage()
  const checks = [{ key: 'camera', icon: '▣', title: t('preExam.camera'), text: t('preExam.cameraText') }, { key: 'microphone', icon: '◉', title: t('preExam.microphone'), text: t('preExam.microphoneText') }, { key: 'network', icon: '⌁', title: t('preExam.network'), text: t('preExam.networkText') }]
  const finish = (key) => setCompleted((current) => current.includes(key) ? current : [...current, key])
  return <section className="student-page"><div className="page-heading"><div><p className="eyebrow blue-text">{t('preExam.eyebrow')}</p><h1>{t('preExam.title')}</h1><p className="muted">{t('preExam.subtitle')}</p></div><span className="check-progress">{completed.length}/3 {t('preExam.ready')}</span></div><div className="check-grid">{checks.map((check) => <article className={`check-card ${completed.includes(check.key) ? 'checked' : ''}`} key={check.key}><span className="check-icon">{completed.includes(check.key) ? '✓' : check.icon}</span><h2>{check.title}</h2><p>{check.text}</p><button className="button secondary" onClick={() => finish(check.key)}>{completed.includes(check.key) ? t('preExam.readyButton') : t('preExam.runCheck')}</button></article>)}</div><div className="wizard-footer"><button className="button primary" disabled={completed.length !== 3} onClick={() => navigate('/student/exam')}>{t('preExam.enterRoom')}</button></div></section>
}
