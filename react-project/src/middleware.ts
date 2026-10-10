// ─────────────────────────────────────────────────────────────
// src/middleware.ts
// Executado em CADA request antes de qualquer componente.
// Responsável por:
//   1. Atualizar o cookie de sessão Supabase
//   2. Redirecionar usuários não autenticados para /pages/login
//   3. Redirecionar usuários para a rota correta do seu role
//   4. Bloquear acesso a rotas sem permissão
// ─────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import {
  ROLE_HOME,
  getRoutePermission,
  hasPermission,
  isAdminRole,
  isProfessorRole,
  isAlunoRole,
} from '@/lib/permissions'
import { PUBLIC_ROUTES } from '@/lib/constants'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user, role } = await updateSession(request)

  // ── Rotas públicas: deixar passar sem verificação ──────────
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
  if (isPublic) return supabaseResponse

  // ── Sem sessão: redirecionar para login ───────────────────
  if (!user || !role) {
    const loginUrl = new URL('/pages/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Raiz /: redirecionar para a home do role ─────────────
  if (pathname === '/') {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
  }

  // ── Verificar permissão da rota solicitada ────────────────
  const requiredPermission = getRoutePermission(pathname)

  if (requiredPermission && !hasPermission(role, requiredPermission)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
  }

  // ── Isolamento de modo: impedir acesso entre modos ────────

  // Admin tentando acessar modo professor ou aluno
  if (isAdminRole(role)) {
    if (pathname.startsWith('/pages/professor') || pathname.startsWith('/pages/aluno')) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
    }
  }

  // Professor tentando acessar modo admin ou aluno
  if (isProfessorRole(role)) {
    if (pathname.startsWith('/pages/admin') || pathname.startsWith('/pages/aluno')) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
    }
  }

  // Aluno tentando acessar modo admin ou professor
  if (isAlunoRole(role)) {
    if (pathname.startsWith('/pages/admin') || pathname.startsWith('/pages/professor')) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js).*)',
  ],
}
