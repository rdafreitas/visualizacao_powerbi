// ─────────────────────────────────────────────────────────────
// src/lib/supabase/server.ts
//
// Clientes Supabase para Server Components e Server Actions.
//
// POR QUE é diferente do client.ts?
// No servidor, o Next.js expõe cookies via a função cookies()
// do pacote 'next/headers'. Essa API não existe no browser.
// createServerClient lê e grava a sessão usando esse cookieStore.
//
// REGRA: importe este arquivo apenas em Server Components,
// layouts de servidor e arquivos 'use server'.
// Nunca em Client Components ('use client').
// ─────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// ── Cliente com anon key ──────────────────────────────────────
// Respeita o RLS — enxerga apenas o que as policies permitem
// para o usuário autenticado na sessão atual.
// Use em Server Components e Server Actions que não precisam
// de permissão elevada.
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
            // Server Components não podem gravar cookies diretamente.
            // Quando chamado de um Server Component (não de uma Action),
            // este bloco é ignorado. O middleware garante que a sessão
            // permaneça atualizada entre requisições.
          }
        },
      },
    }
  )
}

// ── Cliente com service_role key ──────────────────────────────
// BYPASSA completamente o RLS — acesso total ao banco.
// Use APENAS em Server Actions que exigem operações administrativas:
//   - criar usuários no Auth (auth.admin.createUser)
//   - operações que precisam de dados protegidos por RLS
//
// NUNCA use em Client Components. A variável SUPABASE_SERVICE_ROLE_KEY
// não tem prefixo NEXT_PUBLIC_ por isso — ela nunca vai ao browser.
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
          } catch { /* ignorar */ }
        },
      },
      auth: {
        // O cliente admin não deve persistir sessão nem renovar tokens.
        // Ele usa a service_role estática, não um token de usuário.
        persistSession:   false,
        autoRefreshToken: false,
      },
    }
  )
}

// ── getProfile — busca o perfil do usuário autenticado ────────
// Retorna null se não houver sessão ativa ou se o profile
// não existir (usuário criado no Auth mas sem registro em profiles).
//
// Uso típico no início de Server Actions para verificar autenticação:
//   const profile = await getProfile()
//   if (!profile) return { ok: false, error: 'Sessão expirada.' }
export async function getProfile() {
  const supabase = await createClient()

  // getUser() verifica o token JWT com o servidor Supabase.
  // Mais seguro que decodificar o token localmente (que pode estar stale).
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, nome, role, telefone, avatar_url, xp_total, created_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return null

  return {
    id:        profile.id,
    nome:      profile.nome,
    email:     user.email ?? '',
    role:      profile.role as import('@/types/app').Role,
    xpTotal:   profile.xp_total,
    telefone:  profile.telefone  ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    createdAt: profile.created_at,
  }
}
