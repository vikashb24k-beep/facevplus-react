import api, { clearStoredAuth } from './api'

export const authService = {
  async registerTeacher(data) {
    const res = await api.post('/auth/teacher/register', data)
    return res.data
  },

  async loginTeacher(data) {
    const res = await api.post('/auth/teacher/login', data)
    return res.data
  },

  async loginStudentFace(imageBlob) {
    const formData = new FormData()
    formData.append('file', imageBlob, 'student_face.jpg')
    const res = await api.post('/auth/student/face-login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async registerStudent(name, faceBlob, voiceBlob = null) {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('face_file', faceBlob, 'registration_face.jpg')
    if (voiceBlob) {
      formData.append('voice_file', voiceBlob, 'registration_voice.wav')
    }
    const res = await api.post('/auth/student/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  async getMe() {
    const res = await api.get('/auth/me')
    return res.data
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (_e) {
      // Ignore network errors on logout
    }
    clearStoredAuth()
  },
}
