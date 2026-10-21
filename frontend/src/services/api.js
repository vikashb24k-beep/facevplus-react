import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const clearStoredAuth = (notify = true) => {
  localStorage.removeItem('facevplus_token')
  localStorage.removeItem('facevplus_user')
  if (notify) window.dispatchEvent(new Event('facevplus:unauthorized'))
}

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('facevplus_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      clearStoredAuth()
    }
    return Promise.reject(error)
  }
)

export default api
