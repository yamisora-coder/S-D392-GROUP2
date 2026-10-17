const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

export async function request(path, options = {}) {
  const token = localStorage.getItem('aives-token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const response = await fetch(`${BASE_URL}${normalizedPath}`, {
    headers,
    ...options,
  })
  if (response.status === 204) return null
  if (response.status === 401) {
    localStorage.removeItem('aives-token')
    localStorage.removeItem('aives-user')
    if (typeof window !== 'undefined' && !normalizedPath.includes('/auth/login')) {
      window.dispatchEvent(new CustomEvent('aives-unauthorized'))
    }
  }
  const data = await response.json().catch(() => ({}))
  const payload = data?.success === false ? data : data
  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || 'Có lỗi xảy ra khi gọi API.')
    error.status = response.status
    error.details = payload?.data || payload?.details || {}
    throw error
  }
  return data?.success === true && Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data
}

export const json = (method, body) => ({ method, body: JSON.stringify(body) })
export const query = (params) => {
  const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value))
  return search.toString() ? `?${search}` : ''
}

// Domain CRUD functions are kept in the files next to this client.
