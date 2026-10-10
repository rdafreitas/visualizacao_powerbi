'use client'

import { cn } from '@/lib/utils'

interface ChipProps {
  label:     string
  active?:   boolean
  onClick?:  () => void
  variant?:  'default' | 'orange'
  disabled?: boolean
}

export function Chip({
  label,
  active,
  onClick,
  variant = 'default',
  disabled,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-1.5 rounded-full text-xs font-bold border transition-all',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        !active &&
          'bg-white border-gray-bg text-gray-mid hover:border-bordo hover:text-bordo',
        active && variant === 'default' &&
          'bg-bordo border-bordo text-off-white',
        active && variant === 'orange' &&
          'bg-orange border-orange-dk text-off-white'
      )}
    >
      {label}
    </button>
  )
}
