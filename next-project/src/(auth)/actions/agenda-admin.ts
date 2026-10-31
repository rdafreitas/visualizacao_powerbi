'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/agenda-admin.ts
//
// Server Actions de agenda para o módulo Admin.
// Gerencia turmas (templates recorrentes) e aulas (instâncias).
//
// HIERARQUIA DE DADOS:
//   Turma → template recorrente (professor + modalidade + horário)
//   Aula  → instância de uma data concreta (pode ter turma_id ou ser avulsa)
//
// AUTORIZAÇÃO:
//   exigirAdmin() → proprietario OU funcionario
//   As mesmas policies do banco cobrem ambos:
//     "admin cria e edita aulas" FOR ALL USING get_my_role() IN (...)
//     "admin gerencia turmas"    FOR ALL USING get_my_role() IN (...)
//
// PRINCÍPIO DO MENOR PRIVILÉGIO:
//   Todas as actions usam createClient (anon key + RLS).
//   As policies do banco já garantem as permissões necessárias.
// ─────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import { createClient }  from '@/lib/supabase/server'
import { getProfile }    from '@/(auth)/session'

type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

// ── Helper interno ────────────────────────────────────────────
async function exigirAdmin() {
  const profile = await getProfile()
  if (!profile)
    throw new Error('Sessão expirada. Faça login novamente.')
  if (!['proprietario', 'funcionario'].includes(profile.role))
    throw new Error('Acesso negado. Esta ação exige perfil de administrador.')
  return profile
}

// ── Tipos exportados ──────────────────────────────────────────

export interface AulaAdminRow {
  id:           string
  nome:         string
  emoji:        string | null
  local:        string | null
  inicio:       string        // timestamptz ISO
  fim:          string
  vagas:        number
  status:       'agendada' | 'cancelada' | 'concluida'
  instrutorId:  string
  instrutorNome:string
  inscritos:    number        // COUNT de inscricoes
}

export interface TurmaRow {
  id:            string
  nome:          string
  modalidade:    string
  professorId:   string
  professorNome: string
  diaLabel:      string       // ex: 'Segunda'
  horarioInicio: string
  horarioFim:    string
  local:         string | null
  ativa:         boolean
}

export interface ProfessorSimples {
  id:   string
  nome: string
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarAulasDaSemana
//
// Busca aulas de um intervalo de datas com JOIN em profiles
// (instrutor) e inscricoes (contagem de alunos).
//
// Por que o hint !aulas_instrutor_id_fkey?
//   A tabela aulas tem a coluna instrutor_id que referencia profiles.
//   O hint indica ao PostgREST qual FK usar no JOIN — sem ele,
//   se houver mais de uma FK entre as tabelas, retorna PGRST201.
//
// Por que incluir inscricoes ( id ) e não COUNT(*)?
//   O cliente Supabase JS não suporta COUNT(*) diretamente em embeds.
//   Buscamos apenas o campo id de cada inscrição e contamos no JS:
//   inscricoes.length — equivalente e sem overhead significativo
//   para o volume de dados de uma academia.
// ─────────────────────────────────────────────────────────────
export async function listarAulasDaSemana(
  dataInicio: string,  // ISO date: '2026-07-28'
  dataFim:    string   // ISO date: '2026-08-03'
): Promise<ActionResult<AulaAdminRow[]>> {
  try { await exigirAdmin() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('aulas')
    .select(`
      id, nome, emoji, local, inicio, fim, vagas, status,
      instrutor_id,
      profiles!aulas_instrutor_id_fkey ( nome ),
      inscricoes ( id )
    `)
    .gte('inicio', `${dataInicio}T00:00:00`)
    .lte('inicio', `${dataFim}T23:59:59`)
    .order('inicio', { ascending: true })

  if (error) {
    console.error('[Agenda] Falha ao listar aulas', { codigo: error.code })
    return { ok: false, error: 'Erro ao buscar aulas.' }
  }

  const aulas: AulaAdminRow[] = (data ?? []).map((a) => {
    // profiles vem como objeto (FK N:1) ou array[0]
    const prof = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles

    return {
      id:            a.id,
      nome:          a.nome,
      emoji:         a.emoji,
      local:         a.local,
      inicio:        a.inicio,
      fim:           a.fim,
      vagas:         a.vagas,
      status:        a.status as AulaAdminRow['status'],
      instrutorId:   a.instrutor_id,
      instrutorNome: prof?.nome ?? '—',
      inscritos:     Array.isArray(a.inscricoes) ? a.inscricoes.length : 0,
    }
  })

  return { ok: true, data: aulas }
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarTurmas
//
// Busca todas as turmas ativas com nome do professor.
// Usada para popular a tela de turmas e o seletor de turma_id
// no formulário de nova aula.
// ─────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

export async function listarTurmas(): Promise<ActionResult<TurmaRow[]>> {
  try { await exigirAdmin() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('turmas')
    .select(`
      id, nome, modalidade, dia_semana,
      horario_inicio, horario_fim, local, ativa,
      professor_id,
      profiles!turmas_professor_id_fkey ( nome )
    `)
    .eq('ativa', true)
    .order('dia_semana')
    .order('horario_inicio')

  if (error) {
    return { ok: false, error: 'Erro ao buscar turmas.' }
  }

  const turmas: TurmaRow[] = (data ?? []).map((t) => {
    const prof = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
    return {
      id:            t.id,
      nome:          t.nome,
      modalidade:    t.modalidade,
      professorId:   t.professor_id,
      professorNome: prof?.nome ?? '—',
      diaLabel:      DIAS_SEMANA[t.dia_semana] ?? `Dia ${t.dia_semana}`,
      horarioInicio: t.horario_inicio,
      horarioFim:    t.horario_fim,
      local:         t.local,
      ativa:         t.ativa,
    }
  })

  return { ok: true, data: turmas }
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarProfessores
//
// Retorna id e nome de todos os professores ativos.
// Usada para popular o seletor de instrutor no formulário de
// nova aula e nova turma.
// ─────────────────────────────────────────────────────────────
export async function listarProfessores(): Promise<ActionResult<ProfessorSimples[]>> {
  try { await exigirAdmin() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('role', 'professor')
    .order('nome')

  if (error) return { ok: false, error: 'Erro ao buscar professores.' }
  return { ok: true, data: data ?? [] }
}

// ─────────────────────────────────────────────────────────────
// ACTION: criarAula
//
// Cria uma nova instância de aula.
// Validações críticas no servidor:
//   • fim > inicio — o banco não tem CHECK para isso (timestamps)
//   • vagas > 0   — o banco tem CHECK, mas validar aqui dá melhor erro
//   • instrutor existe — implícito pela FK, mas validar antes evita
//     erro genérico do banco para o usuário
// ─────────────────────────────────────────────────────────────
export async function criarAula(input: {
  nome:        string
  emoji?:      string
  instrutorId: string
  local?:      string
  inicio:      string   // ISO datetime: '2026-07-30T09:00:00'
  fim:         string
  vagas:       number
  turmaId?:    string
}): Promise<ActionResult<{ id: string }>> {

  try { await exigirAdmin() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  // Validações no servidor — nunca confiar no frontend
  if (!input.nome?.trim())   return { ok: false, error: 'Nome da aula é obrigatório.' }
  if (!input.instrutorId)    return { ok: false, error: 'Professor é obrigatório.' }
  if (!input.inicio)         return { ok: false, error: 'Horário de início é obrigatório.' }
  if (!input.fim)            return { ok: false, error: 'Horário de término é obrigatório.' }
  if (input.vagas < 1)       return { ok: false, error: 'O número de vagas deve ser pelo menos 1.' }

  // Verifica que o término é depois do início
  if (new Date(input.fim) <= new Date(input.inicio)) {
    return { ok: false, error: 'O horário de término deve ser após o início.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('aulas')
    .insert({
      nome:         input.nome.trim(),
      emoji:        input.emoji?.trim() || null,
      instrutor_id: input.instrutorId,
      local:        input.local?.trim() || null,
      inicio:       input.inicio,
      fim:          input.fim,
      vagas:        input.vagas,
      turma_id:     input.turmaId || null,
      status:       'agendada',
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: 'Erro ao criar aula.' }
  }

  revalidatePath('/pages/admin/agenda')
  return { ok: true, data: { id: data.id } }
}

// ─────────────────────────────────────────────────────────────
// ACTION: cancelarAula
//
// Marca uma aula como cancelada e registra o motivo.
// Não exclui do banco — o histórico é preservado.
//
// Por que verificar a existência antes de atualizar?
//   .update().eq() não retorna erro se nenhuma linha foi afetada —
//   apenas retorna count = 0. Verificamos explicitamente com .select()
//   para dar uma mensagem clara ao admin.
// ─────────────────────────────────────────────────────────────
export async function cancelarAula(
  aulaId:  string,
  motivo?: string
): Promise<ActionResult> {

  try { await exigirAdmin() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  if (!aulaId) return { ok: false, error: 'Aula não identificada.' }

  const supabase = await createClient()

  // Verifica se a aula existe e está agendada
  const { data: aulaExistente } = await supabase
    .from('aulas')
    .select('id, status')
    .eq('id', aulaId)
    .maybeSingle()

  if (!aulaExistente) {
    return { ok: false, error: 'Aula não encontrada.' }
  }

  if (aulaExistente.status !== 'agendada') {
    return { ok: false, error: `Esta aula já está com status "${aulaExistente.status}".` }
  }

  const { error } = await supabase
    .from('aulas')
    .update({
      status:              'cancelada',
      motivo_cancelamento: motivo?.trim() || null,
      cancelada_em:        new Date().toISOString(),
    })
    .eq('id', aulaId)

  if (error) return { ok: false, error: 'Erro ao cancelar aula.' }

  revalidatePath('/pages/admin/agenda')
  return { ok: true, data: undefined }
}
