// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/alunos/page.tsx
//
// Server Component assíncrono — busca dados reais no servidor
// e passa como props para o AlunosClient (Client Component).
//
// SEGURANÇA:
//   1. Middleware verificou sessão e modo admin
//   2. requireRole('admin:alunos') verifica sessão + permissão
//   3. listarAlunosComMatricula() chama exigirAdmin() internamente
//
// POR QUE Promise.all?
//   Executa as duas queries em paralelo no servidor.
//   Alunos e planos são independentes — não precisam esperar
//   uma pela outra. Reduz o tempo de carregamento pela metade.
// ─────────────────────────────────────────────────────────────

import { requireRole }               from '@/(auth)/session'
import { listarAlunosComMatricula }  from '@/(auth)/actions/matriculas'
import { listarPlanos }              from '@/(auth)/actions/matriculas'
import { AlunosClient }              from './AlunosClient'

export const metadata = { title: 'Alunos — Andorin Admin' }

export default async function AdminAlunosPage() {
  await requireRole('admin:alunos')

  const [alunosResult, planosResult] = await Promise.all([
    listarAlunosComMatricula(),
    listarPlanos(),
  ])

  return (
    <AlunosClient
      alunos={alunosResult.ok  ? alunosResult.data  : []}
      planos={planosResult.ok  ? planosResult.data  : []}
      erroInicial={!alunosResult.ok ? alunosResult.error : undefined}
    />
  )
}
