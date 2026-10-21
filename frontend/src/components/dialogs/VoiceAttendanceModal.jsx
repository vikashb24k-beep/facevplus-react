import React, { useState, useRef } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { attendanceService } from '../../services/attendanceService'
import { Mic, Square, Upload, Play, AlertCircle, Volume2, CheckCircle } from 'lucide-react'

export const VoiceAttendanceModal = ({
  isOpen,
  onClose,
  subjectId,
  onAnalysisComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const timerRef = useRef(null)
  const audioChunksRef = useRef([])

  const startRecording = async () => {
    setError('')
    setAudioBlob(null)
    setAudioUrl(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Determine best supported MIME type for recording
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const recordedMime = mediaRecorderRef.current.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: recordedMime })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      setError('Microphone permission denied or device not found.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioBlob(file)
      setAudioUrl(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleAnalyze = async () => {
    if (!audioBlob) {
      setError('Please record or upload classroom audio first.')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Use a consistent filename; librosa handles webm/ogg/wav on the backend
      const filename =
        audioBlob.type.includes('ogg') ? 'classroom_audio.ogg'
        : audioBlob.type.includes('webm') ? 'classroom_audio.webm'
        : 'classroom_audio.wav'
      const audioFile = new File([audioBlob], filename, { type: audioBlob.type })
      const result = await attendanceService.processVoiceAttendance(subjectId, audioFile)
      onAnalysisComplete(result)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process voice recognition.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Voice Recognition Attendance"
      subtitle="Record audio of students calling out presence (e.g. 'Present', 'Yes sir')"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Audio Recording Card */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
          <div
            className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 transition-all ${
              isRecording
                ? 'border-red-500 bg-red-500/20 shadow-lg shadow-red-500/30 animate-pulse'
                : 'border-slate-800 bg-slate-900 text-indigo-400'
            }`}
          >
            <Mic className={`h-10 w-10 ${isRecording ? 'text-red-400' : 'text-indigo-400'}`} />
          </div>

          <div className="mt-4">
            {isRecording ? (
              <div className="space-y-1">
                <span className="text-2xl font-mono font-bold text-red-400">{formatTime(recordingTime)}</span>
                <p className="text-xs text-slate-400">Recording audio in progress...</p>
              </div>
            ) : audioBlob ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Audio ready for analysis
                </p>
                {audioUrl && (
                  <audio controls src={audioUrl} className="mt-2 h-10 w-full max-w-xs rounded-xl" />
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Press start and record classroom roll call</p>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            {!isRecording ? (
              <Button variant="primary" onClick={startRecording} icon={Mic}>
                {audioBlob ? 'Record Again' : 'Start Recording'}
              </Button>
            ) : (
              <Button variant="danger" onClick={stopRecording} icon={Square}>
                Stop Recording
              </Button>
            )}
          </div>
        </div>

        {/* File Upload Alternative */}
        <div className="relative flex items-center justify-center border-t border-slate-800 pt-4">
          <span className="absolute -top-2.5 bg-slate-900 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            or upload recorded audio
          </span>
        </div>

        <div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-3 text-xs font-medium text-slate-300 transition hover:border-indigo-500 hover:text-white">
            <Upload className="h-4 w-4 text-indigo-400" />
            <span>Select audio file (.wav, .mp3, .webm)</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleAnalyze}
            disabled={!audioBlob}
            loading={loading}
            icon={Volume2}
          >
            Analyze Audio
          </Button>
        </div>
      </div>
    </Modal>
  )
}

