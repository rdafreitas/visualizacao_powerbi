// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/pagamentos/page.tsx
//
// Server Component — busca dados do mês atual em paralelo.
// Passa dados reais para o PagamentosClient (Client Component).
// O Client Component gerencia o seletor de mês — necessário
// porque mudar de mês exige estado local (useState).
// ─────────────────────────────────────────────────────────────

import { requireAuth }                  from '@/(auth)/session'
import { listarPagamentosProfessor }    from '@/(auth)/actions/pagamentos-professor'
import { listarHistoricoPagamentos }    from '@/(auth)/actions/pagamentos-professor'
import { PagamentosClient }             from './PagamentosClient'

export const metadata = { title: 'Pagamentos — Professor Andorin' }

export default async function ProfessorPagamentosPage() {
  await requireAuth()

  const mesAtual = new Date().toISOString().substring(0, 7)  // 'YYYY-MM'

  const [pagamentosResult, historicoResult] = await Promise.all([
    listarPagamentosProfessor(mesAtual),
    listarHistoricoPagamentos(),
  ])

  return (
    <PagamentosClient
      pagamentosIniciais={pagamentosResult.ok ? pagamentosResult.data : []}
      historico={historicoResult.ok           ? historicoResult.data  : []}
      mesInicial={mesAtual}
    />
  )
}
