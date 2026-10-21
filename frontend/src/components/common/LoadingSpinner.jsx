import React from 'react'

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

