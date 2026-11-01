// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/agenda/page.tsx
//
// Server Component assíncrono — busca aulas da semana atual
// com status de inscrição do aluno incluído.
// ─────────────────────────────────────────────────────────────

import { requireAuth }      from '@/(auth)/session'
import { listarAulasAluno } from '@/(auth)/actions/inscricoes'
import { AgendaAlunoClient } from './AgendaAlunoClient'

export const metadata = { title: 'Agenda — Andorin' }

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

export default async function AlunoAgendaPage() {
  await requireAuth()

  const semana = semanaAtual()
  const resultado = await listarAulasAluno(semana.inicio, semana.fim)

  return (
    <AgendaAlunoClient
      aulasIniciais={resultado.ok ? resultado.data : []}
      semanaInicial={semana.inicio}
    />
  )
}
