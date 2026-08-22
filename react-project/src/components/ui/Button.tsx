'use client'

import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  loading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   'bg-purple text-white hover:bg-purple-light shadow-sm hover:shadow-md',
  secondary: 'bg-gray-bg text-gray-dark hover:bg-white border border-gray-mid/30',
  danger:    'bg-red/10 text-red hover:bg-red hover:text-white border border-red/20',
  ghost:     'bg-transparent text-gray-dark hover:bg-gray-bg',
  outline:   'bg-white text-purple border border-purple/20 hover:border-purple hover:bg-purple/5',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 rounded-xl',
  lg: 'text-sm px-5 py-3.5 rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 cursor-pointer select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  )
}
