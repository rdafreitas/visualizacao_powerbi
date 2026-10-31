// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/home/page.tsx
//
// Server Component assíncrono — busca todos os dados em paralelo
// e passa como props para AlunoHomeClient (interatividade).
//
// DADOS BUSCADOS EM PARALELO:
//   1. Inscrições da semana do aluno (aulas + instrutor)
//   2. Todas as aulas da semana (para "disponíveis para você")
//   3. Última aula com presença sem avaliação (slot de avaliação)
//   4. Ranking (profiles ORDER BY xp_total)
//   5. Habilidades do aluno (COUNT)
//   6. Taxa de presença do mês (dois COUNTs)
// ─────────────────────────────────────────────────────────────

import { requireAuth }      from '@/(auth)/session'
import { createClient }     from '@/lib/supabase/server'
import { AlunoHomeClient }  from './AlunoHomeClient'

export const metadata = { title: 'Início — Andorin' }

export default async function AlunoHomePage() {

  const profile  = await requireAuth()
  const supabase = await createClient()

  const agora    = new Date()
  const hojeISO  = agora.toISOString().split('T')[0]
  const mesAtual = agora.toISOString().substring(0, 7)
  const em7Dias  = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const inicioMes = `${mesAtual}-01T00:00:00`

  // ── Queries em paralelo ─────────────────────────────────────
  const [
    inscricoesResult,
    aulasDisponiveisResult,
    avaliacaoPendenteResult,
    rankingResult,
    habilidadesResult,
    totalInscResult,
    totalPresResult,
  ] = await Promise.all([

    // 1. Inscrições do aluno nos próximos 7 dias
    supabase
      .from('inscricoes')
      .select(`
        id, presente, lista_espera,
        aulas!inscricoes_aula_id_fkey (
          id, nome, emoji, inicio, fim, local,
          profiles!aulas_instrutor_id_fkey ( nome )
        )
      `)
      .eq('aluno_id', profile.id)
      .eq('lista_espera', false)
      .gte('aulas(inicio)', agora.toISOString())
      .lte('aulas(inicio)', em7Dias)
      .order('aulas(inicio)', { ascending: true })
      .limit(7),

    // 2. Aulas abertas da semana (para "disponíveis para você")
    supabase
      .from('aulas')
      .select(`
        id, nome, emoji, inicio, vagas, local,
        inscricoes ( id )
      `)
      .eq('status', 'agendada')
      .gte('inicio', agora.toISOString())
      .lte('inicio', em7Dias)
      .order('inicio', { ascending: true })
      .limit(20),

    // 3. Última aula com presença sem avaliação
    supabase
      .from('inscricoes')
      .select(`
        id,
        aulas!inscricoes_aula_id_fkey ( id, nome, emoji, inicio, local ),
        avaliacoes ( id )
      `)
      .eq('aluno_id', profile.id)
      .eq('presente', true)
      .lt('aulas(inicio)', agora.toISOString())
      .is('avaliacoes', null)
      .order('aulas(inicio)', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // 4. Ranking geral (todos os alunos por XP)
    supabase
      .from('profiles')
      .select('id, xp_total')
      .eq('role', 'aluno')
      .order('xp_total', { ascending: false }),

    // 5. Habilidades do aluno (COUNT)
    supabase
      .from('aluno_habilidades')
      .select('*', { count: 'exact', head: true })
      .eq('aluno_id', profile.id),

    // 6a. Total de inscrições do mês
    supabase
      .from('inscricoes')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', profile.id)
      .eq('lista_espera', false)
      .gte('aulas(inicio)', inicioMes),

    // 6b. Total de presenças do mês
    supabase
      .from('inscricoes')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', profile.id)
      .eq('presente', true)
      .eq('lista_espera', false)
      .gte('aulas(inicio)', inicioMes),
  ])

  // ── Processamento ───────────────────────────────────────────

  // IDs de aulas que o aluno já está inscrito — para filtrar disponíveis
  const inscricoesData  = inscricoesResult.data ?? []
  const aulasInscritasIds = new Set(
    inscricoesData.map((i) => {
      const a = Array.isArray(i.aulas) ? i.aulas[0] : i.aulas
      return a?.id
    }).filter(Boolean)
  )

  // Aulas disponíveis = semana - já inscritas, com vagas restantes calculadas
  const aulasData = aulasDisponiveisResult.data ?? []
  const aulasDisponiveis = aulasData
    .filter((a) => !aulasInscritasIds.has(a.id))
    .map((a) => {
      const inscritos = Array.isArray(a.inscricoes) ? a.inscricoes.length : 0
      return {
        id:          a.id,
        nome:        a.nome,
        emoji:       a.emoji,
        inicio:      a.inicio,
        local:       a.local,
        vagas:       a.vagas,
        inscritos,
        vagasLivres: Math.max(0, a.vagas - inscritos),
      }
    })
    .slice(0, 4)   // máximo 4 cards na seção "disponíveis"

  // Aulas da semana do aluno com status calculado
  const minhasAulas = inscricoesData.map((i) => {
    const aula     = Array.isArray(i.aulas) ? i.aulas[0] : i.aulas
    const instrutor = aula
      ? (Array.isArray(aula.profiles) ? aula.profiles[0] : aula.profiles)
      : null
    return {
      inscricaoId:    i.id,
      aulaId:         aula?.id         ?? '',
      nome:           aula?.nome       ?? 'Aula',
      emoji:          aula?.emoji      ?? '🎪',
      inicio:         aula?.inicio     ?? '',
      local:          aula?.local      ?? null,
      instrutor:      instrutor?.nome  ?? null,
      presente:       i.presente,
    }
  })

  // Ranking
  const rankingAlunos  = rankingResult.data ?? []
  const posicao        = rankingAlunos.findIndex((p) => p.id === profile.id) + 1

  // Presença do mês
  const totalInsc  = totalInscResult.count  ?? 0
  const totalPres  = totalPresResult.count  ?? 0
  const taxaPres   = totalInsc > 0 ? Math.round((totalPres / totalInsc) * 100) : 0

  const totalHabilidades = habilidadesResult.count ?? 0

  // Avaliação pendente
  const avPendente = avaliacaoPendenteResult.data
  let aulaPendente: { inscricaoId: string; aulaId: string; nome: string; emoji: string | null; inicio: string; local: string | null } | null = null
  if (avPendente) {
    const aulaAv = Array.isArray(avPendente.aulas) ? avPendente.aulas[0] : avPendente.aulas
    if (aulaAv) {
      aulaPendente = {
        inscricaoId: avPendente.id,
        aulaId:      aulaAv.id,
        nome:        aulaAv.nome,
        emoji:       aulaAv.emoji,
        inicio:      aulaAv.inicio,
        local:       aulaAv.local,
      }
    }
  }

  return (
    <AlunoHomeClient
      profile={{
        nome:    profile.nome,
        xpTotal: profile.xpTotal,
      }}
      minhasAulas={minhasAulas}
      aulasDisponiveis={aulasDisponiveis}
      aulaPendente={aulaPendente}
      metricas={{
        taxaPresenca:   taxaPres,
        totalHabilidades,
        posicaoRanking: posicao,
        totalAlunos:    rankingAlunos.length,
        mesLabel:       agora.toLocaleDateString('pt-BR', { month: 'short' }),
      }}
    />
  )
}
