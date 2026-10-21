import React from 'react'

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 focus:ring-indigo-500 border border-transparent',
    secondary:
      'bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/25 focus:ring-pink-500 border border-transparent',
    tertiary:
      'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500',
    outline:
      'bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700 focus:ring-slate-500',
    danger:
      'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 focus:ring-red-500 border border-transparent',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5 font-semibold',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  )
}

