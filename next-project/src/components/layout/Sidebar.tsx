'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
//import { PERMISSIONS } from '@/lib/permissions'
import { cn } from '@/lib/utils'
//import type { Permission, Role } from '@/types/app'

type Variant = 'var_admin' | 'var_aluno' | 'var_professor'

interface NavItem {
  label:      string
  href:       string
  //permission: Permission
  icon:       string
}

const VARIANT_CLASSES: Record<Variant, string> = {
  var_admin:     'brand-oficial-off-white border-r border-black/[0.07]',
  var_aluno:     'bg-off-white border-r border-bordo/15',
  var_professor: 'brand-chumbo border-r border-blue-light',
}

const NAV_ITEMS: NavItem[] = [
  {
    label:      'Início',
    href:       '/pages/admin/home',
    //permission: 'admin:home',
    icon:       '🏠',
  },
  {
    label:      'Alunos',
    href:       '/pages/admin/alunos',
    //permission: 'admin:alunos',
    icon:       '👥',
  },
  {
    label:      'Agenda',
    href:       '/pages/admin/agenda',
    //permission: 'admin:agenda',
    icon:       '📅',
  },
  {
    label:      'Professores',
    href:       '/pages/admin/professores',
    //permission: 'admin:professores',
    icon:       '🎭',
  },
  {
    label:      'Financeiro',
    href:       '/pages/admin/financeiro',
    //permission: 'admin:financeiro',
    icon:       '💰',
  },
  {
    label:      'Perfil',
    href:       '/pages/admin/perfil',
    //permission: 'admin:perfil',
    icon:       '👤',
  },
]

interface SidebarProps {
  //role: Role
  variant?: Variant
}

export function Sidebar({
  /*{ role }: SidebarProps*/
  variant = 'var_admin',
}: SidebarProps) {
  const pathname = usePathname()
  //const allowed  = PERMISSIONS[role] as Permission[]
  const visible  = NAV_ITEMS//.filter((item) => allowed.includes(item.permission))

  return (
    <aside
      className={cn(
        'w-50 flex flex-col py-6 self-stretch overflow-y-auto flex-shrink-0',
        VARIANT_CLASSES[variant]
      )}
    >
      <p className="text-[14px] font-extrabold text-gray-mid tracking-[1.5px] px-5 mb-2">
        Menu Principal
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
              className={cn(
                'flex items-center gap-3 px-5 py-2.5 text-sm font-semibold',
                'transition-colors relative no-underline',
                isActive
                  ? 'text-purple bg-gray-bg'
                  : 'text-gray-dark hover:bg-gray-bg'
              )}
            >
              {/* Barra indicadora de item ativo */}
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-purple" />
              )}
              <span className="text-lg w-6 text-center leading-none">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
