import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react'
import { subjectService } from '../../services/subjectService'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Badge } from '../../components/common/Badge'
import '../../styles/teacher/attendance-register.css'

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
  if (error && !register) return <p className="attendance-register__error ui-notice ui-notice--error">{error}</p>

  const subject = register?.subject
  return (
    <div className="attendance-register">
      <Link to="/teacher/dashboard" className="attendance-register__back">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      <div className="attendance-register__header">
        <div>
          <p className="attendance-register__eyebrow">Subject attendance register</p>
          <h1>{subject?.name}</h1>
          <p className="attendance-register__meta">{subject?.subject_code} {subject?.section ? `• Section ${subject.section}` : ''}</p>
        </div>
        <div className="attendance-register__count">
          <strong>{register?.total ?? 0}</strong> matching enrolled students
        </div>
      </div>

      <div className="attendance-register__filters">
        <h2>Find students</h2>
        <div className="attendance-register__filter-grid">
          <label className="attendance-register__search-wrap">
            <Search size={16} />
            <input value={search} onChange={updateFilter(setSearch)} placeholder="Search student name or ID" className="attendance-register__search" aria-label="Search student name or ID" />
          </label>
          <select aria-label="Attendance session" value={sessionTimestamp} onChange={updateFilter(setSessionTimestamp)}>
            <option value="">Latest session ({displayDate(register?.selected_session)})</option>
            {(register?.sessions || []).map((timestamp) => <option key={timestamp} value={timestamp}>{displayDate(timestamp)}</option>)}
          </select>
          <select aria-label="Session attendance status" value={attendanceStatus} onChange={updateFilter(setAttendanceStatus)}>
            <option value="all">All session statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
          <div className="attendance-register__sort">
            <select aria-label="Sort students" value={sortBy} onChange={updateFilter(setSortBy)}>
              <option value="name">Name</option>
              <option value="attendance_percentage">Attendance %</option>
              <option value="attendance_count">Classes attended</option>
            </select>
            <button className="plain-button plain-button--secondary" type="button" onClick={() => { setSortDirection((value) => value === 'asc' ? 'desc' : 'asc'); setPage(1) }} title="Reverse sort order" aria-label="Reverse sort order">{sortDirection === 'asc' ? '↑' : '↓'}</button>
          </div>
        </div>
        <p className="attendance-register__schema-note">Only present and absent are available for this subject.</p>
      </div>

      {error && <p className="attendance-register__error ui-notice ui-notice--error">{error}</p>}
      {loading ? <LoadingSpinner text="Updating register..." /> : (
        <div className="attendance-register__table" role="region" aria-label="Student attendance register" tabIndex="0">
          <table>
            <thead>
              <tr>{['Student', 'Student ID', 'Enrollment', 'Classes', 'Attended', 'Absent', 'Attendance', 'Last attendance', 'Selected session'].map((label) => <th key={label}>{label}</th>)}</tr>
            </thead>
            <tbody>
              {(register?.students || []).map((student) => (
                <tr key={student.student_id}>
                  <td><Link to={`/teacher/subjects/${subjectId}/students/${student.student_id}`} className="attendance-register__student-link">{student.name}</Link></td>
                  <td className="attendance-register__id">{student.student_id}</td>
                  <td><Badge variant="emerald">{student.enrollment_status}</Badge></td>
                  <td>{student.total_classes}</td>
                  <td className="attendance-register__present">{student.attended_classes}</td>
                  <td className="attendance-register__absent">{student.absent_classes}</td>
                  <td className="attendance-register__rate">{student.attendance_percentage}%</td>
                  <td>{displayDate(student.last_attendance_date)}</td>
                  <td><Badge variant={student.current_attendance_status === 'Present' ? 'emerald' : student.current_attendance_status === 'Absent' ? 'red' : 'slate'}>{student.current_attendance_status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(register?.students || []).length === 0 && <div className="attendance-register__empty"><Users size={32} /> <p>No enrolled students match these filters.</p></div>}
        </div>
      )}

      <div className="attendance-register__pagination">
        <span>Page {register?.page || 1} of {register?.total_pages || 1}</span>
        <div className="attendance-register__pagination-actions">
          <button className="plain-button plain-button--secondary" type="button" disabled={(register?.page || 1) <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /> Previous</button>
          <button className="plain-button plain-button--secondary" type="button" disabled={(register?.page || 1) >= (register?.total_pages || 1) || loading} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  )
}
