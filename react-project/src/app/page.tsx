import { redirect } from 'next/navigation'

/**
 * Raiz da aplicação.
 * O middleware redireciona usuários autenticados para ROLE_HOME[role].
 * Para usuários não autenticados, redireciona para o login.
 */
export default function RootPage() {
  redirect('/pages/login')
}
