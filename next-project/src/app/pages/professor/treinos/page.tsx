// ─────────────────────────────────────────────────────────────
// professor/treinos/page.tsx — Server Component
// Exporta metadata e delega conteúdo ao TreinosClient.
// ─────────────────────────────────────────────────────────────

import { TreinosClient } from './TreinosClient'

export const metadata = { title: 'Treinos — Professor Andorin' }

export default function ProfessorTreinosPage() {
  return <TreinosClient />
}
