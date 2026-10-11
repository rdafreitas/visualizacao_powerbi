// ─────────────────────────────────────────────────────────────
// professor/agenda/page.tsx — Server Component
// Exporta metadata e delega conteúdo ao AgendaProfessorClient.
// ─────────────────────────────────────────────────────────────

import { AgendaProfessorClient } from './AgendaProfessorClient'

export const metadata = { title: 'Agenda — Professor Andorin' }

export default function ProfessorAgendaPage() {
  return <AgendaProfessorClient />
}
