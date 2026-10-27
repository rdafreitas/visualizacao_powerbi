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

type EtapaLogin = 'cliente' | 'autenticacao' | 'perfil' | 'credencial' | 'redirecionamento'

const ERROS_DA_ETAPA: Record<EtapaLogin, string> = {
  cliente: 'Não foi possível iniciar a conexão. Tente novamente ou contate o administrador.',
  autenticacao: 'Não foi possível autenticar agora. Tente novamente.',
  perfil: 'Não foi possível consultar seu perfil. Tente novamente ou contate o administrador.',
  credencial: 'Não foi possível verificar seu acesso. Tente novamente ou contate o administrador.',
  redirecionamento: 'Não foi possível abrir sua área. Tente novamente.',
}

function registrarErroLogin(etapa: EtapaLogin | 'logout', erro: unknown) {
  // Apenas metadados permitidos: mensagens e objetos brutos podem conter dados sensíveis.
  const nome = erro instanceof Error && [
    'Error', 'TypeError', 'AuthApiError', 'AuthRetryableFetchError', 'AuthUnknownError',
  ].includes(erro.name) ? erro.name : 'Erro desconhecido'
  const codigo = typeof erro === 'object' && erro !== null && 'code' in erro &&
    typeof erro.code === 'string' && (
      /^(PGRST\d{3}|\d{5})$/.test(erro.code) ||
      ['invalid_credentials', 'email_not_confirmed', 'request_timeout',
        'over_request_rate_limit', 'unexpected_failure'].includes(erro.code)
    ) ? erro.code : undefined
  const status = typeof erro === 'object' && erro !== null && 'status' in erro &&
    typeof erro.status === 'number' && Number.isInteger(erro.status) &&
    erro.status >= 100 && erro.status <= 599 ? erro.status : undefined
  const respostaInesperada = erro instanceof Error &&
    erro.message.toLowerCase().includes('unexpected response')

  console.error('[Login] Falha técnica', { etapa, nome, codigo, status, respostaInesperada })
}

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

    let etapa: EtapaLogin = 'cliente'
    let supabase: ReturnType<typeof createClient> | undefined
    let autenticado = false
    let redirecionando = false

    async function encerrarSessao() {
      if (!supabase) return
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        autenticado = false
      } catch (erroLogout) {
        registrarErroLogin('logout', erroLogout)
        setAviso('Não foi possível encerrar a sessão. Atualize a página e tente sair novamente.')
      }
    }

    try {
      supabase = createClient()
      etapa = 'autenticacao'

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email:    email.trim().toLowerCase(),
          password: senha,
        })

      if (authError) {
        if (authError.code === 'email_not_confirmed') {
          setErro('E-mail não confirmado. Entre em contato com o administrador.')
          return
        }
        if (authError.code === 'invalid_credentials') {
          setErro('E-mail ou senha incorretos.')
          return
        }
        throw authError
      }
      if (!authData.user) throw new Error('Resposta de autenticação sem usuário')
      autenticado = true

      const userId = authData.user.id
      etapa = 'perfil'

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
      if (!profile) throw new Error('Resposta de perfil sem dados')

      const roleReal = profile.role
      etapa = 'credencial'
      const acesso = await verificarAcessoAtivo()
      if (!acesso.ok) throw new Error(acesso.error)

      if (acesso.data.status !== 'ativo') {
        const mensagens = {
          suspenso: 'Seu acesso está suspenso. Entre em contato com o administrador.',
          ausente: 'Credencial de acesso não encontrada. Entre em contato com o administrador.',
          sem_sessao: 'Sessão expirada. Faça login novamente.',
        }
        setErro(mensagens[acesso.data.status])
        await encerrarSessao()
        return
      }

      etapa = 'redirecionamento'
      const rolesDoGrupo = GRUPOS_DO_PERFIL[perfil]
      if (!rolesDoGrupo.includes(roleReal)) {
        setAviso(
          `Seu perfil é de ${ROLE_LABELS[roleReal]}. Redirecionando para a área correta...`
        )
        await new Promise<void>((resolve) => setTimeout(resolve, 2000))
        router.push(ROLE_HOME[roleReal])
        router.refresh()
      } else {
        const redirectParam = searchParams.get('redirect')
        const destino =
          redirectParam && redirectParam.startsWith('/')
            ? redirectParam
            : ROLE_HOME[roleReal]

        router.push(destino)
        router.refresh()
      }
      redirecionando = true
    } catch (erroLogin) {
      registrarErroLogin(etapa, erroLogin)
      setAviso('')
      setErro(ERROS_DA_ETAPA[etapa])
      if (autenticado) await encerrarSessao()
    } finally {
      if (!redirecionando) setLoading(false)
    }
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
