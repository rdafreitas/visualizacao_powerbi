'use client'
// ─────────────────────────────────────────────────────────────
// LoginForm — com seletor de perfil para validação visual
// Clicando em Admin, Professor ou Aluno muda o visual do botão
// e o destino do redirect. Zero Supabase, zero permissions.
// Quando o back-end for integrado:
//   1. Remover o seletor de perfil
//   2. Restaurar a lógica de autenticação com Supabase
//   3. O redirect passa a ser baseado no role retornado pelo banco
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Perfil = 'admin' | 'professor' | 'aluno'

const PERFIS: { value: Perfil; label: string; icon: string; dest: string; gradient: string; shadow: string }[] = [
  {
    value:    'admin',
    label:    'Admin',
    icon:     '🏠',
    dest:     '/pages/admin/home',
    gradient: 'linear-gradient(135deg, #c45e00, #f27406)',
    shadow:   '0 8px 20px rgba(242,116,6,.35)',
  },
  {
    value:    'professor',
    label:    'Professor',
    icon:     '🎭',
    dest:     '/pages/professor/home',
    gradient: 'linear-gradient(135deg, #211D1C, #3a3330)',
    shadow:   '0 8px 20px rgba(33,29,28,.40)',
  },
  {
    value:    'aluno',
    label:    'Aluno',
    icon:     '🤸',
    dest:     '/pages/aluno/home',
    gradient: 'linear-gradient(135deg, #7A1D2C, #5a1520)',
    shadow:   '0 8px 20px rgba(122,29,44,.35)',
  },
]

export function LoginForm() {
  const router = useRouter()

  const [perfil,  setPerfil]  = useState<Perfil>('admin')
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [loading, setLoading] = useState(false)

  const perfilAtivo = PERFIS.find((p) => p.value === perfil)!

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Demo: redireciona para a rota do perfil selecionado
    setTimeout(() => {
      router.push(perfilAtivo.dest)
    }, 600)
  }

  return (
    <div className="w-[480px] flex-shrink-0 bg-white flex flex-col justify-center px-12 py-16">
      <h2
        className="text-2xl font-extrabold text-chumbo mb-1"
        style={{ fontFamily: 'var(--font-montserrat)' }}
      >
        Acessar plataforma
      </h2>
      <p className="text-sm text-gray-mid mb-8">
        Selecione seu perfil e entre com suas credenciais.
      </p>

      {/* Seletor de perfil */}
      <div className="mb-6">
        <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
          Entrar como
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PERFIS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPerfil(p.value)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all"
              style={
                perfil === p.value
                  ? { background: p.gradient, borderColor: 'transparent', color: '#F4E7CE', boxShadow: p.shadow }
                  : { background: 'transparent', borderColor: 'rgba(0,0,0,0.08)', color: '#8a7d70' }
              }
            >
              <span className="text-xl">{p.icon}</span>
              <span className="text-xs font-bold">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Input
          id="email"
          label="E-mail"
          type="email"
          placeholder="seu@andorin.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          id="senha"
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          className="mt-2"
          style={{
            background: perfilAtivo.gradient,
            boxShadow:  perfilAtivo.shadow,
            color:      '#F4E7CE',
            fontFamily: 'var(--font-montserrat)',
            border:     'none',
          }}
        >
          {loading ? 'Entrando…' : `Entrar como ${perfilAtivo.label}`}
        </Button>
      </form>

      <p className="text-xs text-gray-mid text-center mt-6">
        Não tem conta? Fale com o administrador da academia.
      </p>
    </div>
  )
}
