'use client'

import { cn } from '@/lib/utils'
import type { MatriculaStatus } from '@/types/app'

type BadgeVariant =
  | 'ativo'
  | 'inadimplente'
  | 'trial'
  | 'inativo'
  | 'proprietario'
  | 'funcionario'
  | 'professor'
  | 'aluno'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  ativo:         'bg-green/15 text-green-dk',
  inadimplente:  'bg-red/15 text-red',
  trial:         'bg-gold/25 text-gold-dk',
  inativo:       'bg-gray-bg text-gray-mid',
  proprietario:  'bg-gold/20 text-gold-dk',
  funcionario:   'bg-gray-100 text-gray-600',
  professor:     'bg-green/20 text-green-dk',
  aluno:         'bg-orange/15 text-orange-dk',
}

interface BadgeProps {
  variant:   BadgeVariant
  children:  React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: MatriculaStatus }) {
  const labels: Record<MatriculaStatus, string> = {
    ativo:        '🟢 Ativo',
    inadimplente: '🔴 Inadimplente',
    trial:        '🟡 Trial',
    inativo:      '⚪ Inativo',
  }
  return <Badge variant={status}>{labels[status]}</Badge>
}
