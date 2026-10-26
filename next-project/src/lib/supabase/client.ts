// src/lib/supabase/client.ts
//
// Cliente Supabase para Client Components (browser).
//
// REGRA DE USO:
//   Importe apenas em arquivos com 'use client'.
//   Nunca em Server Components, layouts ou middleware.
//
// SOBRE A ANON KEY NO BROWSER:
//   NEXT_PUBLIC_SUPABASE_ANON_KEY aparece no bundle JavaScript
//   enviado ao browser — isso é intencional e documentado pelo
//   Supabase. Ela não é um segredo: identifica o projeto, mas
//   não concede acesso a dados. O RLS (Row Level Security) no
//   banco PostgreSQL é o que controla quem acessa o quê.
//   Referência: https://supabase.com/docs/guides/auth/server-side/nextjs
//
// SOBRE O SINGLETON:
//   createBrowserClient é memoizado internamente — chamadas
//   múltiplas retornam a mesma instância, evitando conexões
//   duplicadas e re-renderizações desnecessárias.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
