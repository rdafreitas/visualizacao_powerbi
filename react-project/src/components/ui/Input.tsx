'use client'

import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold text-gray-mid uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full px-4 py-3 rounded-xl border border-[#E8E8F0]',
          'text-sm font-medium text-gray-dark bg-white',
          'outline-none transition-colors placeholder:text-gray-mid',
          'focus:border-purple focus:ring-2 focus:ring-purple/10',
          error && 'border-red focus:border-red focus:ring-red/10',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red font-medium">{error}</p>
      )}
    </div>
  )
}
