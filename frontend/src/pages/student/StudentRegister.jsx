import React, { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import {
  GraduationCap,
  User,
  Camera,
  Mic,
  Square,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

export const StudentRegister = () => {
  const [name, setName] = useState('')
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null)
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState(null)

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [voiceBlob, setVoiceBlob] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const webcamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const timerRef = useRef(null)
  const audioChunksRef = useRef([])

  const { login } = useAuth()
  const navigate = useNavigate()

  // Snap photo from webcam
  const handleCapturePhoto = useCallback(async () => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) return

    setCapturedPhotoUrl(imageSrc)
    const res = await fetch(imageSrc)
    const blob = await res.blob()
    setCapturedPhotoBlob(blob)
  }, [])

  // Start voice recording
  const startRecording = async () => {
    setVoiceBlob(null)
    audioChunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setVoiceBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      setError('Microphone access denied. You can proceed without voice enrollment.')
    }
  }

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!capturedPhotoBlob) {
      setError('Please capture your facial snapshot for registration.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const data = await authService.registerStudent(name.trim(), capturedPhotoBlob, voiceBlob)
      setSuccess(`Profile created! Welcome to FaceVPlus, ${data.user.name}.`)
      login(data.access_token, data.user)
      setTimeout(() => navigate('/student/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/40">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Student Registration</h2>
          <p className="mt-1 text-xs text-slate-400">Enroll your face and voice biometrics once</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            id="student_name"
            placeholder="e.g. Raman Sharma"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Face Capture Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Face ID Snapshot (Required)
            </label>

            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-inner">
              {capturedPhotoUrl ? (
                <img src={capturedPhotoUrl} alt="Snapped" className="h-full w-full object-cover" />
              ) : (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              {!capturedPhotoUrl ? (
                <Button variant="secondary" onClick={handleCapturePhoto} className="w-full" icon={Camera}>
                  Snap Photo
                </Button>
              ) : (
                <Button
                  variant="tertiary"
                  onClick={() => {
                    setCapturedPhotoUrl(null)
                    setCapturedPhotoBlob(null)
                  }}
                  className="w-full"
                  icon={RefreshCw}
                >
                  Retake Photo
                </Button>
              )}
            </div>
          </div>

          {/* Voice Enrollment Section (Optional) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Voiceprint Enrollment (Recommended)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Record saying: <em>"I am present, my name is {name || '...'}"</em>
                </p>
              </div>

              {voiceBlob && (
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Voice Enrolled
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isRecording ? (
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={startRecording}
                  icon={Mic}
                >
                  {voiceBlob ? 'Record Voice Again' : 'Record Voice (3s)'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={stopRecording}
                  icon={Square}
                >
                  Stop ({recordingSeconds}s)
                </Button>
              )}
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={Boolean(success)} className="w-full" icon={Sparkles}>
            Complete Account Registration
          </Button>
        </form>

        <div className="border-t border-slate-800 pt-5 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/student/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Sign in with Face-ID
          </Link>
        </div>
      </div>
    </div>
  )
}

