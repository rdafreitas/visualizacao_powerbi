// ─────────────────────────────────────────────────────────────
// admin/professores/page.tsx — Server Component
// Exporta metadata e delega conteúdo ao ProfessoresClient.
// ─────────────────────────────────────────────────────────────

import { ProfessoresClient } from './ProfessoresClient'

export const metadata = { title: 'Professores — Andorin Admin' }

export default function AdminProfessoresPage() {
  return <ProfessoresClient />
}
