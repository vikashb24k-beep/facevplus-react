import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { subjectService } from '../../services/subjectService'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { AlertCircle, BookOpen, CheckCircle, GraduationCap } from 'lucide-react'

export const StudentAutoEnroll = () => {
  const { inviteCode: pathCode } = useParams()
  const [searchParams] = useSearchParams()
  const inviteCode = pathCode || searchParams.get('code') || searchParams.get('join-code') || ''
  const { isAuthenticated, isStudent, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    if (!inviteCode) {
      setLoading(false)
      setError('This invitation link is missing a subject code.')
      return () => { active = false }
    }
    setLoading(true)
    subjectService.getInvitation(inviteCode)
      .then((data) => active && setInvitation(data))
      .catch((err) => active && setError(err.response?.data?.detail || 'This invitation is invalid or expired.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [inviteCode])

  if (authLoading || loading) return <LoadingSpinner text="Checking invitation..." />

  const returnPath = `/join/${encodeURIComponent(inviteCode)}`
  if (error && !invitation) {
    return <JoinCard title="Invalid invitation" icon={AlertCircle}>
      <Message icon={AlertCircle} tone="error">{error}</Message>
    </JoinCard>
  }
  if (!isAuthenticated) {
    return <JoinCard title="Subject invitation" icon={BookOpen}>
      <p className="text-sm text-slate-300">Sign in or register as a student to join this subject.</p>
      <div className="flex gap-3 pt-2">
        <Link className="flex-1 rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white" to={`/student/login?return=${encodeURIComponent(returnPath)}`}>Student login</Link>
        <Link className="flex-1 rounded-xl border border-slate-700 py-3 text-center text-sm font-semibold text-slate-300" to={`/student/register?return=${encodeURIComponent(returnPath)}`}>Register</Link>
      </div>
    </JoinCard>
  }

  if (!isStudent) {
    return <JoinCard title="Student account required" icon={AlertCircle}>
      <p className="text-sm text-slate-300">Teacher accounts cannot enroll in subjects. Log out and scan the invitation with a student account.</p>
    </JoinCard>
  }

  const handleJoin = async () => {
    if (joining || success) return
    setJoining(true)
    setError('')
    try {
      const result = await subjectService.joinSubject(inviteCode)
      setSuccess(result.message || 'You joined the subject successfully.')
      setTimeout(() => navigate('/student/dashboard', { replace: true }), 1200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to join this subject.')
    } finally {
      setJoining(false)
    }
  }

  return <JoinCard title="Join subject" icon={GraduationCap}>
    {error ? <Message icon={AlertCircle} tone="error">{error}</Message> : null}
    {success ? <Message icon={CheckCircle} tone="success">{success}</Message> : null}
    {invitation ? <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 text-left">
      <h2 className="text-xl font-bold text-white">{invitation.subject_name}</h2>
      <p className="mt-1 text-sm text-slate-300">Section {invitation.section} · Teacher: {invitation.teacher_name}</p>
      <p className="mt-2 font-mono text-xs text-indigo-300">Code: {invitation.subject_code}</p>
    </div> : null}
    <Button variant="primary" loading={joining} disabled={!invitation || Boolean(success)} onClick={handleJoin} className="w-full">Join Subject</Button>
  </JoinCard>
}

function JoinCard({ title, icon: Icon, children }) {
  return <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl">
      <Icon className="mx-auto h-12 w-12 text-indigo-400" />
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {children}
    </div>
  </div>
}

function Message({ icon: Icon, tone, children }) {
  const color = tone === 'success' ? 'text-emerald-400' : 'text-red-400'
  return <div className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm ${color}`}><Icon className="h-4 w-4 shrink-0" />{children}</div>
}
