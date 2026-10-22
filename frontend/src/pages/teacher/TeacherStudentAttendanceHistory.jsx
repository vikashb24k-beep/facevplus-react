import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { subjectService } from '../../services/subjectService'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Badge } from '../../components/common/Badge'

export const TeacherStudentAttendanceHistory = () => {
  const { subjectId, studentId } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    subjectService.getStudentAttendanceHistory(subjectId, studentId)
      .then(setData)
      .catch((requestError) => setError(requestError.response?.data?.detail || 'Unable to load student attendance history.'))
  }, [subjectId, studentId])

  if (error) return <p className="py-10 text-center text-red-400">{error}</p>
  if (!data) return <LoadingSpinner text="Loading student attendance history..." />
  const displayDate = (timestamp) => new Date(timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  return (
    <div className="space-y-6 py-6">
      <Link to={`/teacher/subjects/${subjectId}/register`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to register</Link>
      <div className="border-b border-slate-800 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Student attendance history</p>
        <h1 className="mt-1 text-2xl font-extrabold text-white">{data.student.name}</h1>
        <p className="mt-1 text-sm text-slate-400">Student ID: {data.student.student_id} • {data.subject.name} ({data.subject.subject_code})</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[['Total classes', data.summary.total_classes, 'text-white'], ['Attended', data.summary.attended_classes, 'text-emerald-400'], ['Absent', data.summary.absent_classes, 'text-red-400'], ['Attendance', `${data.summary.attendance_percentage}%`, 'text-indigo-300']].map(([label, value, color]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p></div>)}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
        <table className="w-full text-left text-sm"><thead className="border-b border-slate-800 bg-slate-950 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3.5">Session date</th><th className="px-4 py-3.5">Attendance status</th></tr></thead><tbody className="divide-y divide-slate-800/70">{data.history.map((entry) => <tr key={entry.timestamp}><td className="px-4 py-3.5 text-slate-200">{displayDate(entry.timestamp)}</td><td className="px-4 py-3.5"><Badge variant={entry.status === 'Present' ? 'emerald' : entry.status === 'Absent' ? 'red' : 'slate'}>{entry.status}</Badge></td></tr>)}</tbody></table>
        {data.history.length === 0 && <p className="p-10 text-center text-slate-400">No sessions have been recorded for this subject.</p>}
      </div>
    </div>
  )
}
