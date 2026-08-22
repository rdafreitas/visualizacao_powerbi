// ─────────────────────────────────────────────────────────────
// src/lib/supabase/client.ts
// Cliente Supabase para Client Components ('use client').
// Use apenas em componentes com interatividade no browser.
// ─────────────────────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Cria um cliente Supabase para uso no browser.
 * Pode ser chamado em qualquer Client Component.
 * O cliente gerencia a sessão automaticamente via cookies.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
