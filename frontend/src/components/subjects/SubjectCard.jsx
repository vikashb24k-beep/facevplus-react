import React from 'react'
import { Users, Clock, Share2, Trash2, BookOpen, Calendar, CheckCircle, ClipboardList } from 'lucide-react'
import { Badge } from '../common/Badge'

export const SubjectCard = ({
  subject,
  isTeacher = false,
  onShare,
  onDelete,
  onOpenRegister,
  onUnenroll,
}) => {
  const { name, subject_code, section, total_students, total_classes, attended_classes, attendance_rate } =
    subject

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg shadow-black/30 transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-indigo-950/20">
      {/* Accent left border bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-pink-500" />

      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
              {name}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="indigo">{subject_code}</Badge>
              {section && <span className="text-xs text-slate-400">Section {section}</span>}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2 text-indigo-400">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        {/* Stats Pills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {isTeacher ? (
            <>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
                <Users className="h-3.5 w-3.5 text-pink-400" />
                <span className="font-bold text-white">{total_students ?? 0}</span>
                <span className="text-slate-400">Students</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-bold text-white">{total_classes ?? 0}</span>
                <span className="text-slate-400">Classes</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-bold text-white">{total_classes ?? 0}</span>
                <span className="text-slate-400">Total</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-bold text-white">{attended_classes ?? 0}</span>
                <span className="text-slate-400">Attended</span>
              </div>
              {total_classes > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
                  <span className="font-bold">{attendance_rate}%</span>
                  <span className="text-indigo-400">Rate</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-4">
        {isTeacher ? (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenRegister && (
                <button
                  onClick={() => onOpenRegister(subject)}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span>Open Register</span>
                </button>
              )}
              <button
                onClick={() => onShare(subject)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Share Code: {subject_code}</span>
              </button>
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(subject.subject_id)}
                className="rounded-xl p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                title="Delete Subject"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex w-full items-center justify-end">
            <button
              onClick={() => onUnenroll(subject.subject_id, subject.name)}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Unenroll</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

