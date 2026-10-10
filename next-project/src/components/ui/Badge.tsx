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
  ativo:        'bg-green-light/40 text-chumbo',
  inadimplente: 'bg-red/15 text-red',
  trial:        'bg-orange/20 text-orange-dk',
  inativo:      'bg-gray-bg text-gray-mid',
  proprietario: 'bg-orange/20 text-orange-dk',
  funcionario:  'bg-blue-light/30 text-chumbo',
  professor:    'bg-green-light/30 text-chumbo',
  aluno:        'bg-bordo/10 text-bordo',
}

interface BadgeProps {
  variant:    BadgeVariant
  children:   React.ReactNode
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
