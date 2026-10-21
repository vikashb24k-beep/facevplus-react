import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheck, LogOut, User, GraduationCap, School } from 'lucide-react'

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">FaceVPlus</span>
            <span className="hidden text-xs text-indigo-400 sm:inline-block sm:ml-2 font-medium">AI Attendance</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-300">
                {user?.role === 'teacher' ? (
                  <School className="h-4 w-4 text-violet-400" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-emerald-400" />
                )}
                <span className="font-medium text-white">{user?.name}</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                  {user?.role}
                </span>
              </div>

              <Link
                to={user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'}
                className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white sm:inline-block"
              >
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/student/login"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                <GraduationCap className="h-4 w-4 text-emerald-400" />
                <span>Student</span>
              </Link>
              <Link
                to="/teacher/login"
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-500"
              >
                <School className="h-4 w-4" />
                <span>Teacher</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

