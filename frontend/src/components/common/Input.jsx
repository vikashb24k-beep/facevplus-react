import React from 'react'

export const Input = ({
  label,
  id,
  type = 'text',
  error,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </label>
      )}
      <div className="relative rounded-xl">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`block w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
    </div>
  )
}

