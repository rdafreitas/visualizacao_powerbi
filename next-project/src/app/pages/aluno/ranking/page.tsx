// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/ranking/page.tsx
//
// Server Component puro — ranking de todos os alunos por XP.
// Sem 'use client', sem useState.
//
// DADOS BUSCADOS:
//   profiles WHERE role='aluno' ORDER BY xp_total DESC
//   Apenas id, nome, xp_total — campos mínimos sem dados sensíveis.
//
// RLS: "autenticados leem profiles" — projetado para o ranking.
// Qualquer aluno autenticado pode ler os profiles dos outros.
// E-mail e telefone NÃO são exibidos — privacidade mantida.
//
// DESTAQUE DO ALUNO LOGADO:
//   A própria linha tem fundo bordo/8 + badge "Você".
//   "Distância para o próximo" exibida acima do ranking.
// ─────────────────────────────────────────────────────────────

import { requireAuth }   from '@/(auth)/session'
import { createClient }  from '@/lib/supabase/server'
import { PageHeader }    from '@/components/layout/PageHeader'
import { Card }          from '@/components/ui/Card'
import { iniciais, avatarColorByName } from '@/lib/utils'

export const metadata = { title: 'Ranking — Andorin' }

// ── Nível e emoji a partir do XP ─────────────────────────────
function nivelLabel(xp: number): { emoji: string; label: string } {
  if (xp >= 500) return { emoji: '🏆', label: 'Mestre'        }
  if (xp >= 200) return { emoji: '🔥', label: 'Avançado'      }
  if (xp >= 100) return { emoji: '🥋', label: 'Intermediário' }
  if (xp >=  50) return { emoji: '⚡', label: 'Iniciante+'    }
  return           { emoji: '🌱', label: 'Aprendiz'       }
}

// ── Medalhas para o top 3 ─────────────────────────────────────
function medalha(pos: number): string {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return ''
}

export default async function AlunoRankingPage() {

  const profile  = await requireAuth()
  const supabase = await createClient()

  // Campos mínimos — sem e-mail, sem telefone (privacidade)
  const { data: rankingData, error } = await supabase
    .from('profiles')
    .select('id, nome, xp_total')
    .eq('role', 'aluno')
    .order('xp_total', { ascending: false })

  const ranking = rankingData ?? []

  // Posição do aluno logado no ranking
  const posicaoAluno = ranking.findIndex((p) => p.id === profile.id) + 1
  const meuXP        = profile.xpTotal

  // Aluno à frente no ranking (posição anterior) — para "distância para subir"
  const alunoAFrente = posicaoAluno > 1 ? ranking[posicaoAluno - 2] : null
  const xpParaSubir  = alunoAFrente ? alunoAFrente.xp_total - meuXP : 0

  // Aluno atrás — para motivar quem está perto de perder posição
  const alunoAtras   = posicaoAluno < ranking.length ? ranking[posicaoAluno] : null
  const xpDeVantagem = alunoAtras ? meuXP - alunoAtras.xp_total : null

  const { emoji: meEmoji, label: meuLabel } = nivelLabel(meuXP)

  return (
    <>
      <PageHeader
        title="Ranking 🏅"
        subtitle="Classificação dos alunos por XP acumulado."
      />

      {/* Card da posição do aluno logado */}
      <div
        className="rounded-2xl p-6 mb-6 flex items-center justify-between gap-5 flex-wrap"
        style={{ background: 'linear-gradient(135deg, #211D1C, #7A1D2C)' }}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center
                       text-xl font-extrabold text-off-white flex-shrink-0"
            style={{
              fontFamily: 'var(--font-montserrat)',
              background: avatarColorByName(profile.nome),
            }}
          >
            {iniciais(profile.nome)}
          </div>

          <div>
            <p
              className="text-lg font-extrabold text-white"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {posicaoAluno > 0 ? `${posicaoAluno}° lugar ${medalha(posicaoAluno)}` : '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(244,231,206,.55)' }}>
              {meEmoji} {meuLabel} · {meuXP} XP
            </p>
          </div>
        </div>

        {/* Distância motivacional */}
        <div className="text-right flex-shrink-0">
          {posicaoAluno === 1 ? (
            <div>
              <p className="text-sm font-bold text-orange">🏆 Líder do ranking!</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(244,231,206,.45)' }}>
                Mantenha a frequência para defender a posição.
              </p>
            </div>
          ) : xpParaSubir > 0 ? (
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(244,231,206,.5)' }}>
                Para subir para {posicaoAluno - 1}°
              </p>
              <p
                className="text-2xl font-extrabold"
                style={{ color: '#f27406', fontFamily: 'var(--font-montserrat)' }}
              >
                +{xpParaSubir} XP
              </p>
              {xpDeVantagem !== null && (
                <p className="text-xs mt-1" style={{ color: 'rgba(244,231,206,.35)' }}>
                  {xpDeVantagem} XP de vantagem para {posicaoAluno + 1}°
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Estado: nenhum aluno */}
      {ranking.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="text-4xl opacity-30">🏅</span>
            <p className="text-sm text-gray-mid">
              Nenhum aluno no ranking ainda.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">

          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-3 px-6 py-3 border-b border-gray-bg">
            <p className="text-[10px] font-bold text-gray-mid uppercase tracking-wide">#</p>
            <p className="text-[10px] font-bold text-gray-mid uppercase tracking-wide">Aluno</p>
            <p className="text-[10px] font-bold text-gray-mid uppercase tracking-wide">Nível</p>
            <p className="text-[10px] font-bold text-gray-mid uppercase tracking-wide text-right">XP</p>
          </div>

          {/* Lista de alunos */}
          <div className="divide-y divide-gray-bg">
            {ranking.map((aluno, idx) => {
              const pos   = idx + 1
              const isMe  = aluno.id === profile.id
              const nivel = nivelLabel(aluno.xp_total)
              const medal = medalha(pos)

              return (
                <div
                  key={aluno.id}
                  className={[
                    'grid grid-cols-[3rem_1fr_auto_auto] items-center gap-3 px-6 py-4',
                    'transition-colors',
                    isMe
                      ? 'bg-bordo/8 border-l-4 border-bordo'
                      : 'hover:bg-gray-bg/50',
                  ].join(' ')}
                >
                  {/* Posição */}
                  <div className="flex items-center">
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span
                        className="text-sm font-extrabold text-gray-mid"
                        style={{ fontFamily: 'var(--font-montserrat)' }}
                      >
                        {pos}
                      </span>
                    )}
                  </div>

                  {/* Avatar + Nome */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center
                                 text-xs font-bold text-off-white flex-shrink-0"
                      style={{ background: avatarColorByName(aluno.nome) }}
                    >
                      {iniciais(aluno.nome)}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold text-gray-dark truncate"
                        style={{ fontFamily: isMe ? 'var(--font-montserrat)' : undefined }}
                      >
                        {aluno.nome}
                      </p>
                      {isMe && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-bordo text-off-white">
                          Você
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nível */}
                  <span className="text-xs text-gray-mid whitespace-nowrap">
                    {nivel.emoji} {nivel.label}
                  </span>

                  {/* XP */}
                  <p
                    className="text-sm font-extrabold text-right text-chumbo"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {aluno.xp_total}
                    <span className="text-[10px] font-normal text-gray-mid ml-0.5">XP</span>
                  </p>
                </div>
              )
            })}
          </div>

          {/* Rodapé */}
          <div className="px-6 py-3 border-t border-gray-bg bg-gray-bg/40">
            <p className="text-[11px] text-gray-mid">
              {ranking.length} aluno{ranking.length !== 1 ? 's' : ''} ·
              XP ganho por presença (+10) e avaliações (+5 a +10)
            </p>
          </div>
        </Card>
      )}
    </>
  )
}
