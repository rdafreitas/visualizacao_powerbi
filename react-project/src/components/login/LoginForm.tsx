'use client'
// ─────────────────────────────────────────────────────────────
// LoginForm.tsx
// Formulário de login. Client Component pois gerencia estado
// local de campos e loading, e chama o Supabase Auth do browser.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROLE_HOME } from '@/lib/permissions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Role } from '@/types/app'

export function LoginForm() {
  const router   = useRouter()
  const supabase = createClient()
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      // 1. Autentica no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      })

      if (authError || !authData.user) {
        setErro('E-mail ou senha incorretos.')
        return
      }

      // 2. Busca o perfil (role) na tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        setErro('Perfil não encontrado. Fale com o administrador.')
        await supabase.auth.signOut()
        return
      }

      // 3. Verifica se o acesso está ativo em profiles_credencial
      //    Isso permite bloquear o login de um usuário sem excluí-lo.
      const { data: credencial } = await supabase
        .from('profiles_credencial')
        .select('ativo')
        .eq('profile_id', authData.user.id)
        .single()

      if (credencial && !credencial.ativo) {
        await supabase.auth.signOut()
        setErro('Seu acesso foi suspenso. Entre em contato com o administrador.')
        return
      }

      // 4. Redireciona para a home do role
      router.push(ROLE_HOME[profile.role as Role])
      router.refresh()

    } catch {
      setErro('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[480px] flex-shrink-0 bg-white flex flex-col justify-center px-12 py-16">
      <h2 className="font-poppins text-2xl font-extrabold text-gray-dark mb-1">
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
          style={{ background: 'linear-gradient(135deg, #2D1B69, #3D2A85)' }}
        >
          {loading ? 'Entrando…' : 'Entrar na plataforma'}
        </Button>
      </form>

      <p className="text-xs text-gray-mid text-center mt-6">
        Não tem conta? Fale com o administrador da academia.
      </p>
    </div>
  )
}
