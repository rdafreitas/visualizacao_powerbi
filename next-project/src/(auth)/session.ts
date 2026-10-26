// src/(auth)/session.ts
//
// Fonte centralizada de autenticação e autorização.
//
// POR QUE EM (auth)/ E NÃO EM lib/?
//   A pasta (auth) com parênteses é um Route Group do Next.js —
//   não gera nenhuma URL. É uma convenção de organização que
//   agrupa arquivos relacionados à autenticação em um único lugar.
//   Vantagens:
//     • Auditoria fácil: toda lógica de "quem pode fazer o quê"
//       está em um só lugar
//     • Onboarding: novos desenvolvedores encontram as regras
//       de acesso sem procurar em múltiplos arquivos
//     • Princípio da responsabilidade única: lib/ tem utilitários
//       gerais, (auth)/ tem lógica de identidade e acesso
//
// FUNÇÕES EXPORTADAS:
//
//   getProfile()    → retorna o perfil ou null (sem redirecionar)
//                     Use quando você quer verificar opcional
//
//   requireAuth()   → retorna o perfil ou redireciona para /
//                     Use em layouts e páginas que exigem login
//
//   requireRole()   → retorna o perfil ou redireciona para home do role
//                     Use em páginas que exigem um role específico
//
// SOBRE getUser() vs getSession():
//   Usamos getUser() que valida o JWT no servidor Supabase.
//   getSession() apenas decodifica o token localmente — não detecta
//   tokens revogados. Em código de autorização, sempre use getUser().
//   Referência: https://supabase.com/docs/guides/auth/server-side/nextjs

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasPermission, ROLE_HOME } from '@/lib/permissions'
import { LOGIN_ROUTE } from '@/lib/constants'
import type { Role, Permission } from '@/types/app'

// ── Tipo do perfil retornado pelas funções de sessão ──────────
export interface SessionProfile {
  id:        string
  nome:      string
  email:     string
  role:      Role
  xpTotal:   number
  telefone?: string
  avatarUrl?: string
  createdAt: string
}

// ── getProfile ────────────────────────────────────────────────
// Busca o perfil sem forçar redirecionamento.
// Retorna null se não houver sessão ou se o profile não existir.
//
// Quando usar: LoginForm (para verificar se já está logado),
// componentes opcionalmente autenticados.
export async function getProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
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
    role:      profile.role as Role,
    xpTotal:   profile.xp_total   ?? 0,
    telefone:  profile.telefone   ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    createdAt: profile.created_at,
  }
}

// ── requireAuth ───────────────────────────────────────────────
// Garante que há um usuário autenticado com profile.
// Redireciona para LOGIN_ROUTE se não houver sessão.
//
// Quando usar: em TODO layout e página protegida.
// Substitui o padrão repetitivo:
//   const profile = await getProfile()
//   if (!profile) redirect('/')
//
// Exemplo de uso em um layout:
//   const profile = await requireAuth()
//   // a partir daqui, profile nunca é null
export async function requireAuth(): Promise<SessionProfile> {
  const profile = await getProfile()

  if (!profile) {
    redirect(LOGIN_ROUTE)
  }

  return profile
}

// ── requireRole ───────────────────────────────────────────────
// Garante que o usuário tem um role específico.
// Redireciona para a home do role atual se a permissão falhar.
//
// Quando usar: em páginas que exigem um role específico,
// como admin/financeiro (somente proprietario).
//
// Exemplo:
//   const profile = await requireRole('admin:financeiro')
//   // só chega aqui se tiver a permissão
export async function requireRole(
  permission: Permission
): Promise<SessionProfile> {
  const profile = await requireAuth()

  if (!hasPermission(profile.role, permission)) {
    redirect(ROLE_HOME[profile.role])
  }

  return profile
}

// ── getCurrentRole ────────────────────────────────────────────
// Versão leve: retorna apenas o role sem buscar o profile completo.
// Usada pelo middleware (que já tem o role disponível de outra forma)
// e por verificações rápidas que não precisam de nome/email/etc.
export async function getCurrentRole(): Promise<Role | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return (data?.role as Role) ?? null
}
