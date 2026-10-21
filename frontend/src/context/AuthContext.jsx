import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('facevplus_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('facevplus_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('facevplus_token')
      if (storedToken) {
        try {
          const userData = await authService.getMe()
          setUser(userData)
          localStorage.setItem('facevplus_user', JSON.stringify(userData))
        } catch (_err) {
          console.warn('Session expired or invalid token.')
          setUser(null)
          setToken(null)
          localStorage.removeItem('facevplus_token')
          localStorage.removeItem('facevplus_user')
        }
      }
      setLoading(false)
    }

    verifyUser()
  }, [])

  const login = (accessToken, userData) => {
    setToken(accessToken)
    setUser(userData)
    localStorage.setItem('facevplus_token', accessToken)
    localStorage.setItem('facevplus_user', JSON.stringify(userData))
  }

  const logout = async () => {
    await authService.logout()
    setToken(null)
    setUser(null)
    localStorage.removeItem('facevplus_token')
    localStorage.removeItem('facevplus_user')
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

