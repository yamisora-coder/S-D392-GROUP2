import { json, request } from './client'

export const rubricApi = {
  list: () => request('/api/rubrics'),
  create: (body) => request('/api/rubrics', json('POST', body)),
  update: (id, body) => request(`/api/rubrics/${id}`, json('PUT', body)),
  remove: (id) => request(`/api/rubrics/${id}`, { method: 'DELETE' }),
}
