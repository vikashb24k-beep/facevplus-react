import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { attendanceService } from '../../services/attendanceService'
import { Check, X, Save, AlertCircle } from 'lucide-react'

export const AttendanceReviewModal = ({
  isOpen,
  onClose,
  subjectId,
  candidates = [],
  onConfirmed,
}) => {
  const [reviewList, setReviewList] = useState(candidates)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sync if candidates prop changes
  React.useEffect(() => {
    setReviewList(candidates)
  }, [candidates])

  const toggleStatus = (studentId) => {
    setReviewList((prev) =>
      prev.map((c) => {
        if (c.student_id === studentId) {
          const newPresent = !c.is_present
          return {
            ...c,
            is_present: newPresent,
            status: newPresent ? 'Present' : 'Absent',
          }
        }
        return c
      })
    )
  }

  const markAll = (status) => {
    setReviewList((prev) =>
      prev.map((c) => ({
        ...c,
        is_present: status,
        status: status ? 'Present' : 'Absent',
      }))
    )
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const logs = reviewList.map((c) => ({
        student_id: c.student_id,
        is_present: c.is_present,
      }))
      const res = await attendanceService.confirmAttendanceSession(subjectId, logs)
      onConfirmed(res)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save attendance.')
    } finally {
      setLoading(false)
    }
  }

  const presentCount = reviewList.filter((c) => c.is_present).length
  const totalCount = reviewList.length
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review & Confirm Attendance"
      subtitle="Click on any status pill to toggle Present / Absent before saving"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              Detected: <span className="text-emerald-400">{presentCount}</span> / {totalCount} Students
            </span>
            <Badge variant={percentage >= 75 ? 'emerald' : percentage >= 50 ? 'amber' : 'red'}>
              {percentage}% Present
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => markAll(true)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Attendance Candidates Table */}
        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Detection Source</th>
                <th className="py-3 px-4 text-right">Status (Click to Toggle)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
              {reviewList.map((student) => (
                <tr
                  key={student.student_id}
                  className="transition hover:bg-slate-800/40 cursor-pointer"
                  onClick={() => toggleStatus(student.student_id)}
                >
                  <td className="py-3 px-4 font-medium text-white">{student.name}</td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-400">#{student.student_id}</td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    {student.source || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStatus(student.student_id)
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                        student.is_present
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                      }`}
                    >
                      {student.is_present ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Present</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5" />
                          <span>Absent</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Discard
          </Button>
          <Button variant="primary" onClick={handleConfirm} loading={loading} icon={Save}>
            Confirm &amp; Save Attendance
          </Button>
        </div>
      </div>
    </Modal>
  )
}

