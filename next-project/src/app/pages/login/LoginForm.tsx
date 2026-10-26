'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/login/LoginForm.tsx
//
// Formulário de login com autenticação real via Supabase.
// Mantém os 3 botões de seleção de perfil como UX visual.
// Campo de senha com toggle de visibilidade (showPasswordToggle).
// ─────────────────────────────────────────────────────────────

import { useState }                   from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient }               from '@/lib/supabase/client'
import { ROLE_HOME, ROLE_LABELS }     from '@/lib/permissions'
import { verificarAcessoAtivo }       from '@/(auth)/actions/usuarios'
import { Input }                      from '@/components/ui/Input'
import { Button }                     from '@/components/ui/Button'
import type { Role }                  from '@/types/app'

type Perfil = 'admin' | 'professor' | 'aluno'

const GRUPOS_DO_PERFIL: Record<Perfil, Role[]> = {
  admin:     ['proprietario', 'funcionario'],
  professor: ['professor'],
  aluno:     ['aluno'],
}

const PERFIS: {
  value:    Perfil
  label:    string
  icon:     string
  gradient: string
  shadow:   string
}[] = [
  {
    value:    'admin',
    label:    'Admin',
    icon:     '🏠',
    gradient: 'linear-gradient(135deg, #c45e00, #f27406)',
    shadow:   '0 8px 20px rgba(242,116,6,.35)',
  },
  {
    value:    'professor',
    label:    'Professor',
    icon:     '🎭',
    gradient: 'linear-gradient(135deg, #211D1C, #3a3330)',
    shadow:   '0 8px 20px rgba(33,29,28,.40)',
  },
  {
    value:    'aluno',
    label:    'Aluno',
    icon:     '🤸',
    gradient: 'linear-gradient(135deg, #7A1D2C, #5a1520)',
    shadow:   '0 8px 20px rgba(122,29,44,.35)',
  },
]

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [perfil,  setPerfil]  = useState<Perfil>('admin')
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')
  const [aviso,   setAviso]   = useState('')

  const perfilAtivo = PERFIS.find((p) => p.value === perfil)!

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')

    if (!email.trim()) { setErro('Informe o e-mail.'); return }
    if (!senha)        { setErro('Informe a senha.');  return }

    setLoading(true)

    // ── Passo 1: autentica no Supabase Auth ──────────────────
    const supabase = createClient()

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password: senha,
      })

    if (authError || !authData?.user) {
      if (authError?.message?.includes('Email not confirmed')) {
        setErro('E-mail não confirmado. Peça ao administrador para recriar o acesso via tela de Acessos.')
      } else {
        setErro('E-mail ou senha incorretos.')
      }
      setLoading(false)
      return
    }

    const userId = authData.user.id

    // ── Passo 2: busca o role real em profiles ────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      setErro(
        'Perfil não encontrado no banco. ' +
        'Execute o INSERT manual em profiles conforme o guia (etapa 1.9).'
      )
      setLoading(false)
      return
    }

    const roleReal = profile.role as Role

    // ── Passo 3: verifica profiles_credencial.ativo ───────────
    let acessoAtivo: boolean
    try {
      acessoAtivo = await verificarAcessoAtivo(userId)
    } catch {
      await supabase.auth.signOut()
      setErro('Erro ao verificar credenciais. Verifique as variáveis de ambiente.')
      setLoading(false)
      return
    }

    if (!acessoAtivo) {
      await supabase.auth.signOut()

      const { data: credCheck } = await supabase
        .from('profiles_credencial')
        .select('profile_id')
        .eq('profile_id', userId)
        .maybeSingle()

      if (!credCheck) {
        setErro(
          'Credencial não encontrada. ' +
          'Execute o INSERT manual em profiles_credencial conforme o guia (etapa 1.9).'
        )
      } else {
        setErro('Seu acesso está suspenso. Entre em contato com o administrador.')
      }
      setLoading(false)
      return
    }

    // ── Passo 4: verificação de contexto do botão ────────────
    const rolesDoGrupo = GRUPOS_DO_PERFIL[perfil]
    if (!rolesDoGrupo.includes(roleReal)) {
      setAviso(
        `Seu perfil é de ${ROLE_LABELS[roleReal]}. Redirecionando para a área correta...`
      )
      setTimeout(() => {
        router.push(ROLE_HOME[roleReal])
        router.refresh()
      }, 2000)
      return
    }

    // ── Passo 5: redireciona para o destino correto ───────────
    const redirectParam = searchParams.get('redirect')
    const destino =
      redirectParam && redirectParam.startsWith('/')
        ? redirectParam
        : ROLE_HOME[roleReal]

    router.push(destino)
    router.refresh()
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

      {/* ── Seletor de perfil (3 botões) ── */}
      <div className="mb-6">
        <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
          Entrar como
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PERFIS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => { setPerfil(p.value); setErro(''); setAviso('') }}
              disabled={loading}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* ── Formulário ── */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>

        <Input
          id="email"
          label="E-mail"
          type="email"
          placeholder="seu@andorin.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={loading}
        />

        {/*
          showPasswordToggle ativa o botão de olho no Input.
          O estado de visibilidade (senhaVisivel) é gerenciado
          internamente pelo Input — o LoginForm não precisa saber.
          Padrão: olho fechado (senha oculta).
          Ao clicar: olho abre, type muda de "password" para "text".
        */}
        <Input
          id="senha"
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          disabled={loading}
          showPasswordToggle
        />

        {/* Erro — mensagem específica por passo */}
        {erro && (
          <div
            role="alert"
            className="px-4 py-3 rounded-xl border text-xs font-semibold leading-relaxed"
            style={{
              background:  'rgba(192,57,43,0.06)',
              borderColor: 'rgba(192,57,43,0.25)',
              color:       '#922b21',
            }}
          >
            {erro}
          </div>
        )}

        {/* Aviso — role não corresponde ao botão clicado */}
        {aviso && (
          <div
            role="status"
            className="px-4 py-3 rounded-xl border text-xs font-semibold leading-relaxed"
            style={{
              background:  'rgba(242,116,6,0.07)',
              borderColor: 'rgba(242,116,6,0.30)',
              color:       '#8a4a00',
            }}
          >
            {aviso}
          </div>
        )}

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
          {loading ? 'Verificando…' : `Entrar como ${perfilAtivo.label}`}
        </Button>

      </form>

      <p className="text-xs text-gray-mid text-center mt-6">
        Não tem conta? Fale com o administrador da academia.
      </p>
    </div>
  )
}
