import { json, request } from './client'

export const sessionApi = {
  list: () => request('/api/sessions'),
  listByExam: (examId) => request(`/api/sessions/exam/${examId}`),
  create: (body) => request('/api/sessions', json('POST', body)),
  grade: (id, body) => request(`/api/sessions/${id}/grade`, json('PATCH', body)),
  remove: (id) => request(`/api/sessions/${id}`, { method: 'DELETE' }),
}
