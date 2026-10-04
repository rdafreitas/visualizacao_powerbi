'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function LoginForm() {
  const router = useRouter()

  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()   // sem isso, o formulário recarrega a página
    setErro('')          // limpa erro da tentativa anterior
    setLoading(true)     // ativa spinner e desabilita botão

    try {
      // chamadas ao Supabase aqui...
      router.push('/pages/admin/home')
      router.refresh()
    } catch {
      setErro('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)  // executa sempre, garantindo que o botão volta ao normal
    }
  }

  return (
    <div className="w-[40%] flex-shrink-0 brand-oficial-off-white flex flex-col justify-center px-8 py-16">
      <h2 className="font-montserrat text-2xl font-extrabold mb-1">
        Acesse seu Andorin
      </h2>
      <p className="font-shadows text-xs text-chumbo mb-12">
        Venha bater suas asas dentro da mundo mágico do Circo.
      </p>
      <p className="text-sm text-gray-mid mb-3">
        Entre com seu e-mail e senha cadastrados.
      </p>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Input
          id="email"
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          id="senha"
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          autoComplete="current-password"
        />

        {erro && (
          <p className="text-xs text-red font-semibold bg-red/8 border border-red/20 rounded-xl px-4 py-3">
            {erro}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          className="mt-2"
          variant="var_aluno"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="text-xs text-gray-mid text-center mt-6">
        Não tem conta? Fale com o administrador da academia.
      </p>
    </div>
  )
}