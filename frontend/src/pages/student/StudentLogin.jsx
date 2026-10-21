import React, { useState, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Webcam from 'react-webcam'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { Button } from '../../components/common/Button'
import { ScanFace, AlertCircle, CheckCircle2 } from 'lucide-react'

export const StudentLogin = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const webcamRef = useRef(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnPath = searchParams.get('return')?.startsWith('/') ? searchParams.get('return') : '/student/dashboard'

  const handleFaceLogin = useCallback(async () => {
    if (loading) return
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) {
      setError('Camera frame unavailable. Please check camera permissions.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(imageSrc)
      const blob = await res.blob()
      const data = await authService.loginStudentFace(blob)

      setSuccess(`Welcome back, ${data.user.name}!`)
      login(data.access_token, data.user)
      setTimeout(() => navigate(returnPath, { replace: true }), 1200)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Face not recognized. If you are a new student, please register first.'
      )
    } finally {
      setLoading(false)
    }
  }, [login, navigate])

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/40 text-center">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
            <ScanFace className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Student Face-ID Login</h2>
          <p className="mt-1 text-xs text-slate-400">Position your face in the center of the frame</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium text-left">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium text-left">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Live Camera View with Face Target Guide */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-indigo-500/40 bg-black shadow-inner">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }}
            className="h-full w-full object-cover"
          />

          {/* Oval Face Guide Overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-36 rounded-full border-2 border-dashed border-indigo-400/60 shadow-lg shadow-indigo-500/20 animate-pulse" />
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleFaceLogin}
          loading={loading}
          disabled={Boolean(success)}
          className="w-full"
          icon={ScanFace}
        >
          {loading ? 'Analyzing Facial Features...' : 'Authenticate with Face-ID'}
        </Button>

        <div className="border-t border-slate-800 pt-5 text-center text-xs text-slate-400">
          Not recognized or new student?{' '}
          <Link to="/student/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Register face &amp; voice profile
          </Link>
        </div>
      </div>
    </div>
  )
}
