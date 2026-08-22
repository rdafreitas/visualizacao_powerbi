// ─────────────────────────────────────────────────────────────
// src/lib/supabase/middleware.ts
// Lógica de sessão usada pelo middleware do Next.js.
// Atualiza o cookie de sessão e retorna o usuário + role.
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import type { Role } from '@/types/app'

/**
 * Cria um cliente Supabase compatível com o middleware do Next.js
 * (que usa RequestCookies em vez do cookie store do servidor).
 * Também atualiza automaticamente o cookie de sessão expirado.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  // Atualiza a sessão (necessário para SSR funcionar corretamente)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Busca o role do usuário autenticado
  let role: Role | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = (profile?.role as Role) ?? null
  }

  return { supabaseResponse, user, role }
}
