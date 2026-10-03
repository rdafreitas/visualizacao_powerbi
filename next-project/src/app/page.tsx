import { LoginRight } from '@/components/login/LoginRigth'
import { LoginForm } from '@/components/login/LoginForm'

export const metadata = { title: 'Andorin Estúdio' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <LoginForm />
      <LoginRight />
    </div>
  )
}
