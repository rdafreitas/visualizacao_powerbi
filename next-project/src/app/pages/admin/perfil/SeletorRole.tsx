'use client'

import type { Role } from '@/types/app'

export const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'aluno',        label: '🤸 Aluno',        desc: 'Acessa agenda e seu perfil'  },
  { value: 'professor',    label: '🎭 Professor',    desc: 'Gerencia turmas e treinos'   },
  { value: 'funcionario',  label: '🏢 Funcionário',  desc: 'Acesso admin sem financeiro' },
  { value: 'proprietario', label: '👑 Proprietário', desc: 'Acesso total ao sistema'     },
]

interface Props {
  value:     Role
  onChange:  (role: Role) => void
  disabled?: boolean
}

export function SeletorRole({ value, onChange, disabled }: Props) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
        Tipo de acesso
      </p>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            disabled={disabled}
            className={[
              'flex flex-col gap-0.5 p-3 rounded-xl border text-left transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              value === r.value
                ? 'border-bordo bg-bordo/5 text-bordo'
                : 'border-black/[0.06] hover:border-bordo/40 text-gray-dark',
            ].join(' ')}
          >
            <span className="text-sm font-semibold">{r.label}</span>
            <span className="text-[11px] text-gray-mid">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
