import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

export function VivaRoomPage() {
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(105)
  const [recording, setRecording] = useState(true)
  const [followUp, setFollowUp] = useState(false)
  const { t } = useLanguage()
  useEffect(() => { const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer) }, [])
  const complete = () => { setRecording(false); navigate('/student/report') }
  return <section className="viva-page"><header className="viva-header"><div><span className="eyebrow">{t('viva.course')}</span><strong>Trần Hoàng Phúc · SE180123</strong></div><span className="timer-pill">◷ {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span><span className="live-status"><i /> {t('viva.aiOnline')}</span></header><main className="viva-card"><div className="camera-tile"><span>◉</span><small>{t('viva.camera')}</small><b>{t('viva.recording')}</b></div><span className="question-tag">{t('viva.mainQuestion')} · 1/3</span><h1>{followUp ? t('viva.followUpQuestion') : t('viva.question')}</h1><div className="ai-speaking"><i /> {followUp ? t('viva.followUpListening') : t('viva.listening')}</div><div className="waveform">{[3, 5, 8, 6, 9, 7, 5, 8, 4].map((height, index) => <span style={{ height: `${height * 5}px` }} key={index} />)}</div><span className="recording-badge">{recording ? t('viva.recordingAnswer') : t('viva.saved')}</span><div className="transcript-box"><small>{t('viva.transcript')}</small><p>{t('viva.transcriptText')}</p></div><div className="viva-actions"><button className="button secondary" onClick={() => setFollowUp(true)}>{t('viva.askFollowUp')}</button><button className="button primary" onClick={complete}>{t('viva.finish')}</button></div></main></section>
}
