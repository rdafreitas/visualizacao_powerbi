import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { iniciais, avatarColorByName, formatDataCurta } from '@/lib/utils'

export const metadata = { title: 'Perfil — Andorin Admin' }

// Demo — substituir por getProfile() quando integrar o backend
const DEMO_PROFILE = {
  nome:      "Renan D'Alexandro",
  email:     'renan@andorin.com.br',
  role:      'proprietario',
  createdAt: '2024-01-15',
}

const SUB_MENUS = [
  {
    href:  '/pages/admin/perfil/acessos',
    icon:  '🔑',
    label: 'Acessos',
    desc:  'Usuários cadastrados, permissões e senhas',
  },
  {
    href:  '#',
    icon:  '⚙️',
    label: 'Configurações',
    desc:  'Dados da academia e preferências do sistema',
  },
]

export default function AdminPerfilPage() {
  const profile = DEMO_PROFILE

  return (
    <>
      <PageHeader
        title="Perfil & Configurações"
        subtitle="Gerencie seus dados e as configurações do sistema."
      />

      {/* Card do usuário logado */}
      <Card className="mb-6">
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold text-off-white flex-shrink-0"
            style={{
              fontFamily: 'var(--font-montserrat)',
              background: avatarColorByName(profile.nome),
            }}
          >
            {iniciais(profile.nome)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold text-gray-dark truncate"
              style={{ fontFamily: 'var(--font-montserrat)' }}>
              {profile.nome}
            </h2>
            <p className="text-sm text-gray-mid mt-0.5">{profile.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange/20 text-orange-dk">
                🏠 Proprietário
              </span>
              <span className="text-xs text-gray-mid">
                Membro desde {formatDataCurta(new Date(profile.createdAt))}
              </span>
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
              'flex items-start gap-4 p-5 rounded-2xl border border-black/[0.06] bg-white',
              'hover:border-bordo/25 hover:bg-bordo/[0.02] hover:-translate-y-0.5',
              'transition-all no-underline group',
              item.href === '#' ? 'opacity-50 pointer-events-none' : '',
            ].join(' ')}
          >
            <span className="text-3xl mt-0.5 flex-shrink-0">{item.icon}</span>
            <div>
              <p className="font-bold text-gray-dark group-hover:text-bordo transition-colors"
                style={{ fontFamily: 'var(--font-montserrat)' }}>
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
