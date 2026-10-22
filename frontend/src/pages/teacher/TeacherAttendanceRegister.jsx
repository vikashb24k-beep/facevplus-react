import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react'
import { subjectService } from '../../services/subjectService'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Badge } from '../../components/common/Badge'

const PAGE_SIZE = 25

const displayDate = (timestamp) => timestamp
  ? new Date(timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  : 'No attendance yet'

export const TeacherAttendanceRegister = () => {
  const { subjectId } = useParams()
  const [register, setRegister] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [attendanceStatus, setAttendanceStatus] = useState('all')
  const [sessionTimestamp, setSessionTimestamp] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const request = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await subjectService.getAttendanceRegister(subjectId, {
          search,
          sort_by: sortBy,
          sort_direction: sortDirection,
          attendance_status: attendanceStatus,
          session_timestamp: sessionTimestamp || undefined,
          page,
          page_size: PAGE_SIZE,
        })
        setRegister(data)
      } catch (requestError) {
        setError(requestError.response?.data?.detail || 'Unable to load the attendance register.')
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => window.clearTimeout(request)
  }, [subjectId, search, sortBy, sortDirection, attendanceStatus, sessionTimestamp, page])

  const updateFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  if (loading && !register) return <LoadingSpinner text="Loading attendance register..." />
  if (error && !register) return <p className="py-10 text-center text-red-400">{error}</p>

  const subject = register?.subject
  return (
    <div className="space-y-6 py-6">
      <Link to="/teacher/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Subject attendance register</p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">{subject?.name}</h1>
          <p className="mt-1 text-sm text-slate-400">{subject?.subject_code} {subject?.section ? `• Section ${subject.section}` : ''}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
          <span className="font-bold text-white">{register?.total ?? 0}</span> matching enrolled students
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="grid gap-3 lg:grid-cols-5">
          <label className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input value={search} onChange={updateFilter(setSearch)} placeholder="Search student name or ID" className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-indigo-500" />
          </label>
          <select value={sessionTimestamp} onChange={updateFilter(setSessionTimestamp)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white">
            <option value="">Latest session ({displayDate(register?.selected_session)})</option>
            {(register?.sessions || []).map((timestamp) => <option key={timestamp} value={timestamp}>{displayDate(timestamp)}</option>)}
          </select>
          <select value={attendanceStatus} onChange={updateFilter(setAttendanceStatus)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white">
            <option value="all">All session statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
          <div className="flex gap-2">
            <select value={sortBy} onChange={updateFilter(setSortBy)} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white">
              <option value="name">Name</option>
              <option value="attendance_percentage">Attendance %</option>
              <option value="attendance_count">Classes attended</option>
            </select>
            <button onClick={() => { setSortDirection((value) => value === 'asc' ? 'desc' : 'asc'); setPage(1) }} className="rounded-xl border border-slate-700 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-800" title="Reverse sort order">{sortDirection === 'asc' ? '↑' : '↓'}</button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">This schema records only present or absent. Late and other attendance statuses are not available.</p>
      </div>

      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {loading ? <LoadingSpinner text="Updating register..." /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950 text-xs uppercase tracking-wider text-slate-400">
              <tr>{['Student', 'Student ID', 'Enrollment', 'Classes', 'Attended', 'Absent', 'Attendance', 'Last attendance', 'Selected session'].map((label) => <th key={label} className="px-4 py-3.5 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {(register?.students || []).map((student) => (
                <tr key={student.student_id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3.5"><Link to={`/teacher/subjects/${subjectId}/students/${student.student_id}`} className="font-semibold text-white hover:text-indigo-300">{student.name}</Link></td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{student.student_id}</td>
                  <td className="px-4 py-3.5"><Badge variant="emerald">{student.enrollment_status}</Badge></td>
                  <td className="px-4 py-3.5 text-slate-300">{student.total_classes}</td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-400">{student.attended_classes}</td>
                  <td className="px-4 py-3.5 font-semibold text-red-400">{student.absent_classes}</td>
                  <td className="px-4 py-3.5 font-bold text-indigo-300">{student.attendance_percentage}%</td>
                  <td className="px-4 py-3.5 text-slate-300">{displayDate(student.last_attendance_date)}</td>
                  <td className="px-4 py-3.5"><Badge variant={student.current_attendance_status === 'Present' ? 'emerald' : student.current_attendance_status === 'Absent' ? 'red' : 'slate'}>{student.current_attendance_status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(register?.students || []).length === 0 && <div className="p-12 text-center text-slate-400"><Users className="mx-auto mb-3 h-8 w-8" />No enrolled students match these filters.</div>}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Page {register?.page || 1} of {register?.total_pages || 1}</span>
        <div className="flex gap-2">
          <button disabled={(register?.page || 1) <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Previous</button>
          <button disabled={(register?.page || 1) >= (register?.total_pages || 1) || loading} onClick={() => setPage((value) => value + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  )
}
