import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { clearStoredAuth } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('facevplus_token'))
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
    setToken(null)
    clearStoredAuth(false)
  }, [])

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('facevplus_token')
      if (storedToken) {
        try {
          const userData = await authService.getMe()
          setUser(userData)
          localStorage.setItem('facevplus_user', JSON.stringify(userData))
        } catch (_err) {
          clearSession()
        }
      }
      setLoading(false)
    }

    verifyUser()
  }, [clearSession])

  useEffect(() => {
    const handleUnauthorized = () => clearSession()
    window.addEventListener('facevplus:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('facevplus:unauthorized', handleUnauthorized)
  }, [clearSession])

  const login = (accessToken, userData) => {
    if (!accessToken || !userData?.id || !userData?.role) {
      throw new Error('Invalid authentication response.')
    }
    setToken(accessToken)
    setUser(userData)
    localStorage.setItem('facevplus_token', accessToken)
    localStorage.setItem('facevplus_user', JSON.stringify(userData))
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      clearSession()
    }
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
