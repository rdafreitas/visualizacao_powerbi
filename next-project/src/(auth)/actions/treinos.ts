'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/treinos.ts
//
// Server Actions da biblioteca de treinos do professor.
//
// ISOLAMENTO POR RLS — ponto central desta etapa:
//   A policy "professor gerencia seus treinos" define:
//     USING      (professor_id = auth.uid())
//     WITH CHECK (professor_id = auth.uid())
//   Isso significa que o banco filtra automaticamente — o código
//   não precisa de .eq('professor_id', id) nos SELECTs porque
//   o RLS já adiciona essa condição antes de retornar dados.
//   Um professor nunca vê, edita ou exclui treinos de outro,
//   mesmo que tente forjar o id no cliente.
//
// exigirProfessor():
//   Diferente de exigirAdmin() que aceita dois roles,
//   esta função aceita apenas 'professor'.
//   professor_id nos INSERTs sempre vem de profile.id —
//   nunca do corpo da requisição (o frontend não decide).
// ─────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server'
import { getProfile }   from '@/(auth)/session'

type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

// ── Tipos exportados ──────────────────────────────────────────

export interface TreinoRow {
  id:           string
  nome:         string
  objetivo:     string | null
  valencias:    string[]
  musculos:     string[]
  nivel:        'Iniciante' | 'Intermediário' | 'Avançado' | null
  series:       string | null
  obs:          string | null
  createdAt:    string
  habilidades:  { id: string; nome: string; emoji: string | null }[]
}

export interface HabilidadeSimples {
  id:         string
  nome:       string
  emoji:      string | null
  modalidade: string | null
}

export interface CriarTreinoInput {
  nome:        string
  objetivo?:   string
  valencias?:  string[]
  musculos?:   string[]
  nivel?:      'Iniciante' | 'Intermediário' | 'Avançado' | null
  series?:     string
  obs?:        string
}

// ── Helper interno ────────────────────────────────────────────
async function exigirProfessor() {
  const profile = await getProfile()
  if (!profile)
    throw new Error('Sessão expirada. Faça login novamente.')
  if (profile.role !== 'professor')
    throw new Error('Acesso negado. Apenas professores podem gerenciar treinos.')
  return profile
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarTreinos
//
// Busca os treinos do professor logado com JOIN em habilidades.
// Não há .eq('professor_id', ...) — o RLS filtra automaticamente.
// ─────────────────────────────────────────────────────────────
export async function listarTreinos(): Promise<ActionResult<TreinoRow[]>> {
  try { await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('treinos')
    .select(`
      id, nome, objetivo, valencias, musculos, nivel, series, obs, created_at,
      treino_habilidades (
        habilidade_id,
        habilidades ( id, nome, emoji )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Treinos] Falha ao listar', { codigo: error.code })
    return { ok: false, error: 'Erro ao buscar treinos.' }
  }

  const treinos: TreinoRow[] = (data ?? []).map((t) => {
    // treino_habilidades é array — extrai a habilidade aninhada
    const habilidades = (t.treino_habilidades ?? []).map((th) => {
      const h = Array.isArray(th.habilidades) ? th.habilidades[0] : th.habilidades
      return {
        id:    h?.id    ?? '',
        nome:  h?.nome  ?? '',
        emoji: h?.emoji ?? null,
      }
    }).filter((h) => h.id)

    return {
      id:         t.id,
      nome:       t.nome,
      objetivo:   t.objetivo,
      valencias:  t.valencias   ?? [],
      musculos:   t.musculos    ?? [],
      nivel:      t.nivel as TreinoRow['nivel'],
      series:     t.series,
      obs:        t.obs,
      createdAt:  t.created_at,
      habilidades,
    }
  })

  return { ok: true, data: treinos }
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarHabilidades
//
// Catálogo global de habilidades para o seletor do formulário.
// Qualquer autenticado pode ler (policy "autenticados leem habilidades").
// Não exige professor — reutilizável por outros módulos.
// ─────────────────────────────────────────────────────────────
export async function listarHabilidades(): Promise<ActionResult<HabilidadeSimples[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('habilidades')
    .select('id, nome, emoji, modalidade')
    .order('modalidade')
    .order('nome')

  if (error) return { ok: false, error: 'Erro ao buscar habilidades.' }
  return { ok: true, data: data ?? [] }
}

// ─────────────────────────────────────────────────────────────
// ACTION: criarTreino
//
// professor_id sempre vem de profile.id — nunca do frontend.
// O RLS with CHECK (professor_id = auth.uid()) garante isso
// no banco também: se alguém forjar o professor_id, o INSERT
// é rejeitado com erro de violação de policy.
// ─────────────────────────────────────────────────────────────
export async function criarTreino(
  input: CriarTreinoInput
): Promise<ActionResult<{ id: string }>> {

  let profile
  try { profile = await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!input.nome?.trim()) return { ok: false, error: 'Nome do exercício é obrigatório.' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('treinos')
    .insert({
      professor_id: profile.id,           // sempre o próprio professor
      nome:         input.nome.trim(),
      objetivo:     input.objetivo?.trim()   || null,
      valencias:    input.valencias          ?? [],
      musculos:     input.musculos           ?? [],
      nivel:        input.nivel              || null,
      series:       input.series?.trim()     || null,
      obs:          input.obs?.trim()        || null,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: 'Erro ao criar exercício.' }
  }

  return { ok: true, data: { id: data.id } }
}

// ─────────────────────────────────────────────────────────────
// ACTION: atualizarTreino
//
// O RLS com USING (professor_id = auth.uid()) garante que
// o professor só atualiza seus próprios treinos.
// ─────────────────────────────────────────────────────────────
export async function atualizarTreino(
  id:    string,
  input: Partial<CriarTreinoInput>
): Promise<ActionResult> {

  try { await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!id) return { ok: false, error: 'Treino não identificado.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('treinos')
    .update({
      ...(input.nome      && { nome:      input.nome.trim()      }),
      ...(input.objetivo  !== undefined && { objetivo:  input.objetivo?.trim()  || null }),
      ...(input.valencias && { valencias: input.valencias }),
      ...(input.musculos  && { musculos:  input.musculos  }),
      ...(input.nivel     !== undefined && { nivel:      input.nivel             || null }),
      ...(input.series    !== undefined && { series:     input.series?.trim()    || null }),
      ...(input.obs       !== undefined && { obs:        input.obs?.trim()       || null }),
    })
    .eq('id', id)
  // Sem .eq('professor_id', ...) — RLS garante que apenas o dono pode atualizar

  if (error) return { ok: false, error: 'Erro ao atualizar exercício.' }
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: excluirTreino
//
// Por que verificar antes de excluir em vez de só fazer DELETE?
//   .delete().eq('id', id) sem RLS excluiria qualquer treino.
//   Com RLS, o DELETE é limitado ao professor_id = auth.uid().
//   Se o treino não existir ou não pertencer ao professor,
//   o banco não exclui nenhuma linha — mas também não retorna erro.
//   A verificação prévia com maybeSingle() retorna null nesses dois
//   casos, permitindo uma mensagem de erro sem revelar se o treino
//   existe mas pertence a outro professor (evita enumeração).
// ─────────────────────────────────────────────────────────────
export async function excluirTreino(id: string): Promise<ActionResult> {
  try { await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!id) return { ok: false, error: 'Treino não identificado.' }

  const supabase = await createClient()

  // Verifica existência + pertence ao professor (via RLS)
  const { data: treino } = await supabase
    .from('treinos')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (!treino) {
    return { ok: false, error: 'Exercício não encontrado ou sem permissão.' }
  }

  const { error } = await supabase
    .from('treinos')
    .delete()
    .eq('id', id)

  if (error) return { ok: false, error: 'Erro ao excluir exercício.' }
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: vincularHabilidade
//
// Associa uma habilidade a um treino (tabela N:M treino_habilidades).
// O RLS de treino_habilidades usa EXISTS para verificar que
// o treino pertence ao professor — sem professor_id na junção.
// ─────────────────────────────────────────────────────────────
export async function vincularHabilidade(
  treinoId:     string,
  habilidadeId: string
): Promise<ActionResult> {
  try { await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { error } = await supabase
    .from('treino_habilidades')
    .insert({ treino_id: treinoId, habilidade_id: habilidadeId })

  // Ignora erro de duplicate (UNIQUE constraint) — vincular duas vezes é ok
  if (error && !error.message.includes('unique')) {
    return { ok: false, error: 'Erro ao vincular habilidade.' }
  }

  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: desvincularHabilidade
// ─────────────────────────────────────────────────────────────
export async function desvincularHabilidade(
  treinoId:     string,
  habilidadeId: string
): Promise<ActionResult> {
  try { await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { error } = await supabase
    .from('treino_habilidades')
    .delete()
    .eq('treino_id',     treinoId)
    .eq('habilidade_id', habilidadeId)

  if (error) return { ok: false, error: 'Erro ao desvincular habilidade.' }
  return { ok: true, data: undefined }
}
