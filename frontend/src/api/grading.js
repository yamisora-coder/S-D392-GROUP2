import { json, request } from './client'

export const gradingApi = {
  list: () => request('/api/grading/sessions'),
  review: (sessionId) => request(`/api/grading/sessions/${sessionId}`),
  regradeSession: (sessionId, onlyMissing = true) => request(`/api/grading/sessions/${sessionId}/ai-regrade?onlyMissing=${onlyMissing}`, { method: 'POST' }),
  regradeTurn: (sessionId, turnId) => request(`/api/grading/sessions/${sessionId}/turns/${turnId}/ai-regrade`, { method: 'POST' }),
  confirm: (sessionId, body) => request(`/api/grading/sessions/${sessionId}/final-grade`, json('PUT', body)),
}
