import React from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  School,
  ScanFace,
  Mic,
  ShieldCheck,
  QrCode,
  BarChart3,
  ArrowRight,
} from 'lucide-react'

export const HomePage = () => {
  return (
    <div className="flex flex-col gap-16 py-8 sm:py-16">
      {/* Hero Section */}
      <section className="text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-6">
          <ScanFace className="h-4 w-4" />
          <span>Next-Generation Multi-Modal Attendance</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-tight">
          Smart Attendance Powered by{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            Face &amp; Voice AI
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          FaceVPlus eliminates tedious roll calls. Capture classroom photos or audio and let our AI
          recognize enrolled students instantly with enterprise-grade accuracy.
        </p>
      </section>

      {/* Portal Selection Cards */}
      <section className="max-w-5xl mx-auto px-4 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Student Portal Card */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/40 transition-all hover:-translate-y-1.5 hover:border-indigo-500/50 hover:shadow-indigo-500/10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 shadow-inner">
              <GraduationCap className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">Student Portal</h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Login seamlessly using Face-ID. Enroll in courses using subject codes or QR links,
              and track your live attendance percentage across all classes.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>Instant Face-ID login with camera</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>View enrolled subjects and attendance rates</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>One-tap QR code auto-enrollment</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <Link
              to="/student/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
            >
              <span>Enter Student Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Teacher Portal Card */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/40 transition-all hover:-translate-y-1.5 hover:border-pink-500/50 hover:shadow-pink-500/10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-pink-600/10 blur-3xl pointer-events-none" />

          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mb-6 shadow-inner">
              <School className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">Teacher Portal</h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Create subjects, generate enrollment QR codes, upload classroom photos for batch
              face recognition, or analyze audio roll calls with one click.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                <span>Batch face recognition from classroom photos</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                <span>Acoustic voiceprint speaker matching</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                <span>Editable review before saving to database</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <Link
              to="/teacher/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 py-3 text-sm font-semibold text-white shadow-md shadow-pink-600/30 transition hover:bg-pink-500"
            >
              <span>Enter Teacher Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <h3 className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
          Enterprise Multi-Modal Features
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <ScanFace className="h-6 w-6 text-indigo-400 mb-3" />
            <h4 className="text-sm font-bold text-white">Dlib 128D Descriptors</h4>
            <p className="mt-1 text-xs text-slate-400">
              Accurate facial feature vectors with pose detection and invariance.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <Mic className="h-6 w-6 text-pink-400 mb-3" />
            <h4 className="text-sm font-bold text-white">Voice Biometrics</h4>
            <p className="mt-1 text-xs text-slate-400">
              Resemblyzer deep voiceprints with automatic silence segmentation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <QrCode className="h-6 w-6 text-violet-400 mb-3" />
            <h4 className="text-sm font-bold text-white">Dynamic QR Enrollment</h4>
            <p className="mt-1 text-xs text-slate-400">
              Auto-join codes with camera scan and deep-link integration.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <BarChart3 className="h-6 w-6 text-emerald-400 mb-3" />
            <h4 className="text-sm font-bold text-white">Interactive Review</h4>
            <p className="mt-1 text-xs text-slate-400">
              Audit and adjust presence before committing records to Supabase.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

