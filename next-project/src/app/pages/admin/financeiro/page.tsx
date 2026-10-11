// ─────────────────────────────────────────────────────────────
// admin/financeiro/page.tsx — Server Component
// Exporta metadata (processado no servidor) e delega todo o
// conteúdo interativo para FinanceiroClient (Client Component).
// ─────────────────────────────────────────────────────────────

import { FinanceiroClient } from './FinanceiroClient'

export const metadata = { title: 'Financeiro — Andorin Admin' }

export default function AdminFinanceiroPage() {
  return <FinanceiroClient />
}
