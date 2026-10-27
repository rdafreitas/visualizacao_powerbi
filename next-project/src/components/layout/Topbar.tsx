'use client'
// ─────────────────────────────────────────────────────────────
// src/components/layout/Topbar.tsx
//
// Topbar integrada com autenticação real.
//
// POR QUE CLIENT COMPONENT SE OS DADOS VÊM DO SERVIDOR?
//   Os dados (nome, email) chegam como props dos layouts —
//   que são Server Components e chamam requireAuth().
//   A Topbar precisa ser Client Component por uma razão:
//   o useTransition() do React, necessário para o logout.
//   Server Components não podem usar hooks do React.
//
// PADRÃO USADO: Server Component passa dados → Client Component usa
//   AdminLayout (async Server Component)
//     └── chama requireAuth() → obtém profile real
//     └── passa nome e email como props para Topbar
//         └── Topbar (Client Component) exibe dados reais
//             └── handleLogout chama Server Action de logout
//
// POR QUE useTransition() PARA O LOGOUT?
//   startTransition marca a operação como pendente (isPending).
//   Isso permite desabilitar o botão e mostrar "Saindo…"
//   durante a execução da Server Action no servidor,
//   sem travar a interface do browser.
// ─────────────────────────────────────────────────────────────

import { useTransition } from 'react'
import { iniciais }      from '@/lib/utils'
import { logout }        from '@/(auth)/actions/logout'

type TopbarRole = 'admin' | 'professor' | 'aluno'

interface TopbarProps {
  role:  TopbarRole
  nome:  string     // nome real do usuário — vem do requireAuth() no layout
  email: string     // email real do usuário — vem do requireAuth() no layout
}

const TOPBAR_GRADIENT: Record<TopbarRole, string> = {
  admin:     'linear-gradient(90deg, #c45e00, #f27406)',
  professor: 'linear-gradient(90deg, #211D1C, #3a3330)',
  aluno:     'linear-gradient(90deg, #5a1520, #7A1D2C)',
}

const TOPBAR_SHADOW: Record<TopbarRole, string> = {
  admin:     '0 2px 16px rgba(242,116,6,.3)',
  professor: '0 2px 16px rgba(33,29,28,.35)',
  aluno:     '0 2px 16px rgba(122,29,44,.35)',
}

const ROLE_LABEL: Record<TopbarRole, string> = {
  admin:     '🏠 Administrador',
  professor: '🎓 Professor',
  aluno:     '🎪 Aluno',
}

export function Topbar({ role, nome, email }: TopbarProps) {
  // isPending: true enquanto a Server Action de logout roda no servidor
  // startTransition: envolve chamadas assíncronas para marcar como pendente
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    // startTransition é necessário para que isPending funcione.
    // Sem ele, o React não marcaria a transição e o botão
    // nunca ficaria desabilitado durante o logout.
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <header
      className="h-16 flex items-center gap-5 px-8 flex-shrink-0 z-[100]"
      style={{
        background: TOPBAR_GRADIENT[role],
        boxShadow:  TOPBAR_SHADOW[role],
      }}
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
        {ROLE_LABEL[role]}
      </span>

      <div className="flex-1" />

      {/* Usuário + botão Sair */}
      <div className="flex items-center gap-3">

        {/* Avatar com iniciais do nome real */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0"
          style={{ background: 'rgba(255,255,255,.22)', color: '#F4E7CE' }}
          aria-label={`Avatar de ${nome}`}
        >
          {iniciais(nome)}
        </div>

        {/* Nome e e-mail reais — ocultos em telas pequenas */}
        <div className="hidden sm:block">
          <p
            className="text-sm font-semibold leading-none"
            style={{ color: '#F4E7CE' }}
          >
            {nome}
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: 'rgba(244,231,206,.65)' }}
          >
            {email}
          </p>
        </div>

        {/* Botão Sair
            disabled={isPending} → bloqueado durante o logout
            texto muda para "Saindo…" como feedback visual     */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          aria-label="Sair da plataforma"
          className="px-4 py-1.5 text-xs font-semibold rounded-xl ml-1 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            border:     '1.5px solid rgba(255,255,255,.25)',
            color:      'rgba(244,231,206,.85)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!isPending)
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(255,255,255,.12)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          {isPending ? 'Saindo…' : 'Sair'}
        </button>

      </div>
    </header>
  )
}
