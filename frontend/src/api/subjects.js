import { json, request } from './client'

export const subjectApi = {
  list: () => request('/api/subjects'),
  create: (body) => request('/api/subjects', json('POST', body)),
  update: (id, body) => request(`/api/subjects/${id}`, json('PUT', body)),
  remove: (id) => request(`/api/subjects/${id}`, { method: 'DELETE' }),
}
