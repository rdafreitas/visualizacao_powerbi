// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/agenda/page.tsx
//
// Server Component assíncrono — busca aulas reais da semana atual.
// ─────────────────────────────────────────────────────────────

import { requireAuth }          from '@/(auth)/session'
import { listarAulasProfessor } from '@/(auth)/actions/checkin'
import { listarTreinos }        from '@/(auth)/actions/treinos'
import { AgendaProfessorClient } from './AgendaProfessorClient'

export const metadata = { title: 'Agenda — Professor Andorin' }

function semanaAtual() {
  const hoje   = new Date()
  const diaSem = hoje.getDay()
  const inicio = new Date(hoje)
  inicio.setDate(hoje.getDate() - diaSem + 1)
  const fim = new Date(inicio)
  fim.setDate(inicio.getDate() + 6)
  return {
    inicio: inicio.toISOString().split('T')[0],
    fim:    fim.toISOString().split('T')[0],
  }
}

export default async function ProfessorAgendaPage() {
  await requireAuth()

  const semana = semanaAtual()

  // Paralelo: aulas da semana + treinos do professor (para o seletor de treino)
  const [aulasResult, treinosResult] = await Promise.all([
    listarAulasProfessor(semana.inicio, semana.fim),
    listarTreinos(),
  ])

  return (
    <AgendaProfessorClient
      aulasSemanaInicial={aulasResult.ok  ? aulasResult.data  : []}
      treinos={treinosResult.ok           ? treinosResult.data : []}
      semanaInicial={semana.inicio}
    />
  )
}
