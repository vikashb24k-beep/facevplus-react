import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { subjectService } from '../../services/subjectService'
import { Button } from '../../components/common/Button'
import { GraduationCap, CheckCircle, AlertCircle, ArrowRight, BookOpen, Hash } from 'lucide-react'
import { Input } from '../../components/common/Input'

export const StudentAutoEnroll = () => {
  const [searchParams] = useSearchParams()
  // Preserve the QR code from the URL param
  const urlCode = searchParams.get('code') || searchParams.get('join-code') || ''

  const { isAuthenticated, isStudent } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleEnroll = async () => {
    if (!urlCode) return
    setLoading(true)
    setError('')
    try {
      const res = await subjectService.enrollStudent(urlCode)
      setSuccess(res.message || 'Successfully enrolled in course!')
      setTimeout(() => navigate('/student/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to enroll in course.')
    } finally {
      setLoading(false)
    }
  }

  // Not logged in — preserve the code in the login redirect so we can come back
  if (!isAuthenticated || !isStudent) {
    // Build the return URL so the student lands back here after login
    const returnPath = urlCode
      ? `/student/enroll?code=${encodeURIComponent(urlCode)}`
      : '/student/enroll'

    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
            <BookOpen className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">Course Enrollment</h2>

          {urlCode ? (
            <>
              <p className="text-xs text-slate-400">
                You were invited to enroll in subject code{' '}
                <strong className="text-indigo-400 font-mono text-sm">{urlCode}</strong>.
              </p>
              <p className="text-xs text-slate-400">
                Please sign in with Face-ID to confirm enrollment.
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-400">
              Please sign in with Face-ID first, then use the Enroll in Subject button on your dashboard.
            </p>
          )}

          <div className="pt-2 flex flex-col gap-3">
            <Link
              to={`/student/login?return=${encodeURIComponent(returnPath)}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
            >
              <span>Sign In with Face-ID</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={`/student/register?return=${encodeURIComponent(returnPath)}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <span>New student? Register here</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // No code in URL — show a manual entry form instead of a broken page
  if (!urlCode) {
    return <ManualEnrollFallback navigate={navigate} />
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
            {urlCode}
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

// Fallback shown when /student/enroll is accessed without a ?code= param
function ManualEnrollFallback({ navigate }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter a subject code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await subjectService.enrollStudent(trimmed)
      setSuccess(res.message || 'Successfully enrolled!')
      setTimeout(() => navigate('/student/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to enroll. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
            <Hash className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Enroll in a Subject</h2>
          <p className="mt-1 text-xs text-slate-400">Enter the code provided by your teacher</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}
          <Input
            label="Subject Code"
            id="enroll_code_fallback"
            placeholder="e.g. CS101, PHY201"
            icon={Hash}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoFocus
          />
          <div className="flex items-center gap-3 pt-1">
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={Boolean(success)} className="flex-1">
              Enroll Now
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

