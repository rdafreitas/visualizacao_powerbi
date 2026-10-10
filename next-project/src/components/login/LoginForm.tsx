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
    <div className="w-[40%] flex-shrink-0 brand-oficial-off-white flex flex-col justify-center px-12 py-16">
      <h2 className="text-2xl font-extrabold text-bordo mb-1"
        style={{ fontFamily: 'var(--font-montserrat)' }}>
        Acessar plataforma
      </h2>
      <p className="text-sm text-gray-mid mb-8">
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
          <p className="text-xs font-semibold rounded-xl px-4 py-3"
            style={{
              color:      '#8B2318',
              background: 'rgba(192,57,43,.08)',
              border:     '1px solid rgba(192,57,43,.2)',
            }}>
            {erro}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          className="mt-2"
          style={{
            background: 'linear-gradient(135deg, #7A1D2C, #f27406)',
            boxShadow:  '0 8px 20px rgba(122,29,44,.30)',
            color:      '#F4E7CE',
            fontFamily: 'var(--font-montserrat)',
          }}
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
