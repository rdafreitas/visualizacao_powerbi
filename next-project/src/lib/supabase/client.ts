// ─────────────────────────────────────────────────────────────
// src/lib/supabase/client.ts
//
// Cliente Supabase para uso em Client Components (browser).
//
// POR QUE existe um cliente separado para o browser?
// O Next.js tem três ambientes de execução:
//   1. Browser (Client Components)
//   2. Servidor Node.js (Server Components, Server Actions)
//   3. Middleware (Edge Runtime)
//
// Cada ambiente acessa cookies de uma forma diferente.
// Este arquivo usa createBrowserClient, que lê e grava cookies
// diretamente no documento do browser via document.cookie.
//
// REGRA: importe este arquivo apenas em arquivos com 'use client'.
// Nunca em Server Components, layouts ou middleware.
// ─────────────────────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  // As variáveis NEXT_PUBLIC_* são embutidas no bundle do browser
  // pelo Next.js em tempo de build. São públicas por design —
  // a anon key identifica o projeto mas não é um segredo:
  // o RLS no banco é o que protege os dados, não esta chave.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
