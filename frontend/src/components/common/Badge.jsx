import React from 'react'

export const Badge = ({ children, variant = 'indigo', className = '' }) => {
  const variants = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide ${
        variants[variant] || variants.indigo
      } ${className}`}
    >
      {children}
    </span>
  )
}

export const LoadingSpinner = ({ size = 'md', text = null }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div
        className={`${sizes[size] || sizes.md} animate-spin rounded-full border-2 border-indigo-500 border-t-transparent`}
      />
      {text && <p className="text-sm text-slate-400 animate-pulse font-medium">{text}</p>}
    </div>
  )
}

