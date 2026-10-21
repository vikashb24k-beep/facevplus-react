import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { School, User, Lock, UserCheck, ArrowRight, AlertCircle } from 'lucide-react'

export const TeacherRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirm_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.username || !formData.name || !formData.password || !formData.confirm_password) {
      setError('All fields are required.')
      return
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await authService.registerTeacher({
        username: formData.username,
        name: formData.name,
        password: formData.password,
      })
      login(data.access_token, data.user)
      navigate('/teacher/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/40">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mb-4 shadow-inner">
            <School className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Teacher Profile</h2>
          <p className="mt-1 text-xs text-slate-400">Join FaceVPlus to manage courses and attendance</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            id="name"
            placeholder="e.g. Prof. Vikash Kumar"
            icon={UserCheck}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Username"
            id="username"
            placeholder="Choose username"
            icon={User}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            autoComplete="username"
          />

          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="Create password"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            id="confirm_password"
            type="password"
            placeholder="Confirm password"
            icon={Lock}
            value={formData.confirm_password}
            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
            autoComplete="new-password"
          />

          <Button type="submit" variant="secondary" size="lg" loading={loading} className="w-full mt-2">
            <span>Register Profile</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="border-t border-slate-800 pt-5 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/teacher/login" className="font-semibold text-pink-400 hover:text-pink-300">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}

