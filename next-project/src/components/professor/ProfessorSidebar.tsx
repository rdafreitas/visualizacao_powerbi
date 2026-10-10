'use client'

// ─────────────────────────────────────────────────────────────
// ProfessorSidebar — versão FRONT-END ESTÁTICO
// Visual: fundo chumbo claro (#f0edeb), accent chumbo escuro.
// Sem props de role ou permissions — 100% estático para validação visual.
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Início',     href: '/pages/professor/home',       icon: '🏠' },
  { label: 'Treinos',    href: '/pages/professor/treinos',    icon: '🏋️' },
  { label: 'Agenda',     href: '/pages/professor/agenda',     icon: '📅' },
  { label: 'Pagamentos', href: '/pages/professor/pagamentos', icon: '💵' },
  { label: 'Perfil',     href: '/pages/professor/perfil',     icon: '👤' },
]

const ACCENT = '#211D1C'

export function ProfessorSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-60 flex flex-col py-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto flex-shrink-0"
      style={{
        background:  '#f0edeb',
        borderRight: '1px solid rgba(33,29,28,.12)',
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-[1.5px] px-5 mb-2"
        style={{ color: '#8a7d70' }}
      >
        Menu principal
      </p>

      <nav className="flex flex-col">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-5 py-2.5 text-sm font-semibold transition-colors relative no-underline"
              style={{
                color:      isActive ? ACCENT : '#3a3330',
                background: isActive ? 'rgba(33,29,28,.08)' : 'transparent',
                fontWeight: isActive ? 700 : 600,
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(33,29,28,.05)'
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
              }}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r"
                  style={{ background: ACCENT }}
                />
              )}
              <span className="text-lg w-6 text-center leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
