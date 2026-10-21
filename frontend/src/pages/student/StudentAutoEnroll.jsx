import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { subjectService } from '../../services/subjectService'
import { Button } from '../../components/common/Button'
import { GraduationCap, CheckCircle, AlertCircle, ArrowRight, BookOpen } from 'lucide-react'

export const StudentAutoEnroll = () => {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || searchParams.get('join-code') || ''

  const { user, isAuthenticated, isStudent } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleEnroll = async () => {
    if (!code) return
    setLoading(true)
    setError('')
    try {
      const res = await subjectService.enrollStudent(code)
      setSuccess(res.message || 'Successfully enrolled in course!')
      setTimeout(() => navigate('/student/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to enroll in course.')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || !isStudent) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
            <BookOpen className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">Course Enrollment</h2>
          <p className="text-xs text-slate-400">
            You were invited to enroll in subject code{' '}
            <strong className="text-indigo-400 font-mono text-sm">{code}</strong>.
          </p>
          <p className="text-xs text-slate-400">
            Please sign in with Face-ID to confirm enrollment.
          </p>

          <div className="pt-2">
            <Link
              to="/student/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
            >
              <span>Sign In with Face-ID</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
          <GraduationCap className="h-7 w-7" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white">Quick Course Enrollment</h2>
        <p className="text-sm text-slate-300">
          Would you like to enroll in subject code:
        </p>

        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
          <span className="font-mono text-2xl font-extrabold text-indigo-400 tracking-wider">
            {code}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium text-left">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium text-left">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/student/dashboard')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEnroll}
            loading={loading}
            disabled={Boolean(success)}
            className="flex-1"
          >
            Yes, Enroll Now
          </Button>
        </div>
      </div>
    </div>
  )
}

