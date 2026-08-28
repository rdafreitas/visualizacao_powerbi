// ─────────────────────────────────────────────────────────────
// /pages/admin/perfil — Server Component
// Hub de Perfil & Configurações com navegação por sub-seções.
// ─────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { iniciais, avatarColorByName, formatDataCurta } from '@/lib/utils'
import { ROLE_DISPLAY } from '@/lib/permissions'

export const metadata = { title: 'Perfil — PaVoar Admin' }

export default async function AdminPerfilPage() {
  const profile = await getProfile()
  if (!profile) redirect('/pages/login')
  if (!hasPermission(profile.role, 'admin:perfil')) redirect('/pages/admin/home')

  const display = ROLE_DISPLAY[profile.role]
  const podaAcessos = hasPermission(profile.role, 'admin:perfil:acessos')

  const SUB_MENUS = [
    ...(podaAcessos ? [{
      href:  '/pages/admin/perfil/acessos',
      icon:  '🔑',
      label: 'Acessos',
      desc:  'Usuários cadastrados, permissões e senhas',
    }] : []),
    {
      href:  '#',   // futuro
      icon:  '⚙️',
      label: 'Configurações',
      desc:  'Dados da academia e preferências do sistema',
    },
  ]

  return (
    <>
      <PageHeader
        title="Perfil & Configurações"
        subtitle="Gerencie seus dados e as configurações do sistema."
      />

      {/* Card de perfil do usuário logado */}
      <Card className="mb-6">
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-poppins text-xl font-extrabold text-white flex-shrink-0"
            style={{ background: avatarColorByName(profile.nome) }}
          >
            {iniciais(profile.nome)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-poppins text-xl font-extrabold text-gray-dark truncate">
              {profile.nome}
            </h2>
            <p className="text-sm text-gray-mid mt-0.5">{profile.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${display.colorClass}`}>
                {display.icon} {display.label}
              </span>
              {profile.createdAt && (
                <span className="text-xs text-gray-mid">
                  Membro desde {formatDataCurta(new Date(profile.createdAt))}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Grid de sub-seções */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SUB_MENUS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={[
              'flex items-start gap-4 p-5 rounded-2xl border border-[#E8E8F0] bg-white',
              'hover:border-purple/30 hover:bg-purple/[0.02] hover:-translate-y-0.5',
              'transition-all no-underline group',
              item.href === '#' ? 'opacity-50 pointer-events-none' : '',
            ].join(' ')}
          >
            <span className="text-3xl mt-0.5 flex-shrink-0">{item.icon}</span>
            <div>
              <p className="font-poppins font-bold text-gray-dark group-hover:text-purple transition-colors">
                {item.label}
              </p>
              <p className="text-sm text-gray-mid mt-0.5">{item.desc}</p>
              {item.href === '#' && (
                <p className="text-[11px] text-gray-mid mt-1 italic">Em breve</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
