/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

const toSession = (user) => ({
  id: user.userId ?? user.id,
  name: user.fullName || user.name || user.email,
  email: user.email,
  role: user.roles?.[0] || user.role || 'STUDENT',
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('aives-token')
    const stored = localStorage.getItem('aives-session')
    if (!token || !stored) return null
    try { return JSON.parse(stored) } catch { return null }
  })

  const login = async (identifier, password, rememberMe = false) => {
    const response = await authApi.login({ identifier: identifier.trim(), password, rememberMe })
    if (!response?.token || !response?.userId) throw new Error('Phản hồi đăng nhập không hợp lệ.')
    const user = toSession(response)
    localStorage.setItem('aives-token', response.token)
    localStorage.setItem('aives-session', JSON.stringify(user))
    setSession(user)
    return user
  }

  const register = async (form) => {
    const response = await authApi.register({
      fullName: form.name.trim(),
      studentCode: form.studentCode.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    })
    if (!response?.token || !response?.userId) throw new Error('Phản hồi đăng ký không hợp lệ.')
    const user = toSession(response)
    localStorage.setItem('aives-token', response.token)
    localStorage.setItem('aives-session', JSON.stringify(user))
    setSession(user)
    return user
  }

  const logout = useCallback(async () => {
    try { await authApi.logout() } finally {
      localStorage.removeItem('aives-token')
      localStorage.removeItem('aives-session')
      setSession(null)
    }
  }, [])

  const forgotPassword = (email) => authApi.forgotPassword(email.trim())
  const resetPassword = (body) => authApi.resetPassword(body)

  return <AuthContext.Provider value={{ session, login, register, logout, forgotPassword, resetPassword }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
