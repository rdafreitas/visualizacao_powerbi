'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/checkin.ts
//
// Server Actions de agenda e check-in para o módulo Professor.
//
// PONTO CENTRAL DESTA ETAPA:
//   marcarPresenca() dispara três triggers em cascata no banco:
//   1. trg_presenca_progresso → aluno_habilidades (GREATEST) + aluno_xp_log
//   2. trg_xp_total           → profiles.xp_total += xp_ganho
//   3. trg_pagamento_professor → pagamentos_professores (R$50 ou R$30)
//
// DIFERENÇA DE AUTORIZAÇÃO vs treinos.ts:
//   Treinos: RLS filtra automaticamente (professor_id = auth.uid())
//   Aulas:   policy "autenticados leem aulas" não filtra por instrutor.
//            O filtro .eq('instrutor_id', profile.id) é explícito no código.
//            A verificação de propriedade em marcarPresenca() adiciona
//            uma segunda camada de proteção.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server'
import { getProfile }   from '@/(auth)/session'

type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

// ── Tipos exportados ──────────────────────────────────────────

export interface InscritoRow {
  id:           string
  alunoId:      string
  nome:         string
  presente:     boolean
  listaEspera:  boolean
  restricoes:   string[]    // descrições das restrições ativas (LGPD — apenas para o professor)
}

export interface AulaProfessorRow {
  id:              string
  nome:            string
  emoji:           string | null
  local:           string | null
  inicio:          string
  fim:             string
  vagas:           number
  status:          'agendada' | 'cancelada' | 'concluida'
  habilidadeNome:  string | null    // da aula_habilidade
  nivelDaAula:     number | null
  inscritos:       InscritoRow[]
}

// ── Helper interno ────────────────────────────────────────────
async function exigirProfessor() {
  const profile = await getProfile()
  if (!profile)
    throw new Error('Sessão expirada. Faça login novamente.')
  if (profile.role !== 'professor')
    throw new Error('Acesso negado. Apenas professores podem executar esta ação.')
  return profile
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarAulasProfessor
//
// Busca as aulas do professor logado em um intervalo de datas,
// com inscritos e restrições de saúde (para o check-in).
//
// Por que .eq('instrutor_id', profile.id) explícito?
//   A tabela aulas tem policy "autenticados leem aulas" — qualquer
//   autenticado pode ler TODAS as aulas. Diferente dos treinos,
//   onde o RLS filtra por professor_id automaticamente.
//   O filtro explícito garante que o professor só receba suas aulas.
//
// O JOIN com aluno_restricoes retorna dados sensíveis (LGPD).
//   Apenas restrições ativas são relevantes — filtramos no JS.
//   O professor vê as restrições dos seus alunos via policy
//   "professor vê restrições dos seus alunos" (baseada em EXISTS).
// ─────────────────────────────────────────────────────────────
export async function listarAulasProfessor(
  dataInicio: string,  // 'YYYY-MM-DD'
  dataFim:    string
): Promise<ActionResult<AulaProfessorRow[]>> {

  let profile
  try { profile = await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('aulas')
    .select(`
      id, nome, emoji, local, inicio, fim, vagas, status,
      aula_habilidade (
        nivel_da_aula,
        habilidades ( nome )
      ),
      inscricoes (
        id, aluno_id, presente, lista_espera,
        profiles!inscricoes_aluno_id_fkey ( nome ),
        aluno_restricoes!aluno_restricoes_aluno_id_fkey (
          descricao, ativa, tipo
        )
      )
    `)
    .eq('instrutor_id', profile.id)
    .eq('status', 'agendada')
    .gte('inicio', `${dataInicio}T00:00:00`)
    .lte('inicio', `${dataFim}T23:59:59`)
    .order('inicio', { ascending: true })

  if (error) {
    console.error('[CheckIn] Falha ao listar aulas', { codigo: error.code })
    return { ok: false, error: 'Erro ao buscar aulas.' }
  }

  const aulas: AulaProfessorRow[] = (data ?? []).map((a) => {
    // Habilidade e nível da aula (primeira entrada de aula_habilidade)
    const ah = Array.isArray(a.aula_habilidade)
      ? a.aula_habilidade[0] : a.aula_habilidade
    const habArr = ah?.habilidades
    const hab    = Array.isArray(habArr) ? habArr[0] : habArr

    // Normaliza inscritos com restrições de saúde ativas
    const inscritos: InscritoRow[] = (Array.isArray(a.inscricoes) ? a.inscricoes : [])
      .filter((i) => !i.lista_espera)   // exclui lista de espera do check-in principal
      .map((i) => {
        const prof = Array.isArray(i.profiles) ? i.profiles[0] : i.profiles

        // Restrições ativas — dado sensível apenas para o professor durante check-in
        const restricoes = (Array.isArray(i.aluno_restricoes) ? i.aluno_restricoes : [])
          .filter((r) => r.ativa)
          .map((r) => `${r.tipo === 'cronica' ? '🔴' : '🟡'} ${r.descricao}`)

        return {
          id:          i.id,
          alunoId:     i.aluno_id,
          nome:        prof?.nome ?? 'Aluno',
          presente:    i.presente,
          listaEspera: i.lista_espera,
          restricoes,
        }
      })
      .sort((a, b) => a.nome.localeCompare(b.nome))

    return {
      id:             a.id,
      nome:           a.nome,
      emoji:          a.emoji,
      local:          a.local,
      inicio:         a.inicio,
      fim:            a.fim,
      vagas:          a.vagas,
      status:         a.status as AulaProfessorRow['status'],
      habilidadeNome: hab?.nome   ?? null,
      nivelDaAula:    ah?.nivel_da_aula ?? null,
      inscritos,
    }
  })

  return { ok: true, data: aulas }
}

// ─────────────────────────────────────────────────────────────
// ACTION: marcarPresenca
//
// Atualiza inscricoes.presente para true ou false.
// Este UPDATE dispara os 3 triggers automáticos do banco:
//   trg_presenca_progresso → aluno_habilidades (GREATEST) + aluno_xp_log
//   trg_xp_total           → profiles.xp_total += xp_ganho
//   trg_pagamento_professor → pagamentos_professores (R$50 ou R$30)
//
// Verificação de propriedade da aula:
//   A policy "professor faz check-in" verifica via USING/WITH CHECK.
//   A verificação explícita aqui gera mensagem de erro clara
//   em vez de silenciosamente não atualizar nenhuma linha.
// ─────────────────────────────────────────────────────────────
export async function marcarPresenca(
  inscricaoId: string,
  presente:    boolean
): Promise<ActionResult> {

  let profile
  try { profile = await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!inscricaoId) return { ok: false, error: 'Inscrição não identificada.' }

  const supabase = await createClient()

  // Verifica que o professor é instrutor da aula desta inscrição
  const { data: inscricao } = await supabase
    .from('inscricoes')
    .select(`
      id,
      aulas!inscricoes_aula_id_fkey ( instrutor_id )
    `)
    .eq('id', inscricaoId)
    .maybeSingle()

  if (!inscricao) {
    return { ok: false, error: 'Inscrição não encontrada.' }
  }

  const aulaData = Array.isArray(inscricao.aulas)
    ? inscricao.aulas[0]
    : inscricao.aulas

  if (aulaData?.instrutor_id !== profile.id) {
    return { ok: false, error: 'Sem permissão para fazer check-in nesta aula.' }
  }

  // O UPDATE em presente dispara os triggers em cascata
  const { error } = await supabase
    .from('inscricoes')
    .update({ presente })
    .eq('id', inscricaoId)

  if (error) return { ok: false, error: 'Erro ao registrar presença.' }
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: definirTreinoDaAula
//
// Vincula um treino da biblioteca à aula específica.
// Usa upsert com onConflict: 'aula_id' porque aula_treino tem
// UNIQUE (aula_id) — uma aula tem no máximo um treino definido.
// Se o professor mudar de ideia, o upsert substitui sem verificação prévia.
// Quando existe um registro em aula_treino, a função
// get_avisos_professor não gera mais o aviso "Treino não definido".
// ─────────────────────────────────────────────────────────────
export async function definirTreinoDaAula(
  aulaId:   string,
  treinoId: string
): Promise<ActionResult> {

  let profile
  try { profile = await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!aulaId)   return { ok: false, error: 'Aula não identificada.' }
  if (!treinoId) return { ok: false, error: 'Treino não identificado.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('aula_treino')
    .upsert(
      {
        aula_id:      aulaId,
        treino_id:    treinoId,
        definido_por: profile.id,
        definido_em:  new Date().toISOString(),
      },
      { onConflict: 'aula_id' }   // UNIQUE (aula_id) — substitui se já existe
    )

  if (error) return { ok: false, error: 'Erro ao definir treino da aula.' }
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: buscarAvisos
//
// Chama a função SQL get_avisos_professor via RPC.
// Retorna avisos em tempo real sem tabela persistente.
// Retorna array vazio em vez de erro — aviso é informativo,
// não bloqueia o uso da tela.
// ─────────────────────────────────────────────────────────────
export interface AvisoProfessor {
  tipo:    string
  titulo:  string
  corpo:   string
  ref_id:  string   // UUID da aula relacionada (renomeado de aula_id)
  urgente: boolean
}

export async function buscarAvisos(): Promise<AvisoProfessor[]> {
  try { await exigirProfessor() }
  catch { return [] }

  const supabase = await createClient()

  const { data } = await supabase
    .rpc('get_avisos_professor')
    .returns<AvisoProfessor[]>()

  return data ?? []
}
