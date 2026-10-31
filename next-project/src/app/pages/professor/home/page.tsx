// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/home/page.tsx
//
// Server Component puro — sem 'use client', sem useState.
// A Home do Professor é leitura pura: avisos, próximas aulas
// e check-ins recentes. Sem interatividade, sem JS no bundle.
//
// TRÊS FONTES DE DADOS EM PARALELO:
//   1. get_avisos_professor() → função SQL — avisos dinâmicos
//   2. Próximas aulas (7 dias) com contagem de inscritos
//   3. Check-ins recentes via aluno_xp_log (origem='presenca')
//
// KPIs calculados dos dados já buscados — sem queries extras.
// ─────────────────────────────────────────────────────────────

import Link              from 'next/link'
import { requireAuth }   from '@/(auth)/session'
import { createClient }  from '@/lib/supabase/server'
import { PageHeader }    from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { iniciais, avatarColorByName, formatDataCurta } from '@/lib/utils'
import type { AvisoProfessor } from '@/(auth)/actions/checkin'

export const metadata = { title: 'Início — Professor Andorin' }

// ── Estilos por tipo de aviso ──────────────────────────────────
const AVISO_COR: Record<string, string> = {
  treino_ausente: 'bg-off-white border-l-4 border-orange',
  aula_cancelada: 'bg-red/5 border-l-4 border-red',
}

const AVISO_ICONE: Record<string, string> = {
  treino_ausente: '🏋️',
  aula_cancelada: '🚨',
}

const AVISO_BADGE: Record<string, { text: string; cor: string }> = {
  treino_ausente: { text: 'Treino',    cor: 'bg-orange text-off-white'  },
  aula_cancelada: { text: 'Cancelada', cor: 'bg-red text-white'         },
}

// ── Links de acesso rápido ─────────────────────────────────────
const QUICK = [
  { icon: '📅', label: 'Agenda',  href: '/pages/professor/agenda'     },
  { icon: '🏋️', label: 'Treinos', href: '/pages/professor/treinos'    },
  { icon: '💰', label: 'Pagamentos', href: '/pages/professor/pagamentos' },
]

export default async function ProfessorHomePage() {

  const profile  = await requireAuth()
  const supabase = await createClient()

  const agora   = new Date()
  const hojeISO = agora.toISOString().split('T')[0]

  // Saudação com data real
  const dataLabel = agora.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const dataCapitalizada = dataLabel.charAt(0).toUpperCase() + dataLabel.slice(1)

  // ── Três queries em paralelo ────────────────────────────────
  const em7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const ha7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [avisosResult, aulasResult, checkinsResult] = await Promise.all([

    // 1. Avisos dinâmicos via função SQL (3A.4)
    supabase
      .rpc('get_avisos_professor')
      .returns<AvisoProfessor[]>(),

    // 2. Próximas 5 aulas do professor (próximos 7 dias)
    //    Inclui inscricoes apenas com id para contar sem buscar dados
    supabase
      .from('aulas')
      .select(`
        id, nome, emoji, inicio, local,
        inscricoes ( id )
      `)
      .eq('instrutor_id', profile.id)
      .eq('status', 'agendada')
      .gte('inicio', agora.toISOString())
      .lte('inicio', em7Dias)
      .order('inicio', { ascending: true })
      .limit(5),

    // 3. Check-ins recentes via aluno_xp_log (últimos 7 dias)
    //    Fonte mais confiável que inscricoes.presente — cada presença
    //    gera um registro imutável com criado_em preciso.
    supabase
      .from('aluno_xp_log')
      .select(`
        id, criado_em,
        profiles!aluno_xp_log_aluno_id_fkey ( nome )
      `)
      .eq('origem', 'presenca')
      .gte('criado_em', ha7Dias)
      .order('criado_em', { ascending: false })
      .limit(5),
  ])

  const avisos          = (avisosResult.data  ?? []) as AvisoProfessor[]
  const proximasAulas   = aulasResult.data    ?? []
  const checkinsRecentes = checkinsResult.data ?? []

  // ── KPIs derivados dos dados já buscados — sem queries extras ─
  const aulasHoje = proximasAulas.filter((a) => a.inicio.startsWith(hojeISO))

  const totalInscritosHoje = aulasHoje.reduce(
    (s, a) => s + (Array.isArray(a.inscricoes) ? a.inscricoes.length : 0),
    0
  )

  const proximaAula = proximasAulas[0] ?? null

  const kpis = [
    {
      icon:  '📅',
      valor: String(aulasHoje.length),
      label: 'Aulas hoje',
      delta: proximaAula && !aulasHoje.length
        ? `Próxima: ${new Date(proximaAula.inicio).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}`
        : aulasHoje.length > 0
          ? `Próxima: ${new Date(aulasHoje[0].inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Sem aulas hoje',
      cor: 'text-gray-mid',
    },
    {
      icon:  '🤸',
      valor: String(totalInscritosHoje),
      label: 'Alunos esperados',
      delta: totalInscritosHoje > 0 ? 'Nas aulas de hoje' : 'Sem inscritos hoje',
      cor:   'text-chumbo',
    },
    {
      icon:  '🔔',
      valor: String(avisos.length),
      label: 'Avisos pendentes',
      delta: avisos.some((a) => a.urgente) ? '⚠️ Urgente' : avisos.length > 0 ? 'Verificar abaixo' : 'Tudo em ordem',
      cor:   avisos.some((a) => a.urgente) ? 'text-red' : avisos.length > 0 ? 'text-orange-dk' : 'text-chumbo',
    },
    {
      icon:  '✅',
      valor: String(checkinsRecentes.length),
      label: 'Check-ins na semana',
      delta: 'Últimos 7 dias',
      cor:   'text-gray-mid',
    },
  ]

  return (
    <>
      <PageHeader
        title="Painel do Professor 🎭"
        subtitle={`Bem-vindo, ${profile.nome}. ${dataCapitalizada}.`}
      />

      {/* KPIs reais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {kpis.map((k) => (
          <Card key={k.label}>
            <span className="text-3xl block mb-3">{k.icon}</span>
            <p
              className="text-[28px] font-extrabold text-gray-dark leading-none"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {k.valor}
            </p>
            <p className="text-xs text-gray-mid mt-1">{k.label}</p>
            <p className={`text-xs font-semibold mt-2 ${k.cor}`}>{k.delta}</p>
          </Card>
        ))}
      </div>

      {/* Avisos + Próximas aulas + Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 mb-5">

        {/* Painel de avisos — função SQL get_avisos_professor */}
        <Card>
          <CardTitle>Avisos Importantes</CardTitle>

          {avisos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-3xl opacity-30">🎉</span>
              <p className="text-sm text-gray-mid">Nenhum aviso pendente. Tudo em ordem!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {avisos.map((a) => {
                const badge = AVISO_BADGE[a.tipo]
                return (
                  <div
                    key={a.ref_id}
                    className={`rounded-xl p-3 flex items-start gap-3 ${AVISO_COR[a.tipo] ?? 'bg-gray-bg border-l-4 border-gray-mid'}`}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {AVISO_ICONE[a.tipo] ?? '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-dark">
                        {a.urgente && <span className="text-red mr-1">●</span>}
                        {a.titulo}
                      </p>
                      {a.corpo && (
                        <p className="text-xs text-gray-mid mt-0.5 leading-relaxed">{a.corpo}</p>
                      )}
                    </div>
                    {badge && (
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${badge.cor}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Coluna direita: próximas aulas + acesso rápido */}
        <div className="flex flex-col gap-5">

          {/* Próximas aulas */}
          <Card>
            <CardTitle>Próximas Aulas</CardTitle>

            {proximasAulas.length === 0 ? (
              <p className="text-sm text-gray-mid text-center py-4">
                Nenhuma aula nos próximos 7 dias.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-bg">
                {proximasAulas.map((a) => {
                  const inscritos = Array.isArray(a.inscricoes) ? a.inscricoes.length : 0
                  const dataHora  = new Date(a.inicio)
                  const isHoje    = a.inicio.startsWith(hojeISO)
                  return (
                    <div key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center
                                   text-base flex-shrink-0"
                        style={{ background: 'rgba(33,29,28,.07)' }}
                      >
                        {a.emoji ?? '🎪'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-dark truncate">{a.nome}</p>
                        <p className="text-xs text-gray-mid mt-0.5">
                          {isHoje ? 'Hoje' : formatDataCurta(dataHora)}
                          {' · '}
                          {dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {a.local ? ` · ${a.local}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-mid flex-shrink-0">
                        {inscritos} aluno{inscritos !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Acesso Rápido */}
          <Card>
            <CardTitle>Acesso Rápido</CardTitle>
            <div className="grid grid-cols-3 gap-2">
              {QUICK.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl
                             bg-gray-bg hover:bg-white hover:border hover:border-chumbo/15
                             hover:-translate-y-0.5 transition-all no-underline"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] font-bold text-gray-mid text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Check-ins recentes */}
      <Card>
        <CardTitle>Check-ins da Semana</CardTitle>

        {checkinsRecentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <span className="text-3xl opacity-30">📋</span>
            <p className="text-sm text-gray-mid">
              Nenhum check-in nos últimos 7 dias.
              Marque presenças na tela de Agenda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {checkinsRecentes.map((c) => {
              const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
              const nomeAluno  = prof?.nome ?? 'Aluno'
              const dataCheckin = new Date(c.criado_em)

              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 bg-green-light/15
                             rounded-xl border border-green-light/30"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center
                               text-xs font-bold text-off-white flex-shrink-0"
                    style={{ background: avatarColorByName(nomeAluno) }}
                  >
                    {iniciais(nomeAluno)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-dark truncate">
                      {nomeAluno}
                    </p>
                    <p className="text-[11px] text-gray-mid">
                      ✅ {formatDataCurta(dataCheckin)}
                      {' · '}
                      {dataCheckin.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}
