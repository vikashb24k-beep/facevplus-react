import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { subjectService } from '../../services/subjectService'
import { attendanceService } from '../../services/attendanceService'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/common/Badge'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { SubjectCard } from '../../components/subjects/SubjectCard'
import { CreateSubjectModal } from '../../components/dialogs/CreateSubjectModal'
import { ShareSubjectModal } from '../../components/dialogs/ShareSubjectModal'
import { AddPhotosModal } from '../../components/dialogs/AddPhotosModal'
import { VoiceAttendanceModal } from '../../components/dialogs/VoiceAttendanceModal'
import { AttendanceReviewModal } from '../../components/dialogs/AttendanceReviewModal'
import {
  ScanFace,
  Mic,
  BookOpen,
  CalendarDays,
  PlusCircle,
  Image as ImageIcon,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

export const TeacherDashboard = () => {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState('take_attendance')

  // Subject state
  const [subjects, setSubjects] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  // Attendance photos state
  const [attendancePhotos, setAttendancePhotos] = useState([])
  const [analyzingFaces, setAnalyzingFaces] = useState(false)
  const [faceError, setFaceError] = useState('')

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [sharingSubject, setSharingSubject] = useState(null)
  const [isAddPhotosModalOpen, setIsAddPhotosModalOpen] = useState(false)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewCandidates, setReviewCandidates] = useState([])

  // Records state
  const [records, setRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [saveToast, setSaveToast] = useState('')

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.getSubjects()
      setSubjects(data)
      if (data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(data[0].subject_id.toString())
      }
    } catch (err) {
      console.error('Failed to fetch subjects', err)
    } finally {
      setLoadingSubjects(false)
    }
  }

  const fetchRecords = async () => {
    setLoadingRecords(true)
    try {
      const data = await attendanceService.getTeacherAttendanceHistory()
      setRecords(data)
    } catch (err) {
      console.error('Failed to fetch attendance history', err)
    } finally {
      setLoadingRecords(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (currentTab === 'attendance_records') {
      fetchRecords()
    }
  }, [currentTab])

  // Run Face Analysis
  const handleRunFaceAnalysis = async () => {
    if (!selectedSubjectId || attendancePhotos.length === 0) return
    setAnalyzingFaces(true)
    setFaceError('')

    try {
      const data = await attendanceService.recognizeFaceAttendance(
        parseInt(selectedSubjectId),
        attendancePhotos
      )
      setReviewCandidates(data.candidates || [])
      setIsReviewModalOpen(true)
    } catch (err) {
      setFaceError(err.response?.data?.detail || 'Face analysis failed.')
    } finally {
      setAnalyzingFaces(false)
    }
  }

  // Handle Voice Attendance Complete
  const handleVoiceAnalysisComplete = (voiceData) => {
    setReviewCandidates(voiceData.candidates || [])
    setIsReviewModalOpen(true)
  }

  // Handle Attendance Confirmation Complete
  const handleAttendanceSaved = (res) => {
    setAttendancePhotos([])
    setSaveToast(res.message || 'Attendance session saved!')
    setTimeout(() => setSaveToast(''), 4000)
    fetchSubjects()
  }

  // Handle Subject Deletion
  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject and its attendance logs?')) {
      try {
        await subjectService.deleteSubject(subjectId)
        fetchSubjects()
      } catch (_err) {
        alert('Failed to delete subject.')
      }
    }
  }

  // Export Records as CSV
  const handleExportCSV = () => {
    if (records.length === 0) return
    const headers = ['Session Time', 'Subject Code', 'Subject Name', 'Section', 'Present Count', 'Total Enrolled', 'Attendance Rate %']
    const rows = records.map((r) => [
      new Date(r.timestamp).toLocaleString(),
      `"${r.subject_code}"`,
      `"${r.subject_name}"`,
      `"${r.section}"`,
      r.present_count,
      r.total_count,
      `${r.rate}%`,
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `FaceVPlus_Attendance_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8 py-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your courses, take AI attendance, and review classroom metrics.
          </p>
        </div>

        {saveToast && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 font-medium animate-bounce">
            <CheckCircle className="h-4 w-4" />
            <span>{saveToast}</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex rounded-2xl border border-slate-800 bg-slate-900/60 p-1.5 max-w-xl">
        <button
          onClick={() => setCurrentTab('take_attendance')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition ${
            currentTab === 'take_attendance'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ScanFace className="h-4 w-4" />
          <span>Take Attendance</span>
        </button>

        <button
          onClick={() => setCurrentTab('manage_subjects')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition ${
            currentTab === 'manage_subjects'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Manage Subjects</span>
        </button>

        <button
          onClick={() => setCurrentTab('attendance_records')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition ${
            currentTab === 'attendance_records'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>Attendance Records</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: TAKE ATTENDANCE */}
      {/* ========================================================= */}
      {currentTab === 'take_attendance' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-6">Take AI Attendance</h2>

            {loadingSubjects ? (
              <LoadingSpinner text="Loading courses..." />
            ) : subjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-slate-500 mb-3" />
                <h3 className="text-base font-bold text-white">No Subjects Found</h3>
                <p className="mt-1 text-xs text-slate-400">
                  You need to create a subject before taking attendance.
                </p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => setIsCreateModalOpen(true)}
                  icon={PlusCircle}
                >
                  Create Subject
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Select Subject Dropdown + Add Photos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Select Subject
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.subject_id} value={sub.subject_id}>
                          {sub.name} — {sub.subject_code} (Section {sub.section})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Button
                      variant="tertiary"
                      className="w-full"
                      onClick={() => setIsAddPhotosModalOpen(true)}
                      icon={ImageIcon}
                    >
                      <span>Add Photos ({attendancePhotos.length})</span>
                    </Button>
                  </div>
                </div>

                {faceError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{faceError}</span>
                  </div>
                )}

                {/* Display Added Photos Gallery */}
                {attendancePhotos.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Added Classroom Photos ({attendancePhotos.length})
                      </h4>
                      <button
                        onClick={() => setAttendancePhotos([])}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Clear All Photos
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {attendancePhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-md"
                        >
                          <img
                            src={photo.previewUrl}
                            alt={`Classroom ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-1.5 left-1.5 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                            Photo {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attendance Action Triggers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800 pt-6">
                  <Button
                    variant="ghost"
                    disabled={attendancePhotos.length === 0}
                    onClick={() => setAttendancePhotos([])}
                    icon={Trash2}
                  >
                    Clear All Photos
                  </Button>

                  <Button
                    variant="secondary"
                    disabled={attendancePhotos.length === 0}
                    loading={analyzingFaces}
                    onClick={handleRunFaceAnalysis}
                    icon={ScanFace}
                  >
                    Run Face Analysis
                  </Button>

                  <Button
                    variant="primary"
                    disabled={!selectedSubjectId}
                    onClick={() => setIsVoiceModalOpen(true)}
                    icon={Mic}
                  >
                    Use Voice Attendance
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MANAGE SUBJECTS */}
      {/* ========================================================= */}
      {currentTab === 'manage_subjects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Your Teaching Courses</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              icon={PlusCircle}
            >
              Create New Subject
            </Button>
          </div>

          {loadingSubjects ? (
            <LoadingSpinner text="Loading courses..." />
          ) : subjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-white">No Subjects Found</h3>
              <p className="mt-1 text-sm text-slate-400">
                Create your first course to begin recording attendance.
              </p>
              <Button
                variant="primary"
                className="mt-5"
                onClick={() => setIsCreateModalOpen(true)}
                icon={PlusCircle}
              >
                Create Subject
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((sub) => (
                <SubjectCard
                  key={sub.subject_id}
                  subject={sub}
                  isTeacher={true}
                  onShare={(s) => {
                    setSharingSubject(s)
                    setIsShareModalOpen(true)
                  }}
                  onDelete={handleDeleteSubject}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ATTENDANCE RECORDS */}
      {/* ========================================================= */}
      {currentTab === 'attendance_records' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Attendance History &amp; Records</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review previous class attendance sessions and download CSV reports.
              </p>
            </div>

            {records.length > 0 && (
              <Button variant="tertiary" size="sm" onClick={handleExportCSV} icon={Download}>
                Export to CSV
              </Button>
            )}
          </div>

          {loadingRecords ? (
            <LoadingSpinner text="Loading attendance history..." />
          ) : records.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-white">No Attendance Records Yet</h3>
              <p className="mt-1 text-sm text-slate-400">
                Attendance records will appear here after you run and confirm a class session.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Session Date &amp; Time</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Section</th>
                    <th className="py-3.5 px-4 text-center">Attendance Stats</th>
                    <th className="py-3.5 px-4 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {records.map((r, i) => (
                    <tr key={i} className="transition hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {new Date(r.timestamp).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">{r.subject_name}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant="indigo">{r.subject_code}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">Section {r.section}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-emerald-400">{r.present_count}</span>
                        <span className="text-slate-400"> / {r.total_count} Students</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-400">
                        {r.rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => fetchSubjects()}
      />

      <ShareSubjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        subject={sharingSubject}
      />

      <AddPhotosModal
        isOpen={isAddPhotosModalOpen}
        onClose={() => setIsAddPhotosModalOpen(false)}
        photos={attendancePhotos}
        setPhotos={setAttendancePhotos}
      />

      <VoiceAttendanceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        subjectId={parseInt(selectedSubjectId)}
        onAnalysisComplete={handleVoiceAnalysisComplete}
      />

      <AttendanceReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        subjectId={parseInt(selectedSubjectId)}
        candidates={reviewCandidates}
        onConfirmed={handleAttendanceSaved}
      />
    </div>
  )
}

