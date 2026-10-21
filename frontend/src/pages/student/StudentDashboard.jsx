import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { subjectService } from '../../services/subjectService'
import { Button } from '../../components/common/Button'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { SubjectCard } from '../../components/subjects/SubjectCard'
import { EnrollModal } from '../../components/dialogs/EnrollModal'
import {
  GraduationCap,
  PlusCircle,
  BookOpen,
  CheckCircle,
  CalendarDays,
  Percent,
} from 'lucide-react'

export const StudentDashboard = () => {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const fetchEnrolledSubjects = async () => {
    try {
      const data = await subjectService.getMyEnrolledSubjects()
      setSubjects(data)
    } catch (err) {
      console.error('Failed to fetch student courses', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrolledSubjects()
  }, [])

  const handleUnenroll = async (subjectId, subjectName) => {
    if (window.confirm(`Are you sure you want to unenroll from ${subjectName}?`)) {
      try {
        await subjectService.unenrollStudent(subjectId)
        setToastMessage(`Unenrolled from ${subjectName} successfully.`)
        setTimeout(() => setToastMessage(''), 3000)
        fetchEnrolledSubjects()
      } catch (err) {
        alert('Failed to unenroll from course.')
      }
    }
  }

  // Summary statistics
  const totalClasses = subjects.reduce((acc, s) => acc + (s.total_classes || 0), 0)
  const totalAttended = subjects.reduce((acc, s) => acc + (s.attended_classes || 0), 0)
  const overallRate = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0

  return (
    <div className="space-y-8 py-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track your enrolled courses and view your attendance records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsEnrollModalOpen(true)}
            icon={PlusCircle}
          >
            Enroll in Subject
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Enrolled Courses
            </span>
            <BookOpen className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">{subjects.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Sessions Held
            </span>
            <CalendarDays className="h-5 w-5 text-pink-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">{totalClasses}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Overall Attendance
            </span>
            <Percent className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-400">{overallRate}%</div>
        </div>
      </div>

      {/* Enrolled Courses Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Your Enrolled Subjects</h2>

        {loading ? (
          <LoadingSpinner text="Loading courses..." />
        ) : subjects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-white">No Enrolled Courses</h3>
            <p className="mt-1 text-sm text-slate-400">
              Ask your teacher for a subject code or scan their QR code to enroll.
            </p>
            <Button
              variant="primary"
              className="mt-5"
              onClick={() => setIsEnrollModalOpen(true)}
              icon={PlusCircle}
            >
              Enroll in Subject
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((sub) => (
              <SubjectCard
                key={sub.subject_id}
                subject={sub}
                isTeacher={false}
                onUnenroll={handleUnenroll}
              />
            ))}
          </div>
        )}
      </div>

      <EnrollModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnrolled={fetchEnrolledSubjects}
      />
    </div>
  )
}

