// src/lib/supabase/proxy.ts
//
// Cliente Supabase para o Proxy do Next.js (Node.js).
//
// REGRA DE USO:
//   Importe APENAS em src/proxy.ts.
//   Não use em Server Components, actions ou Client Components.
//
// POR QUE UM CLIENTE SEPARADO PARA O PROXY?
//   O Proxy trabalha com NextRequest e NextResponse.
//   Os cookies chegam via request.cookies, sem usar cookies()
//   de 'next/headers'.
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
//   Em um Proxy de autenticação que roda em cada requisição,
//   a validação real do servidor é obrigatória.
//   Referência: https://supabase.com/docs/guides/auth/server-side/nextjs
//
// POR QUE buscar o role aqui (e não só no Server Component)?
//   O Proxy precisa decidir PARA ONDE redirecionar antes de
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
        setAll(cookiesToSet, headers) {
          // Mantém a sessão renovada visível para a requisição e para o navegador.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Passo 2: recria a resposta com os cookies atualizados
          // Sem isso, os cookies renovados não chegariam ao browser
          const previousResponse = supabaseResponse
          supabaseResponse = NextResponse.next({ request })
          previousResponse.cookies.getAll().forEach((cookie) =>
            supabaseResponse.cookies.set(cookie)
          )
          previousResponse.headers.forEach((value, name) => {
            if (['cache-control', 'expires', 'pragma'].includes(name)) {
              supabaseResponse.headers.set(name, value)
            }
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([name, value]) =>
            supabaseResponse.headers.set(name, value)
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
