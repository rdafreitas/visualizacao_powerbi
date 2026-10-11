'use client'

// ─────────────────────────────────────────────────────────────
// Topbar — versão FRONT-END ESTÁTICO
// Recebe role como prop de cada layout — sem Supabase.
// Quando o back-end for integrado:
//   1. Adicionar user: UserProfile à interface TopbarProps
//   2. Substituir DEMO_USER por user
//   3. Restaurar handleLogout com Supabase
// ─────────────────────────────────────────────────────────────

import { iniciais } from '@/lib/utils'

type Role = 'admin' | 'professor' | 'aluno'

interface TopbarProps {
  role: Role
}

// Dados demo do usuário — substituir por getProfile() no backend
const DEMO_USER = {
  nome:  "Renan D'Alexandro",
  email: 'renan@andorin.com.br',
}

const TOPBAR_GRADIENT: Record<Role, string> = {
  admin:     'linear-gradient(90deg, #c45e00, #f27406)',
  professor: 'linear-gradient(90deg, #211D1C, #3a3330)',
  aluno:     'linear-gradient(90deg, #5a1520, #7A1D2C)',
}

const TOPBAR_SHADOW: Record<Role, string> = {
  admin:     '0 2px 16px rgba(242,116,6,.3)',
  professor: '0 2px 16px rgba(33,29,28,.35)',
  aluno:     '0 2px 16px rgba(122,29,44,.35)',
}

const ROLE_LABEL: Record<Role, string> = {
  admin:     '🏠 Administrador',
  professor: '🎓 Professor',
  aluno:     '🎪 Aluno',
}

export function Topbar({ role }: TopbarProps) {
  const gradient = TOPBAR_GRADIENT[role]
  const shadow   = TOPBAR_SHADOW[role]
  const label    = ROLE_LABEL[role]

  return (
    <header
      className="h-16 flex items-center gap-5 px-8 flex-shrink-0 z-[100]"
      style={{ background: gradient, boxShadow: shadow }}
    >
      {/* Logo */}
      <a href="#" className="flex items-center gap-2.5 no-underline flex-shrink-0">
        <span className="text-2xl">🎪</span>
        <span
          className="text-xl text-off-white tracking-wide"
          style={{ fontFamily: 'var(--font-shadows)', fontWeight: 400 }}
        >
          Estúdio Andorin
        </span>
      </a>

      {/* Badge de role */}
      <span
        className="px-3 py-1 rounded-full text-xs font-bold flex-shrink-0"
        style={{ background: 'rgba(255,255,255,.18)', color: '#F4E7CE' }}
      >
        {label}
      </span>

      <div className="flex-1" />

      {/* Usuário + Sair */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0"
          style={{ background: 'rgba(255,255,255,.22)', color: '#F4E7CE' }}
          aria-label={`Avatar de ${DEMO_USER.nome}`}
        >
          {iniciais(DEMO_USER.nome)}
        </div>

        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none" style={{ color: '#F4E7CE' }}>
            {DEMO_USER.nome}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(244,231,206,.65)' }}>
            {DEMO_USER.email}
          </p>
        </div>

        <button
          className="px-4 py-1.5 text-xs font-semibold rounded-xl ml-1 transition-all"
          style={{
            border:     '1.5px solid rgba(255,255,255,.25)',
            color:      'rgba(244,231,206,.85)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.12)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          Sair
        </button>
      </div>
    </header>
  )
}
