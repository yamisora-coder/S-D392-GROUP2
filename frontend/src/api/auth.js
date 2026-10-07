import { json, request } from './client'

export const authApi = {
  login: (body) => request('/api/auth/login', json('POST', body)),
  register: (body) => request('/api/auth/register', json('POST', body)),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => request('/api/auth/forgot-password', json('POST', { email })),
  resetPassword: (body) => request('/api/auth/reset-password', json('POST', body)),
}
