'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_DISPLAY } from '@/lib/permissions'
import { iniciais, avatarColorByName } from '@/lib/utils'
import type { UserProfile } from '@/types/app'

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

  return (
    <header className="h-16 bg-white border-b border-black/[0.07] flex items-center gap-5 px-8 sticky top-0 z-[100] shadow-sm flex-shrink-0">
      {/* Logo */}
      <a
        href="#"
        className="flex items-center gap-2.5 no-underline flex-shrink-0"
      >
        <span className="text-2xl">🎪</span>
        <span className="font-poppins text-lg font-extrabold text-purple tracking-tight">
          PaVoar
        </span>
      </a>

      {/* Badge de role */}
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${display.colorClass}`}>
        {display.icon} {display.label}
      </span>

      <div className="flex-1" />

      {/* Usuário + Sair */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-poppins text-sm font-extrabold text-white flex-shrink-0"
          style={{ background: avatarColorByName(user.nome) }}
          aria-label={`Avatar de ${user.nome}`}
        >
          {iniciais(user.nome)}
        </div>

        {/* Nome e email */}
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-gray-dark leading-none">
            {user.nome}
          </p>
          <p className="text-[11px] text-gray-mid mt-0.5">{user.email}</p>
        </div>

        {/* Botão Sair */}
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 text-xs font-semibold text-red border border-[#E8E8F0] rounded-xl hover:bg-red/5 hover:border-red transition-colors ml-1"
        >
          Sair
        </button>
      </div>
    </header>
  )
}
