// src/lib/supabase/middleware.ts
//
// Cliente Supabase para o middleware do Next.js (Edge Runtime).
//
// REGRA DE USO:
//   Importe APENAS em src/middleware.ts.
//   Não use em Server Components, actions ou Client Components.
//
// POR QUE UM CLIENTE SEPARADO PARA O MIDDLEWARE?
//   O middleware roda no Edge Runtime — um ambiente JavaScript
//   restrito diferente do Node.js. Nele, a API cookies() do
//   'next/headers' não existe. Os cookies chegam via
//   request.cookies (RequestCookies da Web API padrão).
//   A interface { getAll, setAll } abaixo adapta essa diferença.
//
// POR QUE getUser() e NÃO getSession()?
//   Esta é uma distinção crítica de segurança documentada pelo Supabase:
//
//   getSession() lê o token JWT do cookie e decodifica localmente.
//   É rápido, mas não valida se o token foi revogado no servidor.
//   Um token roubado ou de uma sessão que já sofreu logout
//   ainda passaria pela verificação.
//
//   getUser() faz uma requisição ao servidor Supabase para validar
//   o token. É levemente mais lento (uma chamada de rede), mas
//   garante que o token é válido no momento exato da verificação.
//   Sessões revogadas são rejeitadas imediatamente.
//
//   Em um middleware de segurança que roda em CADA requisição,
//   a validação real do servidor é obrigatória.
//   Referência: https://supabase.com/docs/guides/auth/server-side/nextjs
//
// POR QUE buscar o role aqui (e não só no Server Component)?
//   O middleware precisa decidir PARA ONDE redirecionar antes de
//   renderizar qualquer componente. Para isso precisa saber o role.
//   Se não buscasse o role aqui, teria que redirecionar para uma
//   página intermediária que buscaria o role e então redirecionaria
//   de novo — dois round-trips em vez de um.

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import type { Role } from '@/types/app'

export async function updateSession(request: NextRequest) {
  // Resposta inicial: "continuar normalmente sem modificações"
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
          // Passo 1: atualiza cookies na requisição (para o Edge Runtime ver)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Passo 2: recria a resposta com os cookies atualizados
          // Sem isso, os cookies renovados não chegariam ao browser
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Valida o token JWT com o servidor Supabase.
  // Renova automaticamente se estiver próximo do vencimento.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Busca o role para decisões de roteamento.
  // Null = sem sessão ou profile não encontrado.
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
