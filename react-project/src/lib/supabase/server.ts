// ─────────────────────────────────────────────────────────────
// src/lib/supabase/server.ts
// Cliente Supabase para Server Components e Server Actions.
// NUNCA importe este arquivo em Client Components ('use client').
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Cria um cliente Supabase com acesso ao cookie store do Next.js.
 * Use em Server Components, layouts e Server Actions.
 */
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
            // setAll pode ser chamado de um Server Component — ignorar o erro.
            // O middleware garante que a sessão seja atualizada.
          }
        },
      },
    }
  )
}

/**
 * Busca o perfil completo do usuário autenticado.
 * Retorna null se não houver sessão ativa.
 */
export async function getProfile() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return null

  return {
    id:        profile.id,
    nome:      profile.nome,
    email:     user.email ?? '',
    role:      profile.role,
    telefone:  profile.telefone ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    createdAt: profile.created_at,
  }
}
