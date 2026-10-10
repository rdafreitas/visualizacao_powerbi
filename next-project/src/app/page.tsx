import { LoginForm }  from '@/components/login/LoginForm'
import { LoginRight } from '@/components/login/LoginRigth'

export const metadata = { title: 'Login — Estúdio Andorin' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Formulário à esquerda */}
      <LoginForm />
      {/* Painel visual à direita */}
      <LoginRight />
    </div>
  )
}
