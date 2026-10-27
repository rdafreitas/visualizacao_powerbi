// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/perfil/page.tsx
//
// Página de Perfil & Configurações do Admin.
// Server Component assíncrono — lê dados reais do banco.
//
// FLUXO DE SEGURANÇA:
//   1. Middleware verificou sessão antes de chegar aqui
//   2. requireRole('admin:perfil') verifica novamente + checa
//      se o role tem a permissão específica desta página
//   3. Sub-menus filtrados por hasPermission() — exibe apenas
//      o que o role do usuário pode acessar
//
// POR QUE SERVER COMPONENT E NÃO CLIENT?
//   A página exibe dados estáticos do usuário (nome, email, role,
//   data de cadastro) sem interação complexa. Server Component
//   renderiza o HTML com dados corretos diretamente no servidor —
//   sem loading state, sem flash de conteúdo vazio, sem JS extra
//   no bundle do browser para buscar esses dados.
// ─────────────────────────────────────────────────────────────

import Link            from 'next/link'
import { requireRole } from '@/(auth)/session'
import { hasPermission } from '@/lib/permissions'
import { PageHeader }  from '@/components/layout/PageHeader'
import { Card }        from '@/components/ui/Card'
import {
  iniciais,
  avatarColorByName,
  formatDataCurta,
} from '@/lib/utils'
import type { Permission, Role } from '@/types/app'

export const metadata = { title: 'Perfil — Andorin Admin' }

// ── Mapa de exibição por role ─────────────────────────────────
// Definido aqui em vez de importar ROLE_DISPLAY de permissions.ts
// porque as classes de cor (colorClass) dependem de variáveis CSS
// do projeto e não precisam ser centralizadas no permissions.ts.
const ROLE_DISPLAY: Record<Role, { label: string; icon: string; colorClass: string }> = {
  proprietario: { label: 'Proprietário', icon: '👑', colorClass: 'bg-orange/20 text-orange-dk' },
  funcionario:  { label: 'Funcionário',  icon: '🏢', colorClass: 'bg-blue-light/30 text-chumbo' },
  professor:    { label: 'Professor',    icon: '🎭', colorClass: 'bg-green-light/40 text-chumbo' },
  aluno:        { label: 'Aluno',        icon: '🤸', colorClass: 'bg-off-white/60 text-chumbo'  },
}

// ── Definição dos sub-menus ───────────────────────────────────
// permissao: se definido, o item só aparece se o role do usuário
//            tiver essa permissão (verificado via hasPermission).
// permissao: null → aparece para qualquer role que chegou aqui.
interface SubMenu {
  href:      string
  icon:      string
  label:     string
  desc:      string
  permissao: Permission | null
  emBreve:   boolean
}

const SUB_MENUS: SubMenu[] = [
  {
    href:      '/pages/admin/perfil/acessos',
    icon:      '🔑',
    label:     'Acessos',
    desc:      'Usuários cadastrados, permissões e senhas',
    permissao: 'admin:perfil:acessos',
    emBreve:   false,
  },
  {
    href:      '#',
    icon:      '⚙️',
    label:     'Configurações',
    desc:      'Dados da academia e preferências do sistema',
    permissao: null,
    emBreve:   true,
  },
]

export default async function AdminPerfilPage() {

  // requireRole verifica duas coisas em sequência:
  //   1. Há sessão válida? (equivale ao requireAuth)
  //      → se não: redireciona para LOGIN_ROUTE (/)
  //   2. O role tem permissão 'admin:perfil'?
  //      → se não: redireciona para ROLE_HOME do role
  // Apenas 'proprietario' tem 'admin:perfil' em permissions.ts.
  const profile = await requireRole('admin:perfil')

  // Filtra sub-menus pelo que o role pode acessar.
  // 'admin:perfil:acessos' → apenas proprietario.
  // itens com permissao: null → aparecem para qualquer role.
  // itens emBreve → filtro não se aplica (pointer-events-none)
  const menusVisiveis = SUB_MENUS.filter(
    (item) => item.permissao === null || hasPermission(profile.role, item.permissao)
  )

  const display = ROLE_DISPLAY[profile.role]

  return (
    <>
      <PageHeader
        title="Perfil & Configurações"
        subtitle="Gerencie seus dados e as configurações do sistema."
      />

      {/* ── Card do usuário logado ── */}
      <Card className="mb-6">
        <div className="flex items-center gap-5">

          {/* Avatar com iniciais e cor baseada no nome */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center
                        text-xl font-extrabold text-off-white flex-shrink-0"
            style={{
              fontFamily: 'var(--font-montserrat)',
              background: avatarColorByName(profile.nome),
            }}
          >
            {iniciais(profile.nome)}
          </div>

          <div className="flex-1 min-w-0">

            {/* Nome real do usuário logado */}
            <h2
              className="text-xl font-extrabold text-gray-dark truncate"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {profile.nome}
            </h2>

            {/* E-mail real */}
            <p className="text-sm text-gray-mid mt-0.5">
              {profile.email}
            </p>

            <div className="flex items-center gap-3 mt-2 flex-wrap">

              {/* Badge de role — dinâmico, não hardcoded */}
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${display.colorClass}`}>
                {display.icon} {display.label}
              </span>

              {/* Data de cadastro — exibe apenas se existir */}
              {profile.createdAt && (
                <span className="text-xs text-gray-mid">
                  Membro desde{' '}
                  {formatDataCurta(new Date(profile.createdAt))}
                </span>
              )}

            </div>
          </div>
        </div>
      </Card>

      {/* ── Grid de sub-seções ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {menusVisiveis.map((item) => (
          <Link
            key={item.label}
            href={item.emBreve ? '#' : item.href}
            className={[
              'flex items-start gap-4 p-5 rounded-2xl',
              'border border-black/[0.06] bg-white',
              'hover:border-bordo/25 hover:bg-bordo/[0.02] hover:-translate-y-0.5',
              'transition-all no-underline group',
              item.emBreve ? 'opacity-50 pointer-events-none' : '',
            ].join(' ')}
          >
            <span className="text-3xl mt-0.5 flex-shrink-0">
              {item.icon}
            </span>
            <div>
              <p
                className="font-bold text-gray-dark group-hover:text-bordo transition-colors"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {item.label}
              </p>
              <p className="text-sm text-gray-mid mt-0.5">
                {item.desc}
              </p>
              {item.emBreve && (
                <p className="text-[11px] text-gray-mid mt-1 italic">
                  Em breve
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
