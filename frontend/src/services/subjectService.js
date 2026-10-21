import api from './api'

export const subjectService = {
  async getSubjects() {
    const res = await api.get('/subjects')
    return res.data
  },

  async createSubject(data) {
    const res = await api.post('/subjects', data)
    return res.data
  },

  async deleteSubject(subjectId) {
    const res = await api.delete(`/subjects/${subjectId}`)
    return res.data
  },

  async getSubjectStudents(subjectId) {
    const res = await api.get(`/subjects/${subjectId}/students`)
    return res.data
  },

  async getShareDetails(subjectId) {
    const res = await api.get(`/subjects/${subjectId}/share`)
    return res.data
  },

  async enrollStudent(subjectCode) {
    const res = await api.post('/subjects/enroll', { subject_code: subjectCode })
    return res.data
  },

  async unenrollStudent(subjectId) {
    const res = await api.delete(`/subjects/${subjectId}/enroll`)
    return res.data
  },

  async getMyEnrolledSubjects() {
    const res = await api.get('/subjects/student/my-subjects')
    return res.data
  },
}

