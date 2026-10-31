'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/pagamentos-professor.ts
//
// Server Actions de pagamentos para o professor.
// Lê pagamentos_professores preenchidos automaticamente pelo
// trigger calcular_pagamento_professor após cada check-in.
//
// SEGURANÇA:
//   exigirProfessor() + .eq('professor_id', profile.id)
//   O professor só lê seus próprios pagamentos.
//   Policy "professor vê seus pagamentos" reforça no RLS.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server'
import { getProfile }   from '@/(auth)/session'

type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

// ── Tipos exportados ──────────────────────────────────────────

export interface PagamentoDetalhe {
  id:       string
  aulaId:   string
  aulaNome: string
  aulaEmoji:string | null
  inicio:   string   // timestamptz ISO da aula
  presencas:number
  valor:    number
  pago:     boolean
}

export interface MesHistorico {
  mes:            string   // 'YYYY-MM-01'
  totalValor:     number
  totalPresencas: number
  totalAulas:     number
  todoPago:       boolean
}

// ── Helper ────────────────────────────────────────────────────
async function exigirProfessor() {
  const profile = await getProfile()
  if (!profile)
    throw new Error('Sessão expirada.')
  if (profile.role !== 'professor')
    throw new Error('Acesso negado.')
  return profile
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarPagamentosProfessor
//
// Retorna pagamentos de um mês específico com dados da aula.
// mes: formato 'YYYY-MM' — convertido para 'YYYY-MM-01' no banco.
// ─────────────────────────────────────────────────────────────
export async function listarPagamentosProfessor(
  mes: string   // 'YYYY-MM'
): Promise<ActionResult<PagamentoDetalhe[]>> {

  let profile
  try { profile = await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pagamentos_professores')
    .select(`
      id, presencas, valor, pago,
      aula_id,
      aulas!pagamentos_professores_aula_id_fkey (
        nome, emoji, inicio
      )
    `)
    .eq('professor_id', profile.id)
    .eq('mes', `${mes}-01`)
    .order('aula_id')

  if (error) {
    console.error('[Pagamentos] Falha ao listar', { codigo: error.code })
    return { ok: false, error: 'Erro ao buscar pagamentos.' }
  }

  const pagamentos: PagamentoDetalhe[] = (data ?? []).map((p) => {
    const aula = Array.isArray(p.aulas) ? p.aulas[0] : p.aulas
    return {
      id:        p.id,
      aulaId:    p.aula_id,
      aulaNome:  aula?.nome   ?? 'Aula',
      aulaEmoji: aula?.emoji  ?? null,
      inicio:    aula?.inicio ?? '',
      presencas: p.presencas,
      valor:     p.valor,
      pago:      p.pago,
    }
  }).sort((a, b) => b.inicio.localeCompare(a.inicio))  // mais recentes primeiro

  return { ok: true, data: pagamentos }
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarHistoricoPagamentos
//
// Retorna todos os pagamentos do professor agrupados por mês.
// Usado para popular o seletor de mês e o card de histórico.
// ─────────────────────────────────────────────────────────────
export async function listarHistoricoPagamentos(): Promise<ActionResult<MesHistorico[]>> {

  let profile
  try { profile = await exigirProfessor() }
  catch (err) { return { ok: false, error: (err as Error).message } }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pagamentos_professores')
    .select('mes, valor, pago, presencas')
    .eq('professor_id', profile.id)
    .order('mes', { ascending: false })

  if (error) return { ok: false, error: 'Erro ao buscar histórico.' }

  // Agrupa por mês no JS — COUNT, SUM e FLAG de pagamento
  const porMes = (data ?? []).reduce<Record<string, MesHistorico>>(
    (acc, p) => {
      if (!acc[p.mes]) {
        acc[p.mes] = {
          mes:            p.mes,
          totalValor:     0,
          totalPresencas: 0,
          totalAulas:     0,
          todoPago:       true,
        }
      }
      acc[p.mes].totalValor     += p.valor     ?? 0
      acc[p.mes].totalPresencas += p.presencas ?? 0
      acc[p.mes].totalAulas     += 1
      if (!p.pago) acc[p.mes].todoPago = false
      return acc
    },
    {}
  )

  return {
    ok:   true,
    data: Object.values(porMes).sort((a, b) => b.mes.localeCompare(a.mes)),
  }
}
