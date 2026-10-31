// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/agenda/page.tsx
//
// Server Component assíncrono da tela de Agenda.
// Calcula a semana atual e busca aulas + professores em paralelo.
//
// RESPONSABILIDADE ÚNICA:
//   Calcular semana, buscar dados iniciais e passar como props.
//   Toda interatividade (navegação, modal, cancelamento) fica
//   no AgendaClient (Client Component).
// ─────────────────────────────────────────────────────────────

import { requireRole }             from '@/(auth)/session'
import { listarAulasDaSemana }     from '@/(auth)/actions/agenda-admin'
import { listarProfessores }       from '@/(auth)/actions/agenda-admin'
import { AgendaClient }            from './AgendaClient'

export const metadata = { title: 'Agenda — Andorin Admin' }

// Calcula início (segunda) e fim (domingo) da semana atual.
// T12:00:00 evita bugs de timezone: sem horário, datas UTC
// podem ser interpretadas como dia anterior no fuso local.
function semanaAtual() {
  const hoje     = new Date()
  const diaSem   = hoje.getDay()               // 0 = Dom, 1 = Seg ...
  const inicio   = new Date(hoje)
  inicio.setDate(hoje.getDate() - diaSem + 1)  // recua para segunda
  const fim = new Date(inicio)
  fim.setDate(inicio.getDate() + 6)            // avança para domingo
  return {
    inicio: inicio.toISOString().split('T')[0],
    fim:    fim.toISOString().split('T')[0],
  }
}

export default async function AdminAgendaPage() {
  await requireRole('admin:agenda')

  const semana = semanaAtual()

  // Paralelo: aulas da semana + lista de professores para o formulário
  const [aulasDaSemana, professoresResult] = await Promise.all([
    listarAulasDaSemana(semana.inicio, semana.fim),
    listarProfessores(),
  ])

  return (
    <AgendaClient
      aulasSemanaInicial={aulasDaSemana.ok  ? aulasDaSemana.data  : []}
      professores={professoresResult.ok      ? professoresResult.data : []}
      semanaInicial={semana.inicio}
    />
  )
}
