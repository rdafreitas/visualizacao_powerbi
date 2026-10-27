// src/lib/supabase/server.ts
//
// Cliente Supabase com anon key para o ambiente de servidor Node.js.
//
// REGRA DE USO:
//   Importe em Server Components, layouts e arquivos 'use server'.
//   Nunca em Client Components ('use client').
//   Nunca em src/proxy.ts (use lib/supabase/proxy.ts).
//
// RESPONSABILIDADE ÚNICA:
//   Este arquivo cria apenas o cliente base com a anon key.
//   Ele respeita o RLS — só retorna dados que as policies permitem
//   para o usuário autenticado na sessão atual.
//
//   Para operações privilegiadas (service_role): use lib/supabase/admin.ts
//   Para buscar o perfil do usuário:             use (auth)/session.ts
//
// POR QUE cookies() é diferente do browser?
//   No servidor Node.js, cookies são gerenciados pelo Next.js via
//   a função cookies() do pacote 'next/headers'. Essa API não existe
//   no browser. O @supabase/ssr abstrai essa diferença com a
//   interface { getAll, setAll } que passamos aqui.
//
// O bloco try/catch em setAll:
//   Server Components são somente leitura — eles não podem gravar
//   cookies. Se createClient() for chamado de um Server Component
//   (e não de uma Server Action), o setAll lançaria uma exceção ao
//   tentar gravar. O try/catch suprime esse erro silenciosamente.
//   O Proxy garante que os cookies de sessão sejam renovados
//   a cada requisição, então o Server Component não precisa fazer isso.
//   Referência: https://supabase.com/docs/guides/auth/server-side/nextjs

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Chamado de Server Component — ignorar.
            // O Proxy renova a sessão entre requisições.
          }
        },
      },
    }
  )
}
