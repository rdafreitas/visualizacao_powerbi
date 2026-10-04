// --------------------------------------------------------------
// src/lib/utils.ts
// Funções utilitárias reutilizáveis para o projeto
// --------------------------------------------------------------

// 1. Classes CSS (utilidades condicionais)

/** Combina múltiplas classes CSS em uma única string (substituto simples de clsx) */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}


// 2. Strings ───────────────────────────────────────────────────

/** Retorna as iniciais de um nome (máximo 2 letras) */
export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('')
}


// 3. Cores de avatar ───────────────────────────────────────────
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