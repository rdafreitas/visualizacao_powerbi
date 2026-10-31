// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/treinos/page.tsx
//
// Server Component assíncrono — busca dados reais em paralelo.
// ─────────────────────────────────────────────────────────────

import { requireAuth }        from '@/(auth)/session'
import { listarTreinos }      from '@/(auth)/actions/treinos'
import { listarHabilidades }  from '@/(auth)/actions/treinos'
import { TreinosClient }      from './TreinosClient'

export const metadata = { title: 'Treinos — Professor Andorin' }

export default async function ProfessorTreinosPage() {
  // requireAuth: verifica sessão (role verificado pelo middleware)
  await requireAuth()

  // Paralelo: treinos do professor + habilidades para o seletor
  const [treinosResult, habilidadesResult] = await Promise.all([
    listarTreinos(),
    listarHabilidades(),
  ])

  return (
    <TreinosClient
      treinos={treinosResult.ok      ? treinosResult.data      : []}
      habilidades={habilidadesResult.ok ? habilidadesResult.data : []}
    />
  )
}
