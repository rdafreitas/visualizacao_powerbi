'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Início',      href: '/pages/admin/home',        icon: '🏠' },
  { label: 'Alunos',      href: '/pages/admin/alunos',      icon: '👥' },
  { label: 'Agenda',      href: '/pages/admin/agenda',      icon: '📅' },
  { label: 'Professores', href: '/pages/admin/professores', icon: '🎭' },
  { label: 'Financeiro',  href: '/pages/admin/financeiro',  icon: '💰' },
  { label: 'Perfil',      href: '/pages/admin/perfil',      icon: '👤' },
]

const ACCENT = '#f27406'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-60 flex flex-col py-6 flex-shrink-0 h-full overflow-y-auto"
      style={{
        background:  '#fef3e8',
        borderRight: '1px solid rgba(242,116,6,.14)',
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-[1.5px] px-5 mb-2"
        style={{ color: '#b07040' }}
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
                color:      isActive ? ACCENT : '#211D1C',
                background: isActive ? 'rgba(242,116,6,.10)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(242,116,6,.06)'
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
