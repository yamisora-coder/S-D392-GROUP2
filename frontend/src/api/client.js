const BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'Có lỗi xảy ra khi gọi API.')
    error.details = data.details || {}
    throw error
  }
  return data
}

export const json = (method, body) => ({ method, body: JSON.stringify(body) })
export const query = (params) => {
  const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value))
  return search.toString() ? `?${search}` : ''
}

// Domain CRUD functions are kept in the files next to this client.
