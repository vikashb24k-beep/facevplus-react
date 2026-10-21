import api from './api'

export const attendanceService = {
  async recognizeFaceAttendance(subjectId, imageFiles) {
    const formData = new FormData()
    formData.append('subject_id', subjectId)
    imageFiles.forEach((file, index) => {
      formData.append('files', file, file.name || `photo_${index}.jpg`)
    })
    const res = await api.post('/attendance/face/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async processVoiceAttendance(subjectId, audioBlob) {
    const formData = new FormData()
    formData.append('subject_id', subjectId)
    formData.append('audio_file', audioBlob, 'classroom_audio.wav')
    const res = await api.post('/attendance/voice/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async confirmAttendanceSession(subjectId, logs, timestamp = null) {
    const payload = {
      subject_id: subjectId,
      timestamp: timestamp || new Date().toISOString(),
      logs: logs.map((l) => ({
        student_id: l.student_id,
        is_present: Boolean(l.is_present),
      })),
    }
    const res = await api.post('/attendance/sessions/confirm', payload)
    return res.data
  },

  async getTeacherAttendanceHistory() {
    const res = await api.get('/attendance/teacher')
    return res.data
  },

  async getMyAttendanceHistory() {
    const res = await api.get('/attendance/students/me')
    return res.data
  },
}

