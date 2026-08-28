// ─────────────────────────────────────────────────────────────
// /pages/admin/perfil/acessos — Server Component
//
// POR QUE Server Component?
// A busca dos usuários acontece no servidor, antes de qualquer
// HTML ser enviado ao browser. O usuário vê a lista já populada
// na primeira renderização, sem loading spinner.
// ─────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'
import { listarUsuariosComCredencial } from '@/lib/actions/usuarios'
import { AcessosClient } from '@/components/admin/perfil/AcessosClient'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Acessos — PaVoar Admin' }

export default async function AcessosPage() {
  // 1. Verifica autenticação e permissão
  const profile = await getProfile()
  if (!profile) redirect('/pages/login')
  if (!hasPermission(profile.role, 'admin:perfil:acessos')) {
    redirect('/pages/admin/perfil')
  }

  // 2. Busca os dados no servidor (antes de renderizar)
  const { data: usuarios, error } = await listarUsuariosComCredencial()

  return (
    <>
      <PageHeader
        title="Acessos"
        subtitle="Gerencie os usuários e permissões de acesso ao sistema."
      />

      <Card>
        {error ? (
          <p className="text-sm text-red py-8 text-center">{error}</p>
        ) : (
          // AcessosClient recebe os dados como props e gerencia
          // o modal de cadastro e as ações de ativar/desativar
          <AcessosClient usuarios={usuarios} meuId={profile.id} />
        )}
      </Card>
    </>
  )
}
