// ─────────────────────────────────────────────────────────────
// src/lib/utils.ts
// Funções utilitárias reutilizáveis em toda a aplicação
// ─────────────────────────────────────────────────────────────

// ── Financeiro ────────────────────────────────────────────────

/**
 * Regra de pagamento do professor por aula:
 * - menos de 3 presenças → R$ 30,00
 * - 3 ou mais presenças  → R$ 50,00
 */
export function calcValorAula(presencas: number): number {
  return presencas >= 3 ? 50 : 30
}

/**
 * Formata um número como moeda BRL
 * Ex: 1500 → "R$ 1.500,00"
 */
export function formatBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  })
}

/**
 * Formata um número compacto para exibição em cards
 * Ex: 18240 → "R$ 18,2k"
 */
export function formatBRLCompact(valor: number): string {
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(1).replace('.', ',')}k`
  }
  return formatBRL(valor)
}

// ── Datas ─────────────────────────────────────────────────────

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const MESES_CURTO = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

const DIAS_SEMANA_FULL = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
]

const DIAS_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Retorna o nome completo do mês (0-based) */
export function nomeMes(mesIndex: number): string {
  return MESES[mesIndex] ?? ''
}

/** Retorna o nome abreviado do mês (0-based) */
export function nomeMesCurto(mesIndex: number): string {
  return MESES_CURTO[mesIndex] ?? ''
}

/** Retorna o nome completo do dia da semana */
export function nomeDiaSemana(date: Date): string {
  return DIAS_SEMANA_FULL[date.getDay()] ?? ''
}

/** Retorna o nome abreviado do dia da semana */
export function nomeDiaSemanasCurto(date: Date): string {
  return DIAS_SEMANA_CURTO[date.getDay()] ?? ''
}

/**
 * Formata uma data para exibição longa
 * Ex: new Date(2026, 6, 30) → "Quarta-feira, 30 de julho de 2026"
 */
export function formatDataLonga(date: Date): string {
  const dia  = date.getDate()
  const mes  = MESES[date.getMonth()].toLowerCase()
  const ano  = date.getFullYear()
  const dow  = DIAS_SEMANA_FULL[date.getDay()]
  return `${dow}, ${dia} de ${mes} de ${ano}`
}

/**
 * Formata uma data para exibição curta
 * Ex: new Date(2026, 6, 30) → "30 de julho de 2026"
 */
export function formatDataCurta(date: Date): string {
  const dia = date.getDate()
  const mes = MESES[date.getMonth()].toLowerCase()
  const ano = date.getFullYear()
  return `${dia} de ${mes} de ${ano}`
}

/**
 * Retorna o primeiro dia do mês como string ISO
 * Ex: (2026, 6) → "2026-07-01"
 */
export function primeiroDiaMes(ano: number, mes: number): string {
  return new Date(ano, mes, 1).toISOString().split('T')[0]
}

// ── Strings ───────────────────────────────────────────────────

/** Retorna as iniciais de um nome (máximo 2 letras) */
export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('')
}

/** Converte string para slug URL-safe */
export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ── Cores de avatar ───────────────────────────────────────────
const AVATAR_COLORS = [
  '#2D1B69', '#FF6B35', '#06D6A0', '#EF476F',
  '#FFD166', '#3D2A85', '#04956E', '#FF4500',
]

/** Retorna uma cor de avatar baseada no índice */
export function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

/** Retorna uma cor de avatar baseada na primeira letra do nome */
export function avatarColorByName(nome: string): string {
  const code = nome.charCodeAt(0) || 0
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

// ── Classes CSS (utilidades condicionais) ─────────────────────

/** Une classes condicionalmente (substituto simples de clsx) */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
