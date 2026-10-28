'use client'

import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'outline' | 'danger' | 'secondary'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Texto do tooltip nativo (title) e do aria-label.
  // title nativo, e não um tooltip em CSS, porque o container da Table
  // usa overflow-hidden e cortaria um tooltip posicionado.
  label:    string
  variant?: Variant
}

const VARIANT_CLASSES: Record<Variant, string> = {
  outline:   'bg-white text-bordo border border-bordo/20 hover:border-bordo hover:bg-bordo/5',
  danger:    'bg-red/10 text-red hover:bg-red hover:text-white border border-red/20',
  secondary: 'bg-gray-bg text-gray-dark hover:bg-white border border-gray-mid/30',
}

export function IconButton({
  label,
  variant = 'outline',
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
