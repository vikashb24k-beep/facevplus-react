import React, { useState, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Webcam from 'react-webcam'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import '../../styles/student/student-registration.css'
import {
  GraduationCap,
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
  const [studentId, setStudentId] = useState('')
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
  const [searchParams] = useSearchParams()
  const returnPath = searchParams.get('return')?.startsWith('/') ? searchParams.get('return') : '/student/dashboard'

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

      // Use best supported codec for recording
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : ''

      mediaRecorderRef.current = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const recordedMime = mediaRecorderRef.current.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: recordedMime })
        setVoiceBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (_err) {
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
    if (!/^[1-9]\d*$/.test(studentId.trim())) {
      setError('Please enter your numeric registration or roll number.')
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
      const data = await authService.registerStudent(studentId.trim(), name.trim(), capturedPhotoBlob, voiceBlob)
      setSuccess(`Profile created! Welcome to FaceVPlus, ${data.user.name}.`)
      login(data.access_token, data.user)
      setTimeout(() => navigate(returnPath, { replace: true }), 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="student-registration">
      <div className="student-registration__card">
        <div className="student-registration__header">
          <div className="student-registration__icon">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2>Create your student profile</h2>
            <p>Enter your details, take one photo, then continue.</p>
          </div>
        </div>

        <ol className="student-registration__steps">
          {['Your details', 'Face photo', 'Optional voice'].map((step, index) => (
            <li key={step}>
              <strong>{index + 1}.</strong> {step}
            </li>
          ))}
        </ol>

        {error && (
          <div className="ui-notice ui-notice--error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="ui-notice ui-notice--success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="student-registration__form">
          <div className="student-registration__fields">
            <div className="plain-field"><label htmlFor="student_name">Full Name</label><input id="student_name" placeholder="e.g. Raman Sharma" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="plain-field"><label htmlFor="student_id">Registration / Roll Number</label><input id="student_id" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 202600123" value={studentId} onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))} required /></div>
          </div>

          {/* Face Capture Section */}
          <div>
            <p className="student-registration__section-title">
              2. Take a face photo <span style={{ color: '#f87171' }}>*</span>
            </p>
            <p className="student-registration__hint">Use good lighting and make sure only your face is in the frame.</p>

            <div className="student-registration__camera">
              {capturedPhotoUrl ? (
                <img src={capturedPhotoUrl} alt="Snapped" />
              ) : (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }}
                />
              )}
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              {!capturedPhotoUrl ? (
                <button className="plain-button plain-button--secondary" type="button" onClick={handleCapturePhoto} style={{ width: '100%' }}><Camera size={16} /> Snap photo</button>
              ) : (
                <button className="plain-button plain-button--secondary" type="button" onClick={() => {
                    setCapturedPhotoUrl(null)
                    setCapturedPhotoBlob(null)
                  }} style={{ width: '100%' }}><RefreshCw size={16} /> Retake photo</button>
              )}
            </div>
          </div>

          <details className="student-registration__voice">
            <summary>3. Add a voice sample <span>(optional)</span></summary>
            <div className="student-registration__voice-content">
              <div>
              <div>
                <p className="student-registration__hint">
                  Record saying: <em>"I am present, my name is {name || '...'}"</em>
                </p>
              </div>

              {voiceBlob && (
                <span className="student-registration__hint">
                  Voice Enrolled
                </span>
              )}
            </div>

            <div>
              {!isRecording ? (
                <button className="plain-button plain-button--secondary" type="button" onClick={startRecording}><Mic size={16} /> {voiceBlob ? 'Record voice again' : 'Record voice'}</button>
              ) : (
                <button className="plain-button plain-button--secondary" type="button" onClick={stopRecording}><Square size={16} /> Stop ({recordingSeconds}s)</button>
              )}
            </div>
            </div>
          </details>

          <button className="plain-button" type="submit" disabled={loading || Boolean(success)} style={{ width: '100%' }}><Sparkles size={17} /> {loading ? 'Creating profile...' : 'Create student profile'}</button>
        </form>

        <div className="student-registration__signin">
          Already have an account?{' '}
          <Link to={`/student/login?return=${encodeURIComponent(returnPath)}`}>
            Sign in with Face-ID
          </Link>
        </div>
      </div>
    </div>
  )
}
