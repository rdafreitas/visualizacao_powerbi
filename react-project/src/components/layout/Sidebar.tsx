'use client'

// ─────────────────────────────────────────────────────────────
// src/components/layout/Sidebar.tsx
// Sidebar do modo Admin — brand-orange.
// Fundo: #fef3e8  ·  Accent: #f27406
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PERMISSIONS } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import type { Permission, Role } from '@/types/app'

interface NavItem {
  label:      string
  href:       string
  permission: Permission
  icon:       string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Início',      href: '/pages/admin/home',        permission: 'admin:home',        icon: '🏠' },
  { label: 'Alunos',      href: '/pages/admin/alunos',      permission: 'admin:alunos',      icon: '👥' },
  { label: 'Agenda',      href: '/pages/admin/agenda',      permission: 'admin:agenda',      icon: '📅' },
  { label: 'Professores', href: '/pages/admin/professores', permission: 'admin:professores', icon: '🎭' },
  { label: 'Financeiro',  href: '/pages/admin/financeiro',  permission: 'admin:financeiro',  icon: '💰' },
  { label: 'Perfil',      href: '/pages/admin/perfil',      permission: 'admin:perfil',      icon: '👤' },
]

const ACCENT = '#f27406'

interface SidebarProps {
  role: Role
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const allowed  = PERMISSIONS[role] as Permission[]
  const visible  = NAV_ITEMS.filter((item) => allowed.includes(item.permission))

  return (
    <aside
      className="w-60 flex flex-col py-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto flex-shrink-0"
      style={{
        background:  '#fef3e8',
        borderRight: '1px solid rgba(242,116,6,.14)',
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[1.5px] px-5 mb-2"
        style={{ color: '#b07040' }}>
        Menu principal
      </p>

      <nav className="flex flex-col">
        {visible.map((item) => {
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
