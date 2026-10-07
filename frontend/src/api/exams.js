import { json, request } from './client'

export const examApi = {
  list: () => request('/api/exams'),
  create: (body) => request('/api/exams', json('POST', body)),
  update: (id, body) => request(`/api/exams/${id}`, json('PUT', body)),
  remove: (id) => request(`/api/exams/${id}`, { method: 'DELETE' }),
}
