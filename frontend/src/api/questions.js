import { json, query, request } from './client'

export const questionApi = {
  list: (filters = {}) => request(`/api/questions${query(filters)}`),
  create: (body) => request('/api/questions', json('POST', body)),
  update: (id, body) => request(`/api/questions/${id}`, json('PUT', body)),
  setStatus: (id, status) => request(`/api/questions/${id}/status?status=${status}`, { method: 'PATCH' }),
  remove: (id) => request(`/api/questions/${id}`, { method: 'DELETE' }),
}
