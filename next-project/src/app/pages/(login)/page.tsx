import { LoginLeft } from '@/components/login/LoginLeft'
import { LoginForm } from '@/components/login/LoginForm'

export const metadata = { title: 'Login — PaVoar Academia Circense' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <LoginLeft />
      <LoginForm />
    </div>
  )
}
