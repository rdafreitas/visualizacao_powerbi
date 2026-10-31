// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/professores/page.tsx
//
// Server Component assíncrono da tela de Professores.
// ─────────────────────────────────────────────────────────────

import { requireRole }                    from '@/(auth)/session'
import { listarProfessoresComMetricas }   from '@/(auth)/actions/professores-admin'
import { ProfessoresClient }              from './ProfessoresClient'

export const metadata = { title: 'Professores — Andorin Admin' }

export default async function AdminProfessoresPage() {
  await requireRole('admin:professores')

  const resultado = await listarProfessoresComMetricas()

  return (
    <ProfessoresClient
      professores={resultado.ok ? resultado.data : []}
      erroInicial={!resultado.ok ? resultado.error : undefined}
    />
  )
}
