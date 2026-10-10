'use client'

// ─────────────────────────────────────────────────────────────
// src/components/layout/Topbar.tsx
// Topbar com identidade visual por role:
//   Admin     → brand-orange  (fundo laranja gradiente)
//   Professor → brand-chumbo  (fundo chumbo gradiente)
//   Aluno     → brand-bordo   (fundo bordô gradiente)
// Logotipo com Shadows Into Light Two.
// ─────────────────────────────────────────────────────────────

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_DISPLAY } from '@/lib/permissions'
import { iniciais, avatarColorByName } from '@/lib/utils'
import type { UserProfile } from '@/types/app'

// Gradientes de topbar por role
const TOPBAR_GRADIENT: Record<string, string> = {
  proprietario: 'linear-gradient(90deg, #c45e00, #f27406)',
  funcionario:  'linear-gradient(90deg, #c45e00, #f27406)',
  professor:    'linear-gradient(90deg, #211D1C, #3a3330)',
  aluno:        'linear-gradient(90deg, #5a1520, #7A1D2C)',
}

const TOPBAR_SHADOW: Record<string, string> = {
  proprietario: '0 2px 16px rgba(242,116,6,.3)',
  funcionario:  '0 2px 16px rgba(242,116,6,.3)',
  professor:    '0 2px 16px rgba(33,29,28,.35)',
  aluno:        '0 2px 16px rgba(122,29,44,.35)',
}

interface TopbarProps {
  user: UserProfile
}

export function Topbar({ user }: TopbarProps) {
  const router   = useRouter()
  const supabase = createClient()
  const display  = ROLE_DISPLAY[user.role]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/pages/login')
    router.refresh()
  }

  const gradient = TOPBAR_GRADIENT[user.role] ?? 'linear-gradient(90deg, #7A1D2C, #5a1520)'
  const shadow   = TOPBAR_SHADOW[user.role]   ?? 'none'

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
          PaVoar
        </span>
      </a>

      {/* Badge de role */}
      <span
        className="px-3 py-1 rounded-full text-xs font-bold flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,.18)',
          color:      '#F4E7CE',
        }}
      >
        {display.icon} {display.label}
      </span>

      <div className="flex-1" />

      {/* Usuário + Sair */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,.22)',
            color:      '#F4E7CE',
            fontFamily: 'var(--font-montserrat)',
          }}
          aria-label={`Avatar de ${user.nome}`}
        >
          {iniciais(user.nome)}
        </div>

        {/* Nome e email */}
        <div className="hidden sm:block">
          <p
            className="text-sm font-semibold leading-none"
            style={{ color: '#F4E7CE' }}
          >
            {user.nome}
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: 'rgba(244,231,206,.65)' }}
          >
            {user.email}
          </p>
        </div>

        {/* Botão Sair */}
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 text-xs font-semibold rounded-xl ml-1 transition-all"
          style={{
            border:  '1.5px solid rgba(255,255,255,.25)',
            color:   'rgba(244,231,206,.85)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.12)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#F4E7CE'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(244,231,206,.85)'
          }}
        >
          Sair
        </button>
      </div>
    </header>
  )
}
