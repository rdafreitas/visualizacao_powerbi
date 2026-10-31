'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/professores-admin.ts
//
// Server Actions de professores para o módulo Admin.
// JOIN mais rico que listarProfessores() de agenda-admin.ts:
// inclui métricas de turmas, alunos e remuneração do mês.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server'
import { getProfile }   from '@/(auth)/session'

type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

async function exigirAdmin() {
  const profile = await getProfile()
  if (!profile)
    throw new Error('Sessão expirada. Faça login novamente.')
  if (!['proprietario', 'funcionario'].includes(profile.role))
    throw new Error('Acesso negado.')
  return profile
}

// ── Tipo exportado para o Client Component ────────────────────
export interface ProfessorComMetricas {
  id:               string
  nome:             string
  email:            string
  telefone:         string | null
  createdAt:        string
  turmasAtivas:     number
  modalidades:      string[]      // modalidades distintas das turmas ativas
  remuneracaoMes:   number        // soma de pagamentos_professores no mês atual
  pagoMes:          number        // quanto já foi pago no mês
  ativo:            boolean       // profiles_credencial.ativo
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarProfessoresComMetricas
//
// Busca todos os professores com JOIN em:
//   profiles_credencial → email e ativo
//   turmas              → contagem de turmas ativas + modalidades
//   pagamentos_professores → remuneração do mês atual
//
// Por que calcular métricas no JS e não no banco?
//   O cliente Supabase JS não suporta COUNT() ou SUM() em embeds.
//   Para o volume de dados de uma academia (dezenas de professores,
//   centenas de turmas), calcular no JS após o fetch é mais simples
//   e suficientemente eficiente.
// ─────────────────────────────────────────────────────────────
export async function listarProfessoresComMetricas(): Promise<
  ActionResult<ProfessorComMetricas[]>
> {
  try { await exigirAdmin() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase   = await createClient()
  const mesAtual   = `${new Date().toISOString().substring(0, 7)}-01`

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, nome, telefone, created_at,
      profiles_credencial!profiles_credencial_profile_id_fkey (
        email, ativo
      ),
      turmas!turmas_professor_id_fkey (
        id, modalidade, ativa
      ),
      pagamentos_professores!pagamentos_professores_professor_id_fkey (
        valor, pago, mes
      )
    `)
    .eq('role', 'professor')
    .order('nome')

  if (error) {
    console.error('[Professores] Falha ao listar', { codigo: error.code })
    return { ok: false, error: 'Erro ao buscar professores.' }
  }

  const professores: ProfessorComMetricas[] = (data ?? []).map((p) => {
    const cred = Array.isArray(p.profiles_credencial)
      ? p.profiles_credencial[0]
      : p.profiles_credencial

    const turmas = Array.isArray(p.turmas) ? p.turmas : []
    const pagamentos = Array.isArray(p.pagamentos_professores)
      ? p.pagamentos_professores
      : []

    // Turmas ativas e modalidades distintas
    const turmasAtivas = turmas.filter((t) => t.ativa)
    const modalidades  = [...new Set(turmasAtivas.map((t) => t.modalidade))]

    // Remuneração do mês atual — soma e quanto já foi pago
    const pagsMes       = pagamentos.filter((pg) => pg.mes === mesAtual)
    const remuneracaoMes = pagsMes.reduce((s, pg) => s + (pg.valor ?? 0), 0)
    const pagoMes        = pagsMes
      .filter((pg) => pg.pago)
      .reduce((s, pg) => s + (pg.valor ?? 0), 0)

    return {
      id:             p.id,
      nome:           p.nome,
      email:          cred?.email    ?? '—',
      telefone:       p.telefone,
      createdAt:      p.created_at,
      turmasAtivas:   turmasAtivas.length,
      modalidades,
      remuneracaoMes,
      pagoMes,
      ativo:          cred?.ativo    ?? true,
    }
  })

  return { ok: true, data: professores }
}
