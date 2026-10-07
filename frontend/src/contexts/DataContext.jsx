/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { examApi, questionApi, sessionApi, subjectApi, userApi } from '../api'

export const resources = {
  subjects: { label: 'Môn học', singular: 'môn học', columns: ['code', 'name', 'questionCount', 'examCount'], headings: ['Mã môn', 'Tên môn', 'Câu hỏi', 'Kỳ thi'], fields: [['code', 'Mã môn'], ['name', 'Tên môn'], ['description', 'Mô tả']], search: ['code', 'name'], apiKey: 'subjects' },
  questions: { label: 'Ngân hàng câu hỏi', singular: 'câu hỏi', columns: ['content', 'subjectName', 'bloomLevel', 'status'], headings: ['Nội dung', 'Môn học', 'Bloom', 'Trạng thái'], fields: [['subjectId', 'Môn học (UUID)'], ['content', 'Nội dung câu hỏi'], ['sampleAnswer', 'Đáp án mẫu'], ['bloomLevel', 'Bloom level'], ['status', 'Trạng thái']], search: ['content', 'subjectName', 'status'], apiKey: 'questions' },
  exams: { label: 'Kỳ thi', singular: 'kỳ thi', columns: ['title', 'subjectName', 'durationPerStudentMins', 'maxMainQuestions', 'maxFollowupQuestions'], headings: ['Tên kỳ thi', 'Môn học', 'Phút/thí sinh', 'Câu chính', 'Câu phụ'], fields: [['subjectId', 'Môn học (UUID)'], ['title', 'Tên kỳ thi'], ['durationPerStudentMins', 'Phút mỗi thí sinh'], ['maxMainQuestions', 'Số câu chính'], ['maxFollowupQuestions', 'Số câu phụ']], search: ['title', 'subjectName'], apiKey: 'exams' },
  sessions: { label: 'Ca thi', singular: 'ca thi', columns: ['examTitle', 'studentName', 'studentCode', 'scheduledStartTime', 'status'], headings: ['Kỳ thi', 'Sinh viên', 'MSSV', 'Thời gian', 'Trạng thái'], fields: [['examId', 'Kỳ thi (UUID)'], ['studentId', 'Sinh viên (UUID)'], ['scheduledStartTime', 'Thời gian bắt đầu']], search: ['examTitle', 'studentName', 'studentCode', 'status'], apiKey: 'sessions', readOnly: false },
  users: { label: 'Người dùng', singular: 'người dùng', columns: ['fullName', 'email', 'code', 'role'], headings: ['Họ tên', 'Email', 'Mã', 'Vai trò'], fields: [], search: ['fullName', 'email', 'code'], apiKey: 'users', readOnly: true },
}

const initial = { subjects: [], questions: [], exams: [], sessions: [], users: [] }
const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [subjects, questions, exams, sessions, users] = await Promise.all([
        subjectApi.list(), questionApi.list(), examApi.list(), sessionApi.list(), userApi.list(),
      ])
      setData({ subjects, questions, exams, sessions, users })
    } catch (cause) {
      setError(cause.message)
    } finally {
      setLoading(false)
    }
  }, [])
  // The initial API request is intentionally triggered once when the provider mounts.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const createItem = async (key, item) => {
    const created = key === 'subjects' ? await subjectApi.create(item) : key === 'questions' ? await questionApi.create(item) : key === 'exams' ? await examApi.create(item) : await sessionApi.create(item)
    setData((current) => ({ ...current, [key]: [...current[key], created] }))
  }
  const updateItem = async (key, item) => {
    const updated = key === 'subjects' ? await subjectApi.update(item.id, item) : key === 'questions' ? await questionApi.update(item.id, item) : await examApi.update(item.id, item)
    setData((current) => ({ ...current, [key]: current[key].map((entry) => entry.id === item.id ? updated : entry) }))
  }
  const deleteItem = async (key, id) => {
    if (key === 'subjects') await subjectApi.remove(id)
    if (key === 'questions') await questionApi.remove(id)
    if (key === 'exams') await examApi.remove(id)
    if (key === 'sessions') await sessionApi.remove(id)
    setData((current) => ({ ...current, [key]: current[key].filter((entry) => entry.id !== id) }))
  }
  const setQuestionStatus = async (id, status) => {
    const updated = await questionApi.setStatus(id, status)
    setData((current) => ({ ...current, questions: current.questions.map((entry) => entry.id === id ? updated : entry) }))
  }
  const gradeSession = async (id, body) => {
    const updated = await sessionApi.grade(id, body)
    setData((current) => ({ ...current, sessions: current.sessions.map((entry) => entry.id === id ? updated : entry) }))
  }
  return <DataContext.Provider value={{ data, loading, error, reload: load, createItem, updateItem, deleteItem, setQuestionStatus, gradeSession }}>{children}</DataContext.Provider>
}

export function useData() { return useContext(DataContext) }
