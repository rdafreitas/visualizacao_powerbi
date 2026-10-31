'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/matriculas.ts
//
// Server Actions de matrículas e planos — Módulo Admin.
//
// DOMÍNIO:
//   Gerencia o vínculo entre alunos (profiles com role='aluno')
//   e planos contratados. Separado de usuarios.ts porque são
//   domínios distintos: um usuário pode existir sem matrícula
//   (professor, funcionário) e uma matrícula sem usuário é
//   inválida pelo banco (FK com ON DELETE CASCADE).
//
// AUTORIZAÇÃO:
//   exigirAdmin() aceita proprietario E funcionario.
//   Diferente de exigirProprietario() (apenas proprietario).
//   Funcionários podem gerenciar matrículas mas não podem:
//     • criar/excluir usuários no sistema
//     • acessar o financeiro completo
//     • gerenciar acessos e senhas
//
// PRINCÍPIO DO MENOR PRIVILÉGIO:
//   listarPlanos        → createClient (anon key + RLS)
//   listarAlunos        → createClient (anon key + RLS)
//   criarMatricula      → createClient (anon key + RLS)
//   atualizarStatus     → createClient (anon key + RLS)
//   Nenhuma action aqui precisa de service_role — as policies
//   "admin gerencia matrículas" e "autenticados leem planos"
//   cobrem todas as operações necessárias.
//
// IMPORTS E ORIGENS:
//   createClient  ← lib/supabase/server  (anon key, respeita RLS)
//   getProfile    ← (auth)/session       (valida JWT com Supabase)
// ─────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache'
import { createClient }  from '@/lib/supabase/server'
import { getProfile }    from '@/(auth)/session'

// ── Tipo de retorno padronizado ────────────────────────────────
type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

// ── Status válidos — espelha o CHECK do banco ─────────────────
type MatriculaStatus = 'ativo' | 'inadimplente' | 'experimental' | 'inativo'

// ── Tipo normalizado de aluno para a tela de Alunos ──────────
export interface AlunoComMatricula {
  id:           string
  nome:         string
  email:        string
  telefone:     string | null
  createdAt:    string
  // Dados da matrícula mais recente (null se nunca matriculado)
  matriculaId:  string | null
  planoNome:    string | null
  planoValor:   number | null
  status:       MatriculaStatus | null
  inicio:       string | null
  vencimento:   string | null
}

// ── Tipo de plano para o seletor do formulário ────────────────
export interface PlanoRow {
  id:         string
  nome:       string
  valor:      number
  max_modal:  number
  fidelidade: number
}

// ─────────────────────────────────────────────────────────────
// HELPER INTERNO: exigirAdmin
//
// Aceita proprietario E funcionario — ambos podem gerenciar
// matrículas. Diferente de exigirProprietario (apenas proprietario).
// ─────────────────────────────────────────────────────────────
async function exigirAdmin() {
  const profile = await getProfile()

  if (!profile) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (!['proprietario', 'funcionario'].includes(profile.role)) {
    throw new Error('Acesso negado. Esta ação exige perfil de administrador.')
  }

  return profile
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarPlanos
//
// Retorna todos os planos ativos para popular o seletor
// do formulário de nova matrícula.
//
// Por que sem exigirAdmin()?
//   A policy "autenticados leem planos" já exige auth.uid() IS NOT NULL.
//   Qualquer usuário autenticado pode ler planos — não há dado sensível.
//   Aplicar exigirAdmin() seria mais restritivo que necessário.
// ─────────────────────────────────────────────────────────────
export async function listarPlanos(): Promise<ActionResult<PlanoRow[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('planos')
    .select('id, nome, valor, max_modal, fidelidade')
    .eq('ativo', true)
    .order('valor', { ascending: true })

  if (error) return { ok: false, error: 'Erro ao buscar planos.' }
  return { ok: true, data: data ?? [] }
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarAlunosComMatricula
//
// Busca todos os profiles com role='aluno' e faz JOIN com
// matriculas e planos em uma única query.
//
// Por que uma query com JOIN em vez de queries separadas?
//   Queries separadas causam N+1: uma para alunos, N para
//   matrículas (uma por aluno). O JOIN retorna tudo em uma
//   única ida ao banco — mais eficiente e mais simples.
//
// Por que !profiles_credencial_profile_id_fkey?
//   profiles_credencial tem duas FKs para profiles:
//     profile_id (1:1) e criado_por (N:1).
//   Sem o hint de FK explícito, o PostgREST não sabe qual usar
//   e retorna PGRST201 (relação ambígua).
//   O hint aponta para a FK 1:1 correta.
// ─────────────────────────────────────────────────────────────
export async function listarAlunosComMatricula(): Promise<
  ActionResult<AlunoComMatricula[]>
> {
  try {
    await exigirAdmin()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nome,
      telefone,
      created_at,
      profiles_credencial!profiles_credencial_profile_id_fkey (
        email
      ),
      matriculas (
        id,
        status,
        inicio,
        vencimento,
        planos (
          nome,
          valor
        )
      )
    `)
    .eq('role', 'aluno')
    .order('nome', { ascending: true })

  if (error) {
    console.error('[Alunos] Falha ao listar', {
      codigo:   error.code,
      mensagem: error.message,
    })
    return { ok: false, error: 'Erro ao buscar alunos.' }
  }

  const alunos: AlunoComMatricula[] = (data ?? []).map((p) => {
    // Email via JOIN 1:1 — pode vir como objeto ou array[0]
    const cred = Array.isArray(p.profiles_credencial)
      ? p.profiles_credencial[0]
      : p.profiles_credencial

    // Matrícula mais recente — ordena por inicio decrescente
    // e pega o primeiro registro. Um aluno pode ter histórico
    // de múltiplas matrículas (ex: cancelou e voltou).
    const matricula = (p.matriculas ?? [])
      .sort((a, b) => (b.inicio ?? '').localeCompare(a.inicio ?? ''))
      .at(0) ?? null

    // planos vem como objeto único (FK N:1 de matriculas → planos)
    const plano = matricula
      ? Array.isArray(matricula.planos)
        ? matricula.planos[0]
        : matricula.planos
      : null

    return {
      id:          p.id,
      nome:        p.nome,
      email:       cred?.email    ?? '—',
      telefone:    p.telefone,
      createdAt:   p.created_at,
      matriculaId: matricula?.id         ?? null,
      planoNome:   plano?.nome           ?? null,
      planoValor:  plano?.valor          ?? null,
      status:      (matricula?.status as MatriculaStatus) ?? null,
      inicio:      matricula?.inicio     ?? null,
      vencimento:  matricula?.vencimento ?? null,
    }
  })

  return { ok: true, data: alunos }
}

// ─────────────────────────────────────────────────────────────
// ACTION: criarMatricula
//
// Cria uma nova matrícula para um aluno existente.
// O aluno já deve existir em profiles (criado via tela de Acessos).
//
// O vencimento é calculado no servidor com base na fidelidade
// do plano — regra de negócio que não pode ficar no frontend.
//
// Por que verificar se já existe matrícula ativa?
//   Sem essa verificação, um clique duplo no botão poderia criar
//   duas matrículas ativas para o mesmo aluno. O banco não tem
//   UNIQUE (aluno_id) em matriculas porque um aluno pode ter
//   histórico de matrículas anteriores — a proteção precisa ser
//   feita na camada de aplicação.
// ─────────────────────────────────────────────────────────────
export async function criarMatricula(input: {
  alunoId:  string
  planoId:  string
  status?:  MatriculaStatus
}): Promise<ActionResult<{ id: string }>> {

  try {
    await exigirAdmin()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  if (!input.alunoId) return { ok: false, error: 'Aluno não informado.' }
  if (!input.planoId) return { ok: false, error: 'Plano não informado.' }

  const supabase = await createClient()

  // Verifica se já existe matrícula ativa ou experimental para o aluno
  const { data: matriculaExistente } = await supabase
    .from('matriculas')
    .select('id, status')
    .eq('aluno_id', input.alunoId)
    .in('status', ['ativo', 'experimental'])
    .maybeSingle()

  if (matriculaExistente) {
    return {
      ok:    false,
      error: `Este aluno já possui matrícula ${matriculaExistente.status}. Atualize o status em vez de criar uma nova.`,
    }
  }

  // Busca o plano para calcular o vencimento
  const { data: plano, error: planoError } = await supabase
    .from('planos')
    .select('fidelidade')
    .eq('id', input.planoId)
    .single()

  if (planoError || !plano) {
    return { ok: false, error: 'Plano não encontrado.' }
  }

  // Vencimento = hoje + fidelidade do plano (mínimo 1 mês)
  // Regra de negócio calculada no servidor — nunca no frontend.
  const mesesContrato = Math.max(plano.fidelidade ?? 0, 1)
  const hoje      = new Date()
  const vencimento = new Date(hoje)
  vencimento.setMonth(vencimento.getMonth() + mesesContrato)

  const { data, error } = await supabase
    .from('matriculas')
    .insert({
      aluno_id:   input.alunoId,
      plano_id:   input.planoId,
      status:     input.status ?? 'experimental',
      inicio:     hoje.toISOString().split('T')[0],
      vencimento: vencimento.toISOString().split('T')[0],
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: 'Erro ao criar matrícula.' }
  }

  revalidatePath('/pages/admin/alunos')
  return { ok: true, data: { id: data.id } }
}

// ─────────────────────────────────────────────────────────────
// ACTION: atualizarStatusMatricula
//
// Atualiza o status de uma matrícula existente.
// Não bloqueia o login do aluno — para isso use alterarStatusAcesso
// em usuarios.ts. São conceitos separados:
//   • matrícula inadimplente ≠ acesso suspenso
//   • o aluno inadimplente ainda pode logar e ver seus dados
//
// Por que o .eq('aluno_id', alunoId) duplo?
//   Segurança extra além do .eq('id', matriculaId).
//   Garante que a matrícula pertence ao aluno informado.
//   Sem isso, um id de matrícula de outro aluno poderia ser
//   atualizado se alguém forjar a requisição.
// ─────────────────────────────────────────────────────────────
const STATUS_VALIDOS: MatriculaStatus[] = ['ativo', 'inadimplente', 'experimental', 'inativo']

export async function atualizarStatusMatricula(
  matriculaId: string,
  alunoId:     string,
  novoStatus:  MatriculaStatus
): Promise<ActionResult> {

  try {
    await exigirAdmin()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  if (!matriculaId)                          return { ok: false, error: 'Matrícula não informada.' }
  if (!alunoId)                              return { ok: false, error: 'Aluno não informado.' }
  if (!STATUS_VALIDOS.includes(novoStatus))  return { ok: false, error: 'Status inválido.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('matriculas')
    .update({ status: novoStatus })
    .eq('id', matriculaId)
    .eq('aluno_id', alunoId)   // verificação dupla de segurança

  if (error) return { ok: false, error: 'Erro ao atualizar status da matrícula.' }

  revalidatePath('/pages/admin/alunos')
  return { ok: true, data: undefined }
}
