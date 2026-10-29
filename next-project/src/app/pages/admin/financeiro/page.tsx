// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/financeiro/page.tsx
//
// Server Component assíncrono do módulo financeiro.
//
// RESPONSABILIDADE ÚNICA:
//   Buscar os dados iniciais do mês atual no servidor e passar
//   como props para o FinanceiroClient (Client Component).
//   Não contém nenhuma lógica de UI ou interação.
//
// POR QUE Promise.all?
//   Executa resumoFinanceiro() e listarTransacoes() em paralelo.
//   Sem Promise.all seriam sequenciais: ~300ms + ~300ms = ~600ms.
//   Com Promise.all: ~300ms total (aguarda o mais lento dos dois).
//
// SEGURANÇA:
//   requireRole('admin:financeiro') — verifica sessão + permissão
//   antes de qualquer query. Apenas 'proprietario' tem essa
//   permissão em lib/permissions.ts. Se um funcionário tentar
//   acessar /pages/admin/financeiro, é redirecionado antes de
//   qualquer dado financeiro ser buscado ou renderizado.
// ─────────────────────────────────────────────────────────────

import { requireRole }         from '@/(auth)/session'
import { resumoFinanceiro }    from '@/(auth)/actions/financeiro'
import { listarTransacoes }    from '@/(auth)/actions/financeiro'
import { FinanceiroClient }    from './FinanceiroClient'

export const metadata = { title: 'Financeiro — Andorin Admin' }

export default async function AdminFinanceiroPage() {

  // Dupla proteção: middleware (1ª) + requireRole (2ª)
  await requireRole('admin:financeiro')

  // Mês atual no formato 'YYYY-MM' — ex: '2026-07'
  const mesAtual = new Date().toISOString().substring(0, 7)

  // Busca resumo e lista de transações em paralelo no servidor.
  // Os dados chegam ao browser já no HTML — sem loading state inicial.
  const [resumo, transacoesResult] = await Promise.all([
    resumoFinanceiro(mesAtual),
    listarTransacoes(mesAtual),
  ])

  return (
    <FinanceiroClient
      resumo={resumo}
      transacoesIniciais={transacoesResult.ok ? transacoesResult.data : []}
      mesInicial={mesAtual}
    />
  )
}
