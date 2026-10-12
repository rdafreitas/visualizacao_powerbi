// ─────────────────────────────────────────────────────────────
// src/lib/supabase/middleware.ts
//
// Cliente Supabase para o middleware do Next.js (Edge Runtime).
//
// POR QUE um terceiro cliente?
// O middleware roda no Edge Runtime do Next.js, antes de qualquer
// Server Component ou Client Component. Neste ambiente, os cookies
// são acessados via request.cookies (RequestCookies), não via
// cookies() do 'next/headers'. A API é diferente.
//
// Esta função também lê o role do usuário via profiles para que o
// middleware possa tomar decisões de roteamento sem um round-trip
// extra no Server Component.
//
// REGRA: importe este arquivo apenas em src/middleware.ts.
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import type { Role } from '@/types/app'

export async function updateSession(request: NextRequest) {
  // Começa com uma resposta de "continuar normalmente"
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Lê cookies da requisição recebida
        getAll() {
          return request.cookies.getAll()
        },
        // Grava cookies na resposta que será enviada ao browser.
        // O middleware precisa gravar os cookies de sessão renovados
        // a cada requisição para manter a sessão viva.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: getUser() deve ser chamado sem await em paralelo com
  // outras operações — ele renova o token JWT se estiver próximo do vencimento.
  // Não use getSession() aqui: ele lê o token do cookie sem validar
  // com o servidor, o que pode deixar sessões expiradas passarem.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Busca o role do usuário autenticado para decisões de roteamento.
  // Retorna null se não houver sessão ativa.
  let role: Role | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = (data?.role as Role) ?? null
  }

  return { supabaseResponse, user, role }
}
