import { query, request } from './client'

export const userApi = {
  list: (role) => request(`/api/users${query({ role })}`),
}
