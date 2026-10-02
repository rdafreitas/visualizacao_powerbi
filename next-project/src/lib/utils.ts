// --------------------------------------------------------------
// src/lib/utils.ts
// Funções utilitárias reutilizáveis para o projeto
// --------------------------------------------------------------

// 1. Classes CSS (utilidades condicionais)

/** Combina múltiplas classes CSS em uma única string (substituto simples de clsx) */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
