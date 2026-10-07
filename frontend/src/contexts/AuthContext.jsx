/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem('aives-session')
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch {
      return { name: stored, role: 'INSTRUCTOR' }
    }
  })

  const login = (email, password, role = 'INSTRUCTOR') => {
    if (!email.trim() || !password.trim()) return false
    const user = { name: email.split('@')[0] || 'User', role }
    localStorage.setItem('aives-session', JSON.stringify(user))
    setSession(user)
    return true
  }

  const loginWithSso = () => {
    const user = { name: 'Google User', role: 'STUDENT' }
    localStorage.setItem('aives-session', JSON.stringify(user))
    setSession(user)
  }

  const register = (name, email, password, role = 'STUDENT') => {
    if (!name.trim() || !email.trim() || !password.trim()) return false
    const user = { name: name.trim(), role }
    localStorage.setItem('aives-session', JSON.stringify(user))
    setSession(user)
    return true
  }

  const logout = useCallback(() => {
    localStorage.removeItem('aives-session')
    setSession(null)
  }, [])

  return <AuthContext.Provider value={{ session, login, register, loginWithSso, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
