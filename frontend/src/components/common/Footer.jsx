import React from 'react'
import { ShieldCheck, Heart } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 text-center text-sm text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold text-slate-400">FaceVPlus v2.0</span>
          <span className="text-slate-600">— AI Attendance System</span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <span>Engineered with</span>
          <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
          <span>for modern classrooms</span>
        </div>

        <div className="text-xs text-slate-600">
          Biometric face &amp; voice recognition powered by FastAPI &amp; Supabase
        </div>
      </div>
    </footer>
  )
}

