import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useData } from '../../contexts/DataContext'
import { useLanguage } from '../../contexts/LanguageContext'

const getSpeechRecognition = () => window.SpeechRecognition || window.webkitSpeechRecognition

export function VivaRoomPage() {
  const navigate = useNavigate()
  const { data } = useData()
  const { session } = useAuth()
  const { t } = useLanguage()
  const assignedSession = JSON.parse(sessionStorage.getItem('aives-current-session') || 'null')
  const questions = useMemo(() => data.questions.filter((question) => Number(question.subjectId) === Number(assignedSession?.courseId || assignedSession?.subjectId) && question.status === 'APPROVED').slice(0, 3), [assignedSession, data.questions])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [seconds, setSeconds] = useState(assignedSession?.durationMinutes ? assignedSession.durationMinutes * 60 : 600)
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [answers, setAnswers] = useState([])
  const [notice, setNotice] = useState('')
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const currentQuestion = questions[questionIndex]
  const questionText = followUp ? `Bạn có thể làm rõ hơn ý chính trong câu trả lời về “${currentQuestion?.content || 'câu hỏi này'}” không?` : currentQuestion?.content || 'Chưa có câu hỏi được duyệt cho môn học này.'

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => () => {
    recognitionRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])
  useEffect(() => {
    if (!currentQuestion) return
    window.speechSynthesis?.cancel()
    const utterance = new SpeechSynthesisUtterance(questionText)
    utterance.lang = 'vi-VN'
    window.speechSynthesis?.speak(utterance)
  }, [currentQuestion, followUp, questionText])

  const startRecording = async () => {
    setNotice('')
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setNotice('Trình duyệt chưa hỗ trợ Speech-to-Text. Bạn có thể nhập transcript thủ công.')
      setRecording(true)
      return
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(streamRef.current)
      mediaRecorderRef.current.start()
      const recognition = new Recognition()
      recognition.lang = 'vi-VN'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event) => {
        const text = Array.from(event.results).map((result) => result[0].transcript).join(' ')
        setTranscript(text)
      }
      recognition.onerror = () => setNotice('Không thể nhận diện giọng nói. Hãy kiểm tra quyền micro hoặc nhập transcript thủ công.')
      recognition.start()
      recognitionRef.current = recognition
      setRecording(true)
    } catch (cause) {
      setNotice(cause.message || 'Không thể mở micro.')
    }
  }
  const stopRecording = () => {
    recognitionRef.current?.stop()
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setRecording(false)
  }
  const saveAnswer = () => {
    stopRecording()
    if (!transcript.trim()) {
      setNotice('Hãy trả lời bằng giọng nói hoặc nhập transcript trước khi lưu.')
      return
    }
    const nextAnswers = [...answers, { questionId: currentQuestion?.id, question: questionText, transcript: transcript.trim(), recordedAt: new Date().toISOString() }]
    setAnswers(nextAnswers)
    setTranscript('')
    if (followUp) {
      setFollowUp(false)
      if (questionIndex < questions.length - 1) setQuestionIndex((value) => value + 1)
    } else {
      setNotice('Transcript đã được lưu cục bộ cho phiên thi này. Bạn có thể yêu cầu AI hỏi đào sâu.')
    }
  }
  const finish = () => {
    stopRecording()
    const report = { sessionId: assignedSession?.id, studentId: session.id, examTitle: assignedSession?.examTitle, answers, completedAt: new Date().toISOString() }
    localStorage.setItem('aives-student-report', JSON.stringify(report))
    navigate('/student/report')
  }
  return <section className="viva-page"><header className="viva-header"><div><span className="eyebrow">{assignedSession?.subjectName || assignedSession?.courseName || t('viva.course')}</span><strong>{session.name}</strong></div><span className="timer-pill">◷ {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span><span className="live-status"><i /> {t('viva.aiOnline')}</span></header><main className="viva-card"><div className="camera-tile"><span>◉</span><small>{t('viva.camera')}</small><b>{recording ? t('viva.recording') : 'Sẵn sàng'}</b></div><span className="question-tag">{followUp ? 'CÂU HỎI ĐÀO SÂU' : t('viva.mainQuestion')} · {Math.min(questionIndex + 1, Math.max(questions.length, 1))}/{Math.max(questions.length, 1)}</span><h1>{questionText}</h1><div className="ai-speaking"><i /> {recording ? 'Đang ghi nhận câu trả lời...' : 'AI đã đọc câu hỏi · hãy trả lời khi sẵn sàng'}</div><div className="waveform">{[3, 5, 8, 6, 9, 7, 5, 8, 4].map((height, index) => <span className={recording ? 'active' : ''} style={{ height: `${height * 5}px` }} key={index} />)}</div><span className="recording-badge">{recording ? t('viva.recordingAnswer') : t('viva.saved')}</span><div className="transcript-box"><small>{t('viva.transcript')}</small><textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Transcript sẽ xuất hiện ở đây hoặc bạn có thể nhập thủ công..." rows="4" /></div>{notice && <div className="api-error">{notice}</div>}<div className="viva-actions">{!recording ? <button className="button secondary" onClick={startRecording}>Bắt đầu trả lời</button> : <button className="button secondary" onClick={stopRecording}>Dừng ghi</button>}<button className="button secondary" disabled={!transcript.trim()} onClick={saveAnswer}>Lưu câu trả lời</button><button className="button secondary" disabled={!answers.length || followUp} onClick={() => setFollowUp(true)}>{t('viva.askFollowUp')}</button><button className="button primary" onClick={finish}>{t('viva.finish')}</button></div></main></section>
}
