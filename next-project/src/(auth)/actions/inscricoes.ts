'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/inscricoes.ts
//
// Server Actions de inscrição, cancelamento e avaliação do aluno.
//
// DOMÍNIO DO ALUNO — exigirAluno():
//   Aceita apenas role 'aluno'. O aluno opera sobre seus próprios
//   dados — profile.id garante que nunca age por outro aluno.
//
// TRIGGERS QUE ESTA ACTION DISPARA:
//   avaliarAula INSERT → trg_xp_avaliacao (5 ou 10 XP)
//                      → trg_xp_total (profiles.xp_total += xp)
//
// VALIDAÇÕES DE NEGÓCIO NO SERVIDOR:
//   inscreverAluno: max_modal do plano, vagas disponíveis, inscrição duplicada
//   cancelarInscricao: prazo mínimo de 2h antes da aula
//   avaliarAula: nota entre 1-5, inscrição pertence ao aluno
// ─────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import { createClient }  from '@/lib/supabase/server'
import { getProfile }    from '@/(auth)/session'

type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

// ── Tipo exportado para a tela de agenda ─────────────────────
export interface AulaAlunoRow {
  id:             string
  nome:           string
  emoji:          string | null
  inicio:         string
  fim:            string
  local:          string | null
  instrutor:      string | null
  vagas:          number
  inscritos:      number
  vagasLivres:    number
  inscricaoId:    string | null   // null = não inscrito
  presente:       boolean
  listaEspera:    boolean
}

// ── Helper ────────────────────────────────────────────────────
async function exigirAluno() {
  const profile = await getProfile()
  if (!profile)
    throw new Error('Sessão expirada. Faça login novamente.')
  if (profile.role !== 'aluno')
    throw new Error('Acesso negado. Apenas alunos podem executar esta ação.')
  return profile
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarAulasAluno
//
// Busca aulas de um intervalo com status de inscrição do aluno.
// Calcula vagasLivres = vagas - COUNT(inscricoes) no servidor.
// ─────────────────────────────────────────────────────────────
export async function listarAulasAluno(
  dataInicio: string,
  dataFim:    string
): Promise<ActionResult<AulaAlunoRow[]>> {

  let profile
  try { profile = await exigirAluno() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('aulas')
    .select(`
      id, nome, emoji, inicio, fim, local, vagas, status,
      profiles!aulas_instrutor_id_fkey ( nome ),
      inscricoes (
        id, aluno_id, presente, lista_espera
      )
    `)
    .eq('status', 'agendada')
    .gte('inicio', `${dataInicio}T00:00:00`)
    .lte('inicio', `${dataFim}T23:59:59`)
    .order('inicio', { ascending: true })

  if (error) {
    console.error('[Agenda aluno] Falha ao listar', { codigo: error.code })
    return { ok: false, error: 'Erro ao buscar aulas.' }
  }

  const aulas: AulaAlunoRow[] = (data ?? []).map((a) => {
    const instrutor = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
    const inscritos = Array.isArray(a.inscricoes) ? a.inscricoes : []

    // Inscrição do próprio aluno nesta aula
    const minhaInscricao = inscritos.find((i) => i.aluno_id === profile.id)
    const totalInscritos = inscritos.filter((i) => !i.lista_espera).length

    return {
      id:          a.id,
      nome:        a.nome,
      emoji:       a.emoji,
      inicio:      a.inicio,
      fim:         a.fim,
      local:       a.local,
      instrutor:   instrutor?.nome ?? null,
      vagas:       a.vagas,
      inscritos:   totalInscritos,
      vagasLivres: Math.max(0, a.vagas - totalInscritos),
      inscricaoId: minhaInscricao?.id        ?? null,
      presente:    minhaInscricao?.presente  ?? false,
      listaEspera: minhaInscricao?.lista_espera ?? false,
    }
  })

  return { ok: true, data: aulas }
}

// ─────────────────────────────────────────────────────────────
// ACTION: inscreverAluno
//
// Valida vagas e limite de modalidades do plano antes de inserir.
//
// VALIDAÇÃO max_modal:
//   Conta as modalidades distintas das turmas das aulas em que
//   o aluno está inscrito. Se a nova aula adiciona uma modalidade
//   nova e já atingiu o limite do plano → bloqueia.
//   Um aluno com 2 aulas da mesma modalidade usa apenas 1 slot.
//
// LISTA DE ESPERA:
//   Se não há vagas, insere com lista_espera = true.
//   O admin pode promover manualmente ou um sistema futuro.
// ─────────────────────────────────────────────────────────────
export async function inscreverAluno(
  aulaId: string
): Promise<ActionResult<{ inscricaoId: string; listaEspera: boolean }>> {

  let profile
  try { profile = await exigirAluno() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!aulaId) return { ok: false, error: 'Aula não identificada.' }

  const supabase = await createClient()

  // Busca dados da aula: vagas, status, modalidade via turma
  const { data: aula } = await supabase
    .from('aulas')
    .select(`
      id, vagas, status,
      turmas!aulas_turma_id_fkey ( modalidade ),
      inscricoes ( id, lista_espera )
    `)
    .eq('id', aulaId)
    .maybeSingle()

  if (!aula)                         return { ok: false, error: 'Aula não encontrada.' }
  if (aula.status !== 'agendada')    return { ok: false, error: 'Esta aula não está disponível.' }

  // Verifica inscrição duplicada
  const { data: jaInscrito } = await supabase
    .from('inscricoes')
    .select('id')
    .eq('aula_id', aulaId)
    .eq('aluno_id', profile.id)
    .maybeSingle()

  if (jaInscrito) return { ok: false, error: 'Você já está inscrito nesta aula.' }

  // Vagas livres
  const inscritos  = (Array.isArray(aula.inscricoes) ? aula.inscricoes : []).filter((i) => !i.lista_espera)
  const vagasLivres = Math.max(0, aula.vagas - inscritos.length)

  // Validação de max_modal somente se a aula tem turma/modalidade
  const turmaData = Array.isArray(aula.turmas) ? aula.turmas[0] : aula.turmas
  const modalidadeNova = turmaData?.modalidade ?? null

  if (modalidadeNova) {
    // Busca matrícula ativa para obter o max_modal do plano
    const { data: matricula } = await supabase
      .from('matriculas')
      .select('planos!matriculas_plano_id_fkey ( max_modal )')
      .eq('aluno_id', profile.id)
      .in('status', ['ativo', 'experimental'])
      .limit(1)
      .maybeSingle()

    const plano = matricula
      ? (Array.isArray(matricula.planos) ? matricula.planos[0] : matricula.planos)
      : null

    if (plano) {
      // Modalidades distintas das inscrições ativas do aluno
      const { data: inscMes } = await supabase
        .from('inscricoes')
        .select('aulas!inscricoes_aula_id_fkey ( turmas!aulas_turma_id_fkey ( modalidade ) )')
        .eq('aluno_id', profile.id)
        .eq('lista_espera', false)

      const modalidadesAtuais = new Set(
        (inscMes ?? []).flatMap((i) => {
          const a = Array.isArray(i.aulas) ? i.aulas[0] : i.aulas
          const t = a ? (Array.isArray(a.turmas) ? a.turmas[0] : a.turmas) : null
          return t?.modalidade ? [t.modalidade] : []
        })
      )

      // Bloqueia se é modalidade NOVA e já atingiu o limite
      if (!modalidadesAtuais.has(modalidadeNova) && modalidadesAtuais.size >= plano.max_modal) {
        return {
          ok:    false,
          error: `Seu plano permite até ${plano.max_modal} modalidade${plano.max_modal !== 1 ? 's' : ''} diferente${plano.max_modal !== 1 ? 's' : ''}. ` +
                 `Você já pratica: ${[...modalidadesAtuais].join(', ')}.`,
        }
      }
    }
  }

  // Insere — se sem vagas, vai para lista de espera
  const listaEspera = vagasLivres === 0

  const { data, error } = await supabase
    .from('inscricoes')
    .insert({
      aula_id:      aulaId,
      aluno_id:     profile.id,   // sempre o próprio aluno
      lista_espera: listaEspera,
    })
    .select('id')
    .single()

  if (error) {
    // UNIQUE constraint: já inscrito (concorrência — duplo clique)
    if (error.code === '23505')
      return { ok: false, error: 'Você já está inscrito nesta aula.' }
    return { ok: false, error: 'Erro ao realizar inscrição.' }
  }

  revalidatePath('/pages/aluno/agenda')
  revalidatePath('/pages/aluno/home')
  return { ok: true, data: { inscricaoId: data.id, listaEspera } }
}

// ─────────────────────────────────────────────────────────────
// ACTION: cancelarInscricao
//
// Remove a inscrição do aluno. Não permite cancelar com < 2h
// de antecedência — calculado no servidor a partir do horário
// da aula (sem depender do timezone do browser).
// ─────────────────────────────────────────────────────────────
export async function cancelarInscricao(
  inscricaoId: string
): Promise<ActionResult> {

  let profile
  try { profile = await exigirAluno() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!inscricaoId) return { ok: false, error: 'Inscrição não identificada.' }

  const supabase = await createClient()

  // Verifica que a inscrição pertence ao aluno e busca horário da aula
  const { data: inscricao } = await supabase
    .from('inscricoes')
    .select(`
      id, aluno_id,
      aulas!inscricoes_aula_id_fkey ( inicio, status )
    `)
    .eq('id', inscricaoId)
    .eq('aluno_id', profile.id)   // só a própria inscrição
    .maybeSingle()

  if (!inscricao) {
    return { ok: false, error: 'Inscrição não encontrada.' }
  }

  const aulaData = Array.isArray(inscricao.aulas) ? inscricao.aulas[0] : inscricao.aulas

  if (aulaData?.status !== 'agendada') {
    return { ok: false, error: 'Não é possível cancelar uma aula que já foi realizada ou cancelada.' }
  }

  // Prazo mínimo: 2 horas antes do início da aula
  const inicioAula = new Date(aulaData.inicio)
  const agora      = new Date()
  const horasAteAula = (inicioAula.getTime() - agora.getTime()) / (1000 * 60 * 60)

  if (horasAteAula < 2) {
    return {
      ok:    false,
      error: 'Não é possível cancelar com menos de 2 horas de antecedência.',
    }
  }

  const { error } = await supabase
    .from('inscricoes')
    .delete()
    .eq('id', inscricaoId)
    .eq('aluno_id', profile.id)   // dupla verificação de segurança

  if (error) return { ok: false, error: 'Erro ao cancelar inscrição.' }

  revalidatePath('/pages/aluno/agenda')
  revalidatePath('/pages/aluno/home')
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: avaliarAula
//
// Insere avaliação e dispara triggers em cascata:
//   trg_xp_avaliacao → aluno_xp_log (5 pts, +5 bônus se nota ≥ 4)
//   trg_xp_total     → profiles.xp_total += xp_ganho
//
// Verifica que o aluno esteve presente antes de avaliar.
// Verifica que ainda não avaliou (UNIQUE inscricao_id em avaliacoes).
// ─────────────────────────────────────────────────────────────
export async function avaliarAula(
  inscricaoId: string,
  nota:        number,
  comentario?: string
): Promise<ActionResult> {

  let profile
  try { profile = await exigirAluno() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!inscricaoId)                  return { ok: false, error: 'Inscrição não identificada.' }
  if (!Number.isInteger(nota) || nota < 1 || nota > 5)
    return { ok: false, error: 'Nota deve ser um número inteiro entre 1 e 5.' }

  const supabase = await createClient()

  // Verifica que a inscrição pertence ao aluno e que esteve presente
  const { data: inscricao } = await supabase
    .from('inscricoes')
    .select('id, presente, aluno_id')
    .eq('id', inscricaoId)
    .eq('aluno_id', profile.id)
    .maybeSingle()

  if (!inscricao)        return { ok: false, error: 'Inscrição não encontrada.' }
  if (!inscricao.presente) return { ok: false, error: 'Só é possível avaliar aulas em que você esteve presente.' }

  // Insere avaliação — triggers calculam XP automaticamente
  const { error } = await supabase
    .from('avaliacoes')
    .insert({
      inscricao_id: inscricaoId,
      aluno_id:     profile.id,
      nota,
      comentario:   comentario?.trim() || null,
    })

  if (error) {
    // UNIQUE constraint: já avaliou
    if (error.code === '23505')
      return { ok: false, error: 'Você já avaliou esta aula.' }
    return { ok: false, error: 'Erro ao registrar avaliação.' }
  }

  revalidatePath('/pages/aluno/home')
  return { ok: true, data: undefined }
}
