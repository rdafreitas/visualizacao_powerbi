// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/perfil/acessos/page.tsx
//
// Server Component assíncrono — busca dados reais no servidor
// antes de enviar qualquer HTML ao browser.
//
// FLUXO DE SEGURANÇA (3 camadas):
//   1. Middleware → verificou sessão e modo admin antes de chegar aqui
//   2. requireRole('admin:perfil:acessos') → verifica sessão novamente
//      + confirma que o role tem permissão específica desta página
//      (apenas 'proprietario' tem 'admin:perfil:acessos')
//   3. listarUsuariosComCredencial() → a própria Server Action
//      chama exigirProprietario() internamente antes de qualquer query
//
// POR QUE BUSCAR DADOS NO SERVIDOR E NÃO NO CLIENTE?
//   Se buscássemos no Client Component, o browser enviaria a query
//   ao Supabase diretamente — exposto na aba Network do DevTools.
//   Buscando no Server Component, os dados chegam já no HTML inicial.
//   O browser nunca vê a query acontecer — apenas recebe o resultado.
// ─────────────────────────────────────────────────────────────

import { requireRole }                  from '@/(auth)/session'
import { listarUsuariosComCredencial }  from '@/(auth)/actions/usuarios'
import { PageHeader }                   from '@/components/layout/PageHeader'
import { Card }                         from '@/components/ui/Card'
import { AcessosClient }                from '../AcessosClient'

export const metadata = { title: 'Acessos — Andorin Admin' }

export default async function AcessosPage() {

  // requireRole verifica sessão + permissão específica.
  // Se o role não tiver 'admin:perfil:acessos', redireciona
  // para ROLE_HOME antes de executar qualquer linha abaixo.
  const profile = await requireRole('admin:perfil:acessos')

  // Busca usuários com JOIN em profiles_credencial no servidor.
  // A Server Action verifica exigirProprietario() internamente —
  // terceira camada de proteção independente.
  const resultado = await listarUsuariosComCredencial()

  return (
    <>
      <PageHeader
        title="Acessos"
        subtitle="Gerencie os usuários e permissões de acesso ao sistema."
      />
      <Card>
        {resultado.ok ? (
          // Dados reais passados como props ao Client Component.
          // meuId → TabelaAcessos exibe "Você" na própria linha
          //          e oculta os botões de ação para o próprio usuário.
          <AcessosClient
            usuarios={resultado.data}
            meuId={profile.id}
          />
        ) : (
          // Erro ao buscar — exibe mensagem sem expor detalhes técnicos
          <p className="text-sm py-8 text-center" style={{ color: '#922b21' }}>
            {resultado.error}
          </p>
        )}
      </Card>
    </>
  )
}
