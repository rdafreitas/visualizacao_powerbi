// ─────────────────────────────────────────────────────────────
// src/middleware.ts
//
// O middleware é o porteiro do site. Roda no servidor Edge
// Runtime ANTES de qualquer página ser renderizada.
//
// ORDEM DE VERIFICAÇÃO (6 passos sequenciais):
//   1. Renova o cookie de sessão Supabase
//   2. Rotas públicas → passa direto (ou manda logado para home)
//   3. Sem sessão     → manda para login com ?redirect=
//   4. Permissão granular da rota → bloqueia se falhar
//   5. Cruzamento de modo (aluno em /admin) → bloqueia
//   6. Aprovado → deixa a requisição seguir
//
// SEGURANÇA EM CAMADAS:
//   Este middleware é a 1ª camada. Existem mais duas:
//   • layouts e Server Components (2ª camada via requireAuth)
//   • RLS no PostgreSQL (3ª camada, independente do código)
//   Se qualquer camada acima falhar, as seguintes ainda protegem.
// ─────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import {
  ROLE_HOME,
  getRoutePermission,
  hasPermission,
  isAdminRole,
} from '@/lib/permissions'
import { PUBLIC_ROUTES, LOGIN_ROUTE } from '@/lib/constants'
import type { Role } from '@/types/app'

export async function middleware(request: NextRequest) {
  // Extrai apenas o pathname da URL (sem query string nem hash).
  // Ex: para "https://andorin.com/pages/admin/home?tab=1"
  //     pathname = "/pages/admin/home"
  const { pathname } = request.nextUrl

  // ── Passo 1: renova a sessão ───────────────────────────────
  // updateSession() faz três coisas em uma chamada:
  //   a) Lê o cookie JWT da requisição
  //   b) Valida o token com o servidor Supabase (getUser)
  //   c) Busca o role em profiles para decisões de roteamento
  // Se o token estiver próximo do vencimento, ele é renovado
  // automaticamente e o cookie atualizado vai na resposta.
  const { supabaseResponse, user, role } = await updateSession(request)

  // ── Passo 2: rotas públicas ────────────────────────────────
  // PUBLIC_ROUTES = ['/'] — apenas a raiz (página de login).
  // O some() verifica se o pathname corresponde a alguma rota pública.
  // O startsWith(route + '/') cobre subrotas (ex: /callback).
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (isPublic) {
    // Caso especial: usuário JÁ logado tentando acessar o login.
    // Não faz sentido mostrar o formulário para quem já está autenticado.
    // ROLE_HOME mapeia: proprietario/funcionario → /pages/admin/home
    //                   professor → /pages/professor/home
    //                   aluno     → /pages/aluno/home
    if (user && role && pathname === '/') {
      return NextResponse.redirect(
        new URL(ROLE_HOME[role as Role], request.url)
      )
    }
    // Sem sessão ou subrota pública: deixa passar normalmente.
    return supabaseResponse
  }

  // ── Passo 3: sem sessão em rota protegida ─────────────────
  // Qualquer rota que não seja pública exige autenticação.
  // Guarda a rota original em ?redirect= para que após o login
  // o formulário possa enviar o usuário de volta para onde estava.
  if (!user || !role) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Passo 4: permissão granular da rota ───────────────────
  // Algumas rotas exigem uma permissão específica além de ter
  // sessão. O mapa ROUTE_PERMISSION em permissions.ts define isso:
  //   '/pages/admin/financeiro' → 'admin:financeiro' (só proprietario)
  //   '/pages/admin/perfil'     → 'admin:perfil'     (só proprietario)
  //
  // Se a rota não está no mapa (undefined), a verificação é pulada —
  // a rota é protegida apenas pela sessão e pelo passo 5.
  //
  // Redireciona para ROLE_HOME em vez de mostrar erro 403.
  // Isso evita revelar que a rota existe para quem não tem acesso.
  const requiredPermission = getRoutePermission(pathname)
  if (requiredPermission && !hasPermission(role as Role, requiredPermission)) {
    return NextResponse.redirect(
      new URL(ROLE_HOME[role as Role], request.url)
    )
  }

  // ── Passo 5: proteção por modo de acesso ──────────────────
  // Camada de fallback que cobre rotas não mapeadas individualmente.
  // Impede cruzamento entre modos mesmo para URLs "desconhecidas".
  //
  // Exemplo: aluno que descobre a URL /pages/admin/qualquer-coisa
  // seria bloqueado aqui, mesmo que a rota não exista no ROUTE_PERMISSION.
  //
  // isAdminRole() verifica se é 'proprietario' ou 'funcionario'.
  if (pathname.startsWith('/pages/admin') && !isAdminRole(role as Role)) {
    return NextResponse.redirect(
      new URL(ROLE_HOME[role as Role], request.url)
    )
  }
  if (pathname.startsWith('/pages/professor') && role !== 'professor') {
    return NextResponse.redirect(
      new URL(ROLE_HOME[role as Role], request.url)
    )
  }
  if (pathname.startsWith('/pages/aluno') && role !== 'aluno') {
    return NextResponse.redirect(
      new URL(ROLE_HOME[role as Role], request.url)
    )
  }

  // ── Passo 6: aprovado ─────────────────────────────────────
  // Todos os passos foram verificados e aprovados.
  // Retorna supabaseResponse — e não NextResponse.next() puro —
  // porque supabaseResponse já contém os cookies de sessão
  // atualizados que precisam chegar ao browser.
  // Usar NextResponse.next() aqui descartaria os cookies renovados.
  return supabaseResponse
}

// ── Matcher ────────────────────────────────────────────────────
// Define em quais URLs o middleware executa.
//
// A expressão (?!...) é um "negative lookahead" de regex:
// exclui os padrões listados dentro dos parênteses.
//
// Sem esta exclusão, o middleware rodaria para CADA arquivo
// estático (imagens, fontes, ícones, manifest PWA, service worker)
// — potencialmente centenas de execuções por carregamento de página,
// adicionando latência sem nenhum benefício de segurança.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf)).*)',
  ],
}
