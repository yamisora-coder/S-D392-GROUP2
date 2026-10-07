import { json, request } from './client'

export const subjectApi = {
  list: () => request('/api/courses'),
  create: (body) => request('/api/courses', json('POST', body)),
  update: (id, body) => request(`/api/courses/${id}`, json('PUT', body)),
  remove: (id) => request(`/api/courses/${id}`, { method: 'DELETE' }),
}
