'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/restricoes.ts
//
// Server Actions de restrições de saúde do aluno.
//
// LGPD — DADO SENSÍVEL DE SAÚDE:
//   aluno_restricoes é o único dado classificado como sensível
//   no sistema. Três níveis de acesso via RLS:
//   • Aluno → vê e gerencia apenas as próprias
//   • Professor → vê de alunos nas suas aulas (EXISTS em inscricoes)
//   • Admin → gerencia todas
//
// ENCERRAR ≠ EXCLUIR:
//   Restrições são encerradas (ativa = false), não deletadas.
//   O histórico é mantido — professor pode ver que a restrição
//   existiu e foi encerrada. Isso protege o aluno e a academia.
//
// AUTORIZAÇÃO:
//   exigirAluno() — apenas o próprio aluno declara e encerra
//   as suas restrições nesta action. O campo registrado_por
//   é sempre profile.id — nunca vem do frontend.
// ─────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import { createClient }  from '@/lib/supabase/server'
import { getProfile }    from '@/(auth)/session'

type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

// ── Tipo exportado ────────────────────────────────────────────
export interface RestricaoRow {
  id:             string
  tipo:           'pontual' | 'cronica'
  descricao:      string
  regiaoCorporal: string | null
  ativa:          boolean
  inicioEm:       string | null
  fimPrevisto:    string | null
  observacoes:    string | null
  createdAt:      string
}

export interface DeclararRestricaoInput {
  tipo:             'pontual' | 'cronica'
  descricao:        string
  regiao_corporal?: string
  inicio_em?:       string
  fim_previsto?:    string
  observacoes?:     string
}

// ── Helper ────────────────────────────────────────────────────
async function exigirAluno() {
  const profile = await getProfile()
  if (!profile)              throw new Error('Sessão expirada.')
  if (profile.role !== 'aluno') throw new Error('Acesso negado.')
  return profile
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarRestricoes
//
// Busca restrições ativas do aluno.
// RLS "aluno vê próprias restrições" filtra automaticamente.
// ─────────────────────────────────────────────────────────────
export async function listarRestricoes(): Promise<ActionResult<RestricaoRow[]>> {
  try { await exigirAluno() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('aluno_restricoes')
    .select('id, tipo, descricao, regiao_corporal, ativa, inicio_em, fim_previsto, observacoes, created_at')
    .eq('ativa', true)
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: 'Erro ao buscar restrições.' }

  return {
    ok:   true,
    data: (data ?? []).map((r) => ({
      id:             r.id,
      tipo:           r.tipo as RestricaoRow['tipo'],
      descricao:      r.descricao,
      regiaoCorporal: r.regiao_corporal,
      ativa:          r.ativa,
      inicioEm:       r.inicio_em,
      fimPrevisto:    r.fim_previsto,
      observacoes:    r.observacoes,
      createdAt:      r.created_at,
    })),
  }
}

// ─────────────────────────────────────────────────────────────
// ACTION: declararRestricao
//
// O aluno declara uma restrição de saúde própria.
// registrado_por = profile.id — nunca vem do frontend.
// RLS WITH CHECK (aluno_id = auth.uid()) confirma no banco.
// ─────────────────────────────────────────────────────────────
export async function declararRestricao(
  input: DeclararRestricaoInput
): Promise<ActionResult<{ id: string }>> {

  let profile
  try { profile = await exigirAluno() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!input.tipo)             return { ok: false, error: 'Tipo é obrigatório.' }
  if (!input.descricao?.trim()) return { ok: false, error: 'Descrição é obrigatória.' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('aluno_restricoes')
    .insert({
      aluno_id:        profile.id,          // sempre o próprio aluno
      registrado_por:  profile.id,          // nunca vem do frontend
      tipo:            input.tipo,
      descricao:       input.descricao.trim(),
      regiao_corporal: input.regiao_corporal?.trim() || null,
      ativa:           true,
      inicio_em:       input.inicio_em     || null,
      fim_previsto:    input.fim_previsto  || null,
      observacoes:     input.observacoes?.trim() || null,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: 'Erro ao registrar restrição.' }

  revalidatePath('/pages/aluno/perfil')
  return { ok: true, data: { id: data.id } }
}

// ─────────────────────────────────────────────────────────────
// ACTION: encerrarRestricao
//
// Marca a restrição como inativa (ativa = false).
// NÃO exclui — histórico é mantido para o professor consultar.
// Verificação dupla: .eq('id').eq('aluno_id') garante
// que o aluno só encerra as próprias restrições.
// ─────────────────────────────────────────────────────────────
export async function encerrarRestricao(
  restricaoId: string
): Promise<ActionResult> {

  let profile
  try { profile = await exigirAluno() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!restricaoId) return { ok: false, error: 'Restrição não identificada.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('aluno_restricoes')
    .update({ ativa: false, fim_previsto: new Date().toISOString().split('T')[0] })
    .eq('id', restricaoId)
    .eq('aluno_id', profile.id)   // dupla verificação — só a própria

  if (error) return { ok: false, error: 'Erro ao encerrar restrição.' }

  revalidatePath('/pages/aluno/perfil')
  return { ok: true, data: undefined }
}
