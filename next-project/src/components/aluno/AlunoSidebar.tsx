'use client'

// ─────────────────────────────────────────────────────────────
// AlunoSidebar — versão FRONT-END ESTÁTICO
// Visual: fundo branco, accent bordô, Agenda com destaque gradiente.
// Sem props de role ou permissions — 100% estático para validação visual.
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Início',     href: '/pages/aluno/home',       icon: '🏠',  fab: false },
  { label: 'Evolução',   href: '/pages/aluno/evolucao',   icon: '🌟',  fab: false },
  { label: 'Agenda',     href: '/pages/aluno/agenda',     icon: '📅',  fab: true  },
  { label: 'Pagamentos', href: '/pages/aluno/pagamentos', icon: '💳',  fab: false },
  { label: 'Perfil',     href: '/pages/aluno/perfil',     icon: '👤',  fab: false },
]

const ACCENT = '#7A1D2C'

export function AlunoSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-60 bg-white flex flex-col py-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto flex-shrink-0"
      style={{ borderRight: '1px solid rgba(122,29,44,.10)' }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-[1.5px] px-5 mb-2"
        style={{ color: '#8a7d70' }}
      >
        Menu principal
      </p>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + '/')

          // Item FAB — Agenda com gradiente bordô
          if (item.fab) {
            return (
              <div key={item.href} className="px-3 my-1">
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold no-underline transition-all hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, #5a1520)`,
                    color:      '#F4E7CE',
                  }}
                >
                  <span className="text-lg w-6 text-center leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-5 py-2.5 text-sm font-semibold transition-colors relative no-underline"
              style={{
                color:      isActive ? ACCENT : '#211D1C',
                background: isActive ? 'rgba(122,29,44,.07)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(122,29,44,.04)'
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
