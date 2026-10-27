'use server'
// ─────────────────────────────────────────────────────────────
// src/(auth)/actions/logout.ts
//
// Server Action de encerramento de sessão.
//
// POR QUE SERVER ACTION E NÃO signOut() NO BROWSER?
//   signOut() no Client Component apaga o cookie localmente,
//   mas o token JWT continua válido no servidor Supabase até
//   expirar (tipicamente 1 hora). Um token capturado antes do
//   logout ainda funcionaria por esse período completo.
//
//   Como Server Action, o Next.js executa no servidor:
//   supabase.auth.signOut() invalida a sessão remotamente no
//   Supabase antes de redirecionar — o token é revogado
//   imediatamente, em qualquer dispositivo ou aba aberta.
//
// POR QUE redirect() E NÃO router.push()?
//   redirect() do 'next/navigation' lança internamente uma
//   exceção especial do Next.js que interrompe a execução e
//   redireciona no servidor. Não precisa de return após ele.
//   router.push() só funciona em Client Components.
// ─────────────────────────────────────────────────────────────

import { redirect }      from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import { LOGIN_ROUTE }   from '@/lib/constants'

export async function logout() {
  const supabase = await createClient()

  // Invalida a sessão no servidor Supabase.
  // Após esta chamada, o token JWT deixa de ser aceito
  // mesmo que ainda não tenha expirado.
  await supabase.auth.signOut()

  // Redireciona para o login.
  // O middleware confirmará a ausência de sessão em qualquer
  // tentativa subsequente de acessar rota protegida.
  redirect(LOGIN_ROUTE)
}
