'use client'

// ─────────────────────────────────────────────────────────────
// Topbar — versão FRONT-END ESTÁTICO (sem Supabase / sem props)
// Dados de demonstração hardcoded para validação visual.
// Quando o back-end for integrado:
//   1. Descomentar a interface TopbarProps
//   2. Adicionar { user }: TopbarProps como parâmetro
//   3. Substituir DEMO_USER por user
//   4. Restaurar handleLogout com Supabase
// ─────────────────────────────────────────────────────────────

import { iniciais } from '@/lib/utils'

// ── Dados de demonstração ─────────────────────────────────────
const DEMO_USER = {
  nome:  "Renan D'Alexandro",
  email: 'renan@andorin.com.br',
  role:  'admin', // troque para 'professor' ou 'aluno' para ver os outros visuais
}

// ── Gradientes e sombras por role ────────────────────────────
const TOPBAR_GRADIENT: Record<string, string> = {
  admin:     'linear-gradient(90deg, #c45e00, #f27406)',
  professor: 'linear-gradient(90deg, #211D1C, #3a3330)',
  aluno:     'linear-gradient(90deg, #5a1520, #7A1D2C)',
}

const TOPBAR_SHADOW: Record<string, string> = {
  admin:     '0 2px 16px rgba(242,116,6,.3)',
  professor: '0 2px 16px rgba(33,29,28,.35)',
  aluno:     '0 2px 16px rgba(122,29,44,.35)',
}

const ROLE_LABEL: Record<string, string> = {
  admin:     '🏠 Administrador',
  professor: '🎓 Professor',
  aluno:     '🎪 Aluno',
}

export function Topbar() {
  const user     = DEMO_USER
  const gradient = TOPBAR_GRADIENT[user.role] ?? TOPBAR_GRADIENT.admin
  const shadow   = TOPBAR_SHADOW[user.role]   ?? TOPBAR_SHADOW.admin
  const label    = ROLE_LABEL[user.role]       ?? ''

  return (
    <header
      className="h-16 flex items-center gap-5 px-8 sticky top-0 z-[100] flex-shrink-0"
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

        {/* Avatar com iniciais */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0"
          style={{ background: 'rgba(255,255,255,.22)', color: '#F4E7CE' }}
          aria-label={`Avatar de ${user.nome}`}
        >
          {iniciais(user.nome)}
        </div>

        {/* Nome e e-mail */}
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none" style={{ color: '#F4E7CE' }}>
            {user.nome}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(244,231,206,.65)' }}>
            {user.email}
          </p>
        </div>

        {/* Botão Sair — sem ação por enquanto */}
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
