'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/financeiro.ts
//
// Server Actions de financeiro — CRUD de transações.
//
// POR QUE EM (auth)/actions/ E NÃO EM lib/actions/?
//   Consistência arquitetural: toda operação que exige
//   verificação de autenticação e autorização vive em (auth)/.
//   Isso garante auditabilidade — qualquer código protegido
//   está em um único lugar previsível.
//
// SEGURANÇA EM TRÊS CAMADAS INDEPENDENTES:
//   1. requireRole('admin:financeiro') na página → antes de renderizar
//   2. exigirProprietario() em cada action → antes de qualquer query
//   3. RLS no banco → policy "proprietario gerencia transacoes"
//      bloqueia qualquer query fora do proprietário autenticado
//
// PRINCÍPIO DO MENOR PRIVILÉGIO:
//   Todas as actions usam createClient() (anon key + RLS).
//   A policy já permite todas as operações para o proprietário.
//   createAdminClient() (service_role) não é necessário aqui —
//   só usamos quando o RLS impede uma operação legítima.
//
// IMPORTS E ORIGENS:
//   createClient ← lib/supabase/server  (anon key, respeita RLS)
//   getProfile   ← (auth)/session       (verifica sessão + role)
// ─────────────────────────────────────────────────────────────

import { revalidatePath }  from 'next/cache'
import { createClient }    from '@/lib/supabase/server'
import { getProfile }      from '@/(auth)/session'

// ── Tipos que espelham os CHECKs definidos na tabela no banco ─
type TipoTransacao   = 'receita' | 'despesa'
type MetodoPagamento = 'pix' | 'cartao' | 'boleto' | 'transferencia' | 'dinheiro'

// ── Tipo de retorno padronizado ───────────────────────────────
// Mesmo padrão das outras actions — union type discriminado.
type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string }

// ─────────────────────────────────────────────────────────────
// HELPER INTERNO: exigirProprietario
//
// Definido localmente (sem export) — só este arquivo usa.
// Usa getProfile() de (auth)/session que valida o JWT com
// o servidor Supabase (getUser) — mais seguro que getSession().
//
// Por que não reutilizar o exigirProprietario de usuarios.ts?
//   Cada arquivo de actions define o próprio helper para manter
//   o isolamento de responsabilidades. Se a lógica de autorização
//   do financeiro mudar (ex: permitir funcionário ler mas não
//   escrever), a mudança fica isolada neste arquivo.
// ─────────────────────────────────────────────────────────────
async function exigirProprietario() {
  const profile = await getProfile()

  if (!profile) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (profile.role !== 'proprietario') {
    throw new Error('Acesso negado. Apenas o proprietário pode gerenciar o financeiro.')
  }

  return profile
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarTransacoes
//
// Busca todas as transações de um mês específico.
// Ordenadas por data decrescente — mais recentes no topo.
//
// Por que o campo mes é 'YYYY-MM-01' e não 'YYYY-MM'?
//   O banco armazena o primeiro dia do mês como data completa.
//   Isso permite usar o tipo date do PostgreSQL com índice,
//   em vez de um campo text sem tipagem. O filtro .eq('mes', ...)
//   é mais eficiente do que um range de datas com BETWEEN.
// ─────────────────────────────────────────────────────────────
export async function listarTransacoes(
  mes: string  // formato esperado: 'YYYY-MM' — ex: '2026-07'
): Promise<ActionResult<typeof import('@/types/database').Database extends never ? never : any[]>> {
  try {
    await exigirProprietario()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transacoes')
    .select('*')
    // Converte 'YYYY-MM' para 'YYYY-MM-01' — formato armazenado no banco
    .eq('mes', `${mes}-01`)
    .order('data', { ascending: false })

  if (error) {
    return { ok: false, error: 'Erro ao buscar transações.' }
  }

  return { ok: true, data: data ?? [] }
}

// ─────────────────────────────────────────────────────────────
// ACTION: criarTransacao
//
// Insere uma nova transação (receita ou despesa).
//
// O campo `mes` (mês de referência) usa o `mes_referencia` informado
// pelo proprietário; se omitido, é derivado da data. Assim um
// pagamento de fim de outubro pode ser lançado em novembro.
//
// O campo criado_por registra qual proprietário inseriu —
// audit trail permanente no banco.
//
// revalidatePath: invalida o cache do Server Component da página
// de financeiro para que a próxima visita exiba dados frescos.
// ─────────────────────────────────────────────────────────────
export interface CriarTransacaoInput {
  tipo:              TipoTransacao
  categoria:         string
  descricao?:        string
  valor:             number
  metodo_pagamento?: MetodoPagamento
  data:              string   // formato 'YYYY-MM-DD'
  mes_referencia?:   string   // formato 'YYYY-MM' — padrão: mês da data
}

const TIPOS_VALIDOS:   readonly string[] = ['receita', 'despesa']
const METODOS_VALIDOS: readonly string[] = ['pix', 'cartao', 'boleto', 'transferencia', 'dinheiro']
const REGEX_DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const REGEX_MES  = /^\d{4}-(0[1-9]|1[0-2])$/

// Valida o input e monta os campos graváveis (sem criado_por).
// Compartilhado por criar e atualizar para manter as regras idênticas.
function montarRegistro(input: CriarTransacaoInput):
  | { ok: true; registro: {
      tipo: TipoTransacao; categoria: string; descricao: string | null
      valor: number; metodo_pagamento: MetodoPagamento | null
      data: string; mes: string
    } }
  | { ok: false; error: string } {
  if (!TIPOS_VALIDOS.includes(input.tipo))
    return { ok: false, error: 'Tipo inválido.' }
  if (!Number.isFinite(input.valor) || input.valor <= 0)
    return { ok: false, error: 'O valor deve ser maior que zero.' }
  if (!input.categoria?.trim())
    return { ok: false, error: 'Categoria é obrigatória.' }
  if (!input.data || !REGEX_DATA.test(input.data))
    return { ok: false, error: 'Data inválida.' }
  if (input.metodo_pagamento && !METODOS_VALIDOS.includes(input.metodo_pagamento))
    return { ok: false, error: 'Método de pagamento inválido.' }
  if (input.mes_referencia && !REGEX_MES.test(input.mes_referencia))
    return { ok: false, error: 'Mês de referência inválido.' }

  // '2026-07-15' → '2026-07'; o mês de referência informado tem prioridade
  const mesRef = input.mes_referencia || input.data.substring(0, 7)

  return {
    ok: true,
    registro: {
      tipo:             input.tipo,
      categoria:        input.categoria.trim(),
      descricao:        input.descricao?.trim() || null,
      valor:            input.valor,
      metodo_pagamento: input.metodo_pagamento || null,
      data:             input.data,
      mes:              `${mesRef}-01`,
    },
  }
}

export async function criarTransacao(
  input: CriarTransacaoInput
): Promise<ActionResult> {
  let profile
  try {
    profile = await exigirProprietario()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  // O frontend valida também, mas o servidor é a fonte de verdade.
  const validado = montarRegistro(input)
  if (!validado.ok) return validado

  const supabase = await createClient()

  const { error } = await supabase
    .from('transacoes')
    .insert({ ...validado.registro, criado_por: profile.id })

  if (error) {
    console.error('[financeiro] criarTransacao:', error.code, error.message)
    return { ok: false, error: 'Erro ao salvar transação.' }
  }

  // Invalida o cache do Server Component da página de financeiro.
  revalidatePath('/pages/admin/financeiro')
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: atualizarTransacao
//
// Edita uma transação existente com as mesmas regras de validação
// da criação. criado_por (audit trail) não é alterado.
// ─────────────────────────────────────────────────────────────
export async function atualizarTransacao(
  id:    string,
  input: CriarTransacaoInput
): Promise<ActionResult> {
  try {
    await exigirProprietario()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  if (!id) return { ok: false, error: 'ID inválido.' }

  const validado = montarRegistro(input)
  if (!validado.ok) return validado

  const supabase = await createClient()

  // .select('id') permite detectar update sem linha afetada
  // (id inexistente ou bloqueado pelo RLS).
  const { data, error } = await supabase
    .from('transacoes')
    .update(validado.registro)
    .eq('id', id)
    .select('id')

  if (error) {
    console.error('[financeiro] atualizarTransacao:', error.code, error.message)
    return { ok: false, error: 'Erro ao atualizar transação.' }
  }

  if (!data || data.length === 0) {
    return { ok: false, error: 'Transação não encontrada.' }
  }

  revalidatePath('/pages/admin/financeiro')
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: excluirTransacao
//
// Remove uma transação pelo id.
// Usa createClient() (anon key + RLS) — a policy já permite
// DELETE para o proprietário. service_role não é necessário.
// ─────────────────────────────────────────────────────────────
export async function excluirTransacao(id: string): Promise<ActionResult> {
  try {
    await exigirProprietario()
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }

  if (!id) return { ok: false, error: 'ID inválido.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('transacoes')
    .delete()
    .eq('id', id)

  if (error) {
    return { ok: false, error: 'Erro ao excluir transação.' }
  }

  revalidatePath('/pages/admin/financeiro')
  return { ok: true, data: undefined }
}

// ─────────────────────────────────────────────────────────────
// ACTION: resumoFinanceiro
//
// Calcula receitas, despesas e lucro líquido de um mês.
// Busca apenas tipo e valor (não todos os campos) — mais eficiente.
//
// Retorna zeros em caso de erro ou mês sem dados —
// nunca lança exceção para não quebrar o render da página.
// ─────────────────────────────────────────────────────────────
export interface ResumoFinanceiro {
  receitas: number
  despesas: number
  lucro:    number
}

export async function resumoFinanceiro(
  mes: string
): Promise<ResumoFinanceiro> {
  try {
    await exigirProprietario()
  } catch {
    return { receitas: 0, despesas: 0, lucro: 0 }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transacoes')
    .select('tipo, valor')
    .eq('mes', `${mes}-01`)

  if (error || !data) {
    return { receitas: 0, despesas: 0, lucro: 0 }
  }

  const receitas = data
    .filter((t) => t.tipo === 'receita')
    .reduce((soma, t) => soma + (t.valor ?? 0), 0)

  const despesas = data
    .filter((t) => t.tipo === 'despesa')
    .reduce((soma, t) => soma + (t.valor ?? 0), 0)

  return { receitas, despesas, lucro: receitas - despesas }
}

// ─────────────────────────────────────────────────────────────
// ACTION: listarTransacoesPorCategoria
//
// Agrupa receitas ou despesas por categoria para os gráficos.
// Retorna array ordenado por valor decrescente.
// ─────────────────────────────────────────────────────────────
export interface TransacaoPorCategoria {
  categoria: string
  total:     number
  quantidade: number
}

export async function listarTransacoesPorCategoria(
  mes:  string,
  tipo: TipoTransacao
): Promise<TransacaoPorCategoria[]> {
  try {
    await exigirProprietario()
  } catch {
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transacoes')
    .select('categoria, valor')
    .eq('mes',  `${mes}-01`)
    .eq('tipo', tipo)

  if (error || !data) return []

  // Agrupa por categoria no JavaScript.
  // Para volumes pequenos (financeiro de uma academia), isso é
  // mais simples e suficiente do que uma View ou RPC no banco.
  const agrupado = data.reduce<Record<string, { total: number; quantidade: number }>>(
    (acc, t) => {
      const key = t.categoria
      if (!acc[key]) acc[key] = { total: 0, quantidade: 0 }
      acc[key].total     += t.valor ?? 0
      acc[key].quantidade += 1
      return acc
    },
    {}
  )

  return Object.entries(agrupado)
    .map(([categoria, { total, quantidade }]) => ({ categoria, total, quantidade }))
    .sort((a, b) => b.total - a.total)
}
