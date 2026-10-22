import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar } from './components/common/Navbar'
import { Footer } from './components/common/Footer'
import { LoadingSpinner } from './components/common/LoadingSpinner'

// Pages
import { HomePage } from './pages/HomePage'
import { TeacherLogin } from './pages/teacher/TeacherLogin'
import { TeacherRegister } from './pages/teacher/TeacherRegister'
import { TeacherDashboard } from './pages/teacher/TeacherDashboard'
import { TeacherAttendanceRegister } from './pages/teacher/TeacherAttendanceRegister'
import { TeacherStudentAttendanceHistory } from './pages/teacher/TeacherStudentAttendanceHistory'
import { StudentLogin } from './pages/student/StudentLogin'
import { StudentRegister } from './pages/student/StudentRegister'
import { StudentDashboard } from './pages/student/StudentDashboard'
import { StudentAutoEnroll } from './pages/student/StudentAutoEnroll'

// Protected Route Guard for Teachers
const TeacherRoute = ({ children }) => {
  const { isAuthenticated, isTeacher, loading } = useAuth()
  if (loading) return <LoadingSpinner text="Checking authentication..." />
  if (!isAuthenticated || !isTeacher) {
    return <Navigate to="/teacher/login" replace />
  }
  return children
}

// Protected Route Guard for Students
const StudentRoute = ({ children }) => {
  const { isAuthenticated, isStudent, loading } = useAuth()
  if (loading) return <LoadingSpinner text="Checking authentication..." />
  if (!isAuthenticated || !isStudent) {
    return <Navigate to="/student/login" replace />
  }
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/teacher/login" element={<TeacherLogin />} />
              <Route path="/teacher/register" element={<TeacherRegister />} />
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student/register" element={<StudentRegister />} />
              <Route path="/student/enroll" element={<StudentAutoEnroll />} />
              <Route path="/join/:inviteCode" element={<StudentAutoEnroll />} />

              {/* Protected Teacher Routes */}
              <Route
                path="/teacher/dashboard"
                element={
                  <TeacherRoute>
                    <TeacherDashboard />
                  </TeacherRoute>
                }
              />
              <Route
                path="/teacher/subjects/:subjectId/register"
                element={<TeacherRoute><TeacherAttendanceRegister /></TeacherRoute>}
              />
              <Route
                path="/teacher/subjects/:subjectId/students/:studentId"
                element={<TeacherRoute><TeacherStudentAttendanceHistory /></TeacherRoute>}
              />

              {/* Protected Student Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <StudentRoute>
                    <StudentDashboard />
                  </StudentRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
