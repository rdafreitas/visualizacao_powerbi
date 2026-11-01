// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/evolucao/page.tsx
//
// Server Component puro — sem 'use client', sem useState.
// Dados de evolução são históricos — leitura pura.
//
// FONTES DE DADOS EM PARALELO:
//   1. aluno_habilidades + habilidades → habilidades desenvolvidas
//   2. aluno_xp_log (presença/avaliação) → histórico de ganhos de XP
//   3. aluno_conquistas + conquistas → conquistas desbloqueadas
//
// XP e nível calculados de profile.xpTotal (atualizado pelos triggers).
// Barra de progresso mostra % dentro do nível atual — não XP total.
// ─────────────────────────────────────────────────────────────

import { requireAuth }  from '@/(auth)/session'
import { createClient } from '@/lib/supabase/server'
import { PageHeader }   from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { formatDataCurta } from '@/lib/utils'

export const metadata = { title: 'Evolução — Andorin' }

// ── Tabela de níveis — mesma lógica do perfil e da home ──────
const TABELA_NIVEIS: {
  nivel: number
  emoji: string
  nome:  string
  xpMin: number
  xpMax: number | null
}[] = [
  { nivel: 1, emoji: '🌱', nome: 'Aprendiz',      xpMin: 0,   xpMax: 49  },
  { nivel: 2, emoji: '⚡', nome: 'Iniciante+',    xpMin: 50,  xpMax: 99  },
  { nivel: 3, emoji: '🥋', nome: 'Intermediário', xpMin: 100, xpMax: 199 },
  { nivel: 4, emoji: '🔥', nome: 'Avançado',      xpMin: 200, xpMax: 499 },
  { nivel: 5, emoji: '🏆', nome: 'Mestre',        xpMin: 500, xpMax: null },
]

function calcularNivelCompleto(xp: number) {
  const tabela = [...TABELA_NIVEIS].reverse()
  const entrada = tabela.find((n) => xp >= n.xpMin) ?? TABELA_NIVEIS[0]
  return entrada
}

// ── Componente de bolinhas de nível ──────────────────────────
function NivelDots({ nivel, max = 5 }: { nivel: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < nivel ? 'bg-bordo' : 'bg-black/10'}`}
        />
      ))}
    </div>
  )
}

export default async function AlunoEvolucaoPage() {

  const profile  = await requireAuth()
  const supabase = await createClient()
  const mesAtual = new Date().toISOString().substring(0, 7)  // 'YYYY-MM'

  // ── Queries em paralelo ─────────────────────────────────────
  const [habilidadesResult, xpLogResult, conquistasResult] = await Promise.all([

    // 1. Habilidades do aluno com dados da habilidade
    supabase
      .from('aluno_habilidades')
      .select(`
        nivel_atual, atualizado_em,
        habilidades!aluno_habilidades_habilidade_id_fkey (
          nome, emoji, modalidade
        )
      `)
      .eq('aluno_id', profile.id)
      .order('nivel_atual',   { ascending: false })
      .order('atualizado_em', { ascending: false }),

    // 2. Histórico de XP — presença e avaliação (últimos 15 eventos)
    supabase
      .from('aluno_xp_log')
      .select(`
        id, xp_ganho, origem, descricao, criado_em, referencia_id,
        inscricoes!aluno_xp_log_referencia_id_fkey (
          presente,
          aulas!inscricoes_aula_id_fkey ( nome, emoji, inicio, local )
        )
      `)
      .eq('aluno_id', profile.id)
      .in('origem', ['presenca', 'avaliacao'])
      .order('criado_em', { ascending: false })
      .limit(15),

    // 3. Conquistas desbloqueadas (últimas 5)
    supabase
      .from('aluno_conquistas')
      .select(`
        desbloqueado_em,
        conquistas!aluno_conquistas_conquista_id_fkey (
          nome, descricao, emoji, tipo
        )
      `)
      .eq('aluno_id', profile.id)
      .order('desbloqueado_em', { ascending: false })
      .limit(5),
  ])

  // ── Processamento ───────────────────────────────────────────

  const xpAtual = profile.xpTotal
  const nivelInfo = calcularNivelCompleto(xpAtual)

  // Barra de progresso dentro do nível atual
  const pctNivel = nivelInfo.xpMax === null
    ? 100   // Mestre — barra cheia
    : Math.min(100, Math.round(
        ((xpAtual - nivelInfo.xpMin) / (nivelInfo.xpMax + 1 - nivelInfo.xpMin)) * 100
      ))

  // Habilidades normalizadas
  const habilidades = (habilidadesResult.data ?? []).map((h) => {
    const hab = Array.isArray(h.habilidades) ? h.habilidades[0] : h.habilidades
    return {
      nome:          hab?.nome        ?? 'Habilidade',
      emoji:         hab?.emoji       ?? '💪',
      modalidade:    hab?.modalidade  ?? null,
      nivelAtual:    h.nivel_atual,
      atualizadoEm:  h.atualizado_em,
      isNova:        h.atualizado_em?.startsWith(mesAtual),
    }
  })

  const habilidadesTop   = habilidades.filter((h) => h.nivelAtual >= 3).slice(0, 6)
  const habilidadesNovas = habilidades
    .filter((h) => h.isNova && h.nivelAtual < 3)
    .slice(0, 6)
  const todasHabilidades = habilidades

  // Histórico de XP normalizado
  const historico = (xpLogResult.data ?? []).map((entry) => {
    const insc = Array.isArray(entry.inscricoes) ? entry.inscricoes[0] : entry.inscricoes
    const aula = insc ? (Array.isArray(insc.aulas) ? insc.aulas[0] : insc.aulas) : null
    return {
      id:       entry.id,
      xpGanho:  entry.xp_ganho,
      origem:   entry.origem as 'presenca' | 'avaliacao',
      descricao:entry.descricao,
      criadoEm: entry.criado_em,
      aulaNome: aula?.nome    ?? null,
      aulaEmoji:aula?.emoji   ?? null,
      aulaInicio:aula?.inicio ?? null,
      presente: insc?.presente ?? false,
    }
  })

  // Estatísticas do mês a partir do xp_log
  const logMes       = historico.filter((e) => e.criadoEm.startsWith(mesAtual))
  const presencasMes = logMes.filter((e) => e.origem === 'presenca').length
  const avalMes      = logMes.filter((e) => e.origem === 'avaliacao').length

  // Conquistas
  const conquistas = (conquistasResult.data ?? []).map((c) => {
    const con = Array.isArray(c.conquistas) ? c.conquistas[0] : c.conquistas
    return {
      nome:            con?.nome       ?? 'Conquista',
      descricao:       con?.descricao  ?? null,
      emoji:           con?.emoji      ?? '🏆',
      tipo:            con?.tipo       ?? 'especial',
      desbloqueadoEm:  c.desbloqueado_em,
    }
  })

  return (
    <>
      <PageHeader
        title="Minha Evolução 🏅"
        subtitle="Acompanhe seu progresso, habilidades e conquistas."
      />

      {/* ── Widget de XP — dados reais ── */}
      <div
        className="rounded-2xl p-7 mb-6 flex flex-wrap gap-8 items-start relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #211D1C, #7A1D2C, #a02438)' }}
      >
        {/* Nível + ícone */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <span
            className="text-5xl"
            style={{ filter: 'drop-shadow(0 4px 16px rgba(242,116,6,.5))' }}
          >
            {nivelInfo.emoji}
          </span>
          <div>
            <p
              className="text-xl font-extrabold text-white"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              Nível {nivelInfo.nivel} · {nivelInfo.nome}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(244,231,206,.5)' }}>
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* XP + barra de progresso */}
        <div className="flex-1 min-w-[200px]">
          <p
            className="text-4xl font-extrabold leading-none mb-3"
            style={{ color: '#f27406', fontFamily: 'var(--font-montserrat)' }}
          >
            {xpAtual} XP
          </p>

          {/* Barra: % dentro do nível atual */}
          <div className="h-2.5 rounded-full overflow-hidden mb-1.5"
            style={{ background: 'rgba(255,255,255,.15)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width:      `${pctNivel}%`,
                background: 'linear-gradient(90deg, #f27406, #F4E7CE)',
              }}
            />
          </div>

          <div
            className="flex justify-between text-[10px] font-semibold mb-4"
            style={{ color: 'rgba(244,231,206,.4)' }}
          >
            <span>{nivelInfo.emoji} Nível {nivelInfo.nivel} · {nivelInfo.xpMin} XP</span>
            {nivelInfo.xpMax !== null
              ? <span>
                  {TABELA_NIVEIS[nivelInfo.nivel]?.emoji ?? '🏆'} Nível {nivelInfo.nivel + 1} · {nivelInfo.xpMax + 1} XP
                </span>
              : <span>🏆 Nível máximo</span>
            }
          </div>

          {/* Estatísticas do mês */}
          <div className="flex gap-5 flex-wrap">
            {[
              { icon: '📅', val: `${presencasMes} presenças`, pts: `este mês` },
              { icon: '⭐', val: `${avalMes} avaliações`,     pts: `este mês` },
              { icon: '💪', val: `${todasHabilidades.length} habilidades`, pts: `total` },
            ].map(({ icon, val, pts }) => (
              <div key={val} className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <div>
                  <p className="text-xs font-bold text-white leading-none">{val}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(244,231,206,.5)' }}>{pts}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">

        <div className="flex flex-col gap-5">

          {/* Novas habilidades do mês — dados reais */}
          {habilidadesNovas.length > 0 && (
            <Card>
              <CardTitle>✨ Novas habilidades — {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</CardTitle>
              <div className="flex flex-col gap-2">
                {habilidadesNovas.map((h) => (
                  <div key={h.nome}
                    className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.06]
                               hover:border-bordo/20 hover:bg-off-white/40 transition-all">
                    <span className="text-xl">{h.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-dark">{h.nome}</p>
                      {h.modalidade && <p className="text-xs text-gray-mid">{h.modalidade}</p>}
                    </div>
                    <NivelDots nivel={h.nivelAtual} />
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-dk text-off-white flex-shrink-0">
                      Nova!
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Principais habilidades — nível 3+ */}
          {habilidadesTop.length > 0 ? (
            <Card>
              <CardTitle>🏆 Principais habilidades</CardTitle>
              <div className="flex flex-col gap-2">
                {habilidadesTop.map((h) => (
                  <div key={h.nome}
                    className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.06]
                               hover:border-bordo/20 hover:bg-off-white/40 transition-all">
                    <span className="text-xl">{h.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-dark">{h.nome}</p>
                      {h.modalidade && <p className="text-xs text-gray-mid">{h.modalidade}</p>}
                    </div>
                    <NivelDots nivel={h.nivelAtual} />
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <CardTitle>🏆 Principais habilidades</CardTitle>
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <span className="text-3xl opacity-30">💪</span>
                <p className="text-sm text-gray-mid text-center">
                  Nenhuma habilidade de nível 3+ ainda.
                  Continue frequentando as aulas!
                </p>
              </div>
            </Card>
          )}

          {/* Histórico de aulas — dados reais de aluno_xp_log */}
          <Card>
            <CardTitle>📋 Histórico recente</CardTitle>
            {historico.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <span className="text-3xl opacity-30">📋</span>
                <p className="text-sm text-gray-mid text-center">
                  Nenhum registro ainda. Inscreva-se em aulas para começar.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {historico.map((entry) => (
                  <div key={entry.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-black/[0.06]
                               hover:border-bordo/20 hover:bg-off-white/40 transition-all">
                    <span className="text-xl mt-0.5">
                      {entry.origem === 'avaliacao' ? '⭐' : (entry.aulaEmoji ?? '🎪')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-dark">
                        {entry.aulaNome ?? (entry.origem === 'avaliacao' ? 'Avaliação' : 'Aula')}
                      </p>
                      <p className="text-xs text-gray-mid">
                        {entry.aulaInicio
                          ? formatDataCurta(new Date(entry.aulaInicio)) +
                            ' · ' + new Date(entry.aulaInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : formatDataCurta(new Date(entry.criadoEm))
                        }
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* XP ganho */}
                      <span className="text-xs font-bold text-orange-dk">
                        +{entry.xpGanho} XP
                      </span>
                      {/* Status de presença */}
                      {entry.origem === 'presenca' && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          entry.presente
                            ? 'bg-green-light/40 text-chumbo'
                            : 'bg-gray-bg text-gray-mid'
                        }`}>
                          {entry.presente ? '✓ Presente' : 'Falta'}
                        </span>
                      )}
                      {entry.origem === 'avaliacao' && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange/15 text-orange-dk">
                          ⭐ Avaliação
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-5">

          {/* Conquistas — dados reais */}
          <Card>
            <CardTitle>🏅 Conquistas</CardTitle>
            {conquistas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <span className="text-3xl opacity-30">🏅</span>
                <p className="text-xs text-gray-mid text-center">
                  Nenhuma conquista ainda. Continue evoluindo!
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-bg">
                {conquistas.map((c) => (
                  <div key={c.nome} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-bg flex items-center justify-center text-xl flex-shrink-0">
                      {c.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-dark truncate">{c.nome}</p>
                      <p className="text-xs text-gray-mid mt-0.5">
                        {formatDataCurta(new Date(c.desbloqueadoEm))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tabela de níveis — nível atual destacado */}
          <Card>
            <CardTitle>Tabela de níveis</CardTitle>
            <div className="flex flex-col gap-2">
              {TABELA_NIVEIS.map((n) => {
                const isCurrent = n.nivel === nivelInfo.nivel
                return (
                  <div
                    key={n.nivel}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-bordo/8 border border-bordo/20'
                        : 'bg-gray-bg'
                    }`}
                  >
                    <span className="text-lg w-7 text-center">{n.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-dark">
                        Nível {n.nivel} · {n.nome}
                      </p>
                      <p className="text-[10px] text-gray-mid">
                        {n.xpMax !== null
                          ? `${n.xpMin}–${n.xpMax} XP`
                          : `${n.xpMin}+ XP`}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-bordo text-off-white flex-shrink-0">
                        Você está aqui
                      </span>
                    )}
                    {xpAtual > (n.xpMax ?? Infinity) && (
                      <span className="text-[9px] font-bold text-gray-mid">✓</span>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-gray-mid mt-3 border-t border-gray-bg pt-3">
              XP ganho por presença (+10) e avaliações (+5 a +10).
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}
