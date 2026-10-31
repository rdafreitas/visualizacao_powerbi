// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/perfil/page.tsx
//
// Server Component puro — sem 'use client', sem useState.
// Perfil do aluno: dados pessoais, matrícula, evolução e ranking.
//
// CINCO FONTES DE DADOS EM PARALELO:
//   1. requireAuth()           → dados pessoais
//   2. matriculas + planos     → contrato ativo
//   3. aluno_habilidades COUNT → quantidade de habilidades
//   4. inscricoes (presença)   → taxa de presença do mês
//   5. profiles (xp_total)     → ranking entre alunos
// ─────────────────────────────────────────────────────────────

import { requireAuth }   from '@/(auth)/session'
import { createClient }  from '@/lib/supabase/server'
import { PageHeader }    from '@/components/layout/PageHeader'
import { Card }          from '@/components/ui/Card'
import {
  iniciais,
  avatarColorByName,
  formatBRL,
  formatDataCurta,
} from '@/lib/utils'

export const metadata = { title: 'Perfil — Andorin' }

// ── Cálculo de nível a partir do XP ───────────────────────────
// Definido fora do componente — pode ser movido para lib/utils.ts
// quando outras telas precisarem exibir o nível do aluno.
function calcularNivel(xp: number): { nivel: number; label: string } {
  if (xp >= 500) return { nivel: 5, label: 'Mestre'        }
  if (xp >= 200) return { nivel: 4, label: 'Avançado'      }
  if (xp >= 100) return { nivel: 3, label: 'Intermediário' }
  if (xp >=  50) return { nivel: 2, label: 'Iniciante+'    }
  return           { nivel: 1, label: 'Iniciante'      }
}

// ── Badge de posição no ranking ───────────────────────────────
function medalha(pos: number): string {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return ''
}

export default async function AlunoPerfilPage() {

  const profile  = await requireAuth()
  const supabase = await createClient()

  const agora    = new Date()
  const mesAtual = agora.toISOString().substring(0, 7)  // 'YYYY-MM'
  const inicioMes = `${mesAtual}-01T00:00:00`
  const mesLabel  = agora.toLocaleDateString('pt-BR', { month: 'long' })
  const mesCapit  = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)

  // ── Queries em paralelo ─────────────────────────────────────
  const [
    matriculaResult,
    habilidadesResult,
    inscricoesMesResult,
    presentesMesResult,
    rankingResult,
  ] = await Promise.all([

    // 1. Matrícula ativa com dados do plano
    // maybeSingle() retorna null sem erro se não houver matrícula
    supabase
      .from('matriculas')
      .select(`
        id, status, inicio, vencimento,
        planos!matriculas_plano_id_fkey ( nome, valor, max_modal )
      `)
      .eq('aluno_id', profile.id)
      .in('status', ['ativo', 'experimental'])
      .order('inicio', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // 2. Contagem de habilidades do aluno — head:true = COUNT sem linhas
    supabase
      .from('aluno_habilidades')
      .select('*', { count: 'exact', head: true })
      .eq('aluno_id', profile.id),

    // 3. Total de inscrições do mês (para taxa de presença)
    supabase
      .from('inscricoes')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', profile.id)
      .eq('lista_espera', false),

    // 4. Total de presenças confirmadas do mês
    supabase
      .from('inscricoes')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', profile.id)
      .eq('presente', true)
      .eq('lista_espera', false),

    // 5. Todos os alunos ordenados por XP — para calcular posição do ranking
    supabase
      .from('profiles')
      .select('id, xp_total')
      .eq('role', 'aluno')
      .order('xp_total', { ascending: false }),
  ])

  // ── Processamento ───────────────────────────────────────────

  const matricula = matriculaResult.data
  const plano = matricula
    ? (Array.isArray(matricula.planos) ? matricula.planos[0] : matricula.planos)
    : null

  const totalHabilidades = habilidadesResult.count  ?? 0
  const totalInscricoes  = inscricoesMesResult.count ?? 0
  const totalPresentes   = presentesMesResult.count  ?? 0

  const taxaPresenca = totalInscricoes > 0
    ? Math.round((totalPresentes / totalInscricoes) * 100)
    : 0

  // Posição no ranking: findIndex retorna 0 para o 1º → +1 para 1-based
  const rankingAlunos   = rankingResult.data ?? []
  const posicaoRanking  = rankingAlunos.findIndex((p) => p.id === profile.id) + 1
  const totalAlunos     = rankingAlunos.length

  // Nível baseado no XP acumulado
  const { nivel, label: labelNivel } = calcularNivel(profile.xpTotal)

  // ── Dados cadastrais dinâmicos ─────────────────────────────
  const dadosCadastrais = [
    {
      label: 'E-mail',
      valor: profile.email || '—',
      destaque: false,
    },
    {
      label: 'Telefone',
      valor: profile.telefone ?? 'Não cadastrado',
      destaque: false,
    },
    {
      label: 'Aluno(a) desde',
      valor: profile.createdAt
        ? formatDataCurta(new Date(profile.createdAt))
        : '—',
      destaque: false,
    },
    {
      label: 'Plano atual',
      valor: plano
        ? `${plano.nome} · ${formatBRL(plano.valor)}/mês`
        : 'Sem matrícula ativa',
      destaque: false,
    },
    {
      label: 'Status',
      valor: matricula
        ? matricula.status === 'ativo' ? '✅ Ativo' : '🎟️ Experimental'
        : '—',
      destaque: false,
    },
    {
      label: 'Vencimento',
      valor: matricula?.vencimento
        ? formatDataCurta(new Date(matricula.vencimento))
        : '—',
      destaque: !!matricula?.vencimento,   // laranja se existir
    },
  ]

  // ── Cards de resumo de evolução ────────────────────────────
  const resumo = [
    {
      emoji: '🥋',
      valor: `Nível ${nivel}`,
      label: labelNivel,
      cor:   'text-bordo',
    },
    {
      emoji: '✨',
      valor: String(profile.xpTotal),
      label: 'XP total',
      cor:   'text-orange-dk',
    },
    {
      emoji: '💪',
      valor: String(totalHabilidades),
      label: 'Habilidades',
      cor:   'text-chumbo',
    },
    {
      emoji: '📅',
      valor: `${taxaPresenca}%`,
      label: `Presença ${mesCapit}`,
      cor:   taxaPresenca >= 75 ? 'text-chumbo' : 'text-orange-dk',
    },
  ]

  return (
    <>
      <PageHeader title="Perfil" subtitle={profile.email} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 items-start">

        {/* Card principal — dados do aluno */}
        <Card>
          {/* Avatar + nome + chips */}
          <div className="flex items-center gap-5 pb-6 border-b border-gray-bg mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center
                         text-2xl font-extrabold text-off-white flex-shrink-0"
              style={{
                fontFamily: 'var(--font-montserrat)',
                background: avatarColorByName(profile.nome),
              }}
            >
              {iniciais(profile.nome)}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-xl font-extrabold text-gray-dark truncate"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {profile.nome}
              </p>
              <p className="text-sm text-gray-mid mt-1 truncate">{profile.email}</p>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Chip de plano — dados reais */}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-bordo/10 text-bordo">
                  🤸 {plano ? `Plano ${plano.nome}` : 'Sem matrícula'}
                </span>
                {/* Chip de nível — calculado do XP real */}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-bordo/8 text-bordo">
                  🥋 Nível {nivel}
                </span>
              </div>
            </div>
          </div>

          {/* Dados cadastrais */}
          <p
            className="text-sm font-bold text-gray-dark mb-3"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            Dados cadastrais
          </p>
          <div className="flex flex-col divide-y divide-gray-bg">
            {dadosCadastrais.map(({ label, valor, destaque }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid font-medium flex-shrink-0 mr-3">
                  {label}
                </span>
                <span
                  className={`text-sm font-semibold text-right max-w-[60%] truncate ${
                    destaque ? 'text-orange-dk font-bold' : 'text-gray-dark'
                  }`}
                >
                  {valor}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-4">

          {/* Card de evolução — dados reais de XP e habilidades */}
          <Card>
            <p
              className="text-sm font-bold text-gray-dark mb-4"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              Resumo de evolução
            </p>
            <div className="grid grid-cols-2 gap-3">
              {resumo.map(({ emoji, valor, label, cor }) => (
                <div key={label} className="bg-gray-bg rounded-xl p-3.5 text-center">
                  <span className="text-xl block mb-1">{emoji}</span>
                  <p
                    className={`text-xl font-extrabold ${cor}`}
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {valor}
                  </p>
                  <p className="text-[10px] text-gray-mid mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Card de ranking — posição real entre alunos por XP */}
          <Card>
            <p
              className="text-sm font-bold text-gray-dark mb-3"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              Posição no ranking
            </p>

            {totalAlunos === 0 ? (
              <p className="text-xs text-gray-mid text-center py-3">
                Nenhum dado de ranking disponível.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-bg">
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-mid">Ranking geral</span>
                  <span className="text-sm font-extrabold text-orange-dk">
                    {posicaoRanking > 0
                      ? `${posicaoRanking}° lugar ${medalha(posicaoRanking)}`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-mid">Total de alunos</span>
                  <span className="text-sm font-semibold text-gray-dark">
                    {totalAlunos}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-mid">XP acumulado</span>
                  <span className="text-sm font-extrabold text-orange-dk">
                    {profile.xpTotal} pts
                  </span>
                </div>
              </div>
            )}
          </Card>

        </div>
      </div>
    </>
  )
}
