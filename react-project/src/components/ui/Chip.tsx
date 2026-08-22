'use client'

import { cn } from '@/lib/utils'

interface ChipProps {
  label:    string
  active?:  boolean
  onClick?: () => void
  variant?: 'default' | 'gold'
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
          'bg-white border-[#E8E8F0] text-gray-mid hover:border-purple hover:text-purple',
        active && variant === 'default' &&
          'bg-purple border-purple text-white',
        active && variant === 'gold' &&
          'bg-gold border-gold-dk text-[#3D2E00]'
      )}
    >
      {label}
    </button>
  )
}
