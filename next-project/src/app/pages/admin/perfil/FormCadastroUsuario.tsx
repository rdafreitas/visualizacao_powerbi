'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/perfil/FormCadastroUsuario.tsx
//
// Modal de cadastro de novo usuário.
// Client Component: gerencia estado local dos campos e loading.
//
// O handleSubmit chama a Server Action cadastrarUsuario() —
// que roda no servidor com service_role key, cria o usuário
// no Supabase Auth e insere em profiles_credencial.
//
// FLUXO APÓS SUBMIT:
//   1. handleSubmit valida campos no cliente (rápido, evita req desnecessária)
//   2. cadastrarUsuario() roda no servidor — valida novamente + executa
//   3. Se ok: fecha modal → onSave() → AcessosClient dispara router.refresh()
//   4. Se erro: exibe mensagem específica da Server Action
//
// IMPORTS E ORIGENS:
//   cadastrarUsuario ← (auth)/actions/usuarios (Server Action)
//   Role             ← types/app
// ─────────────────────────────────────────────────────────────

import { useState }           from 'react'
import { Input }              from '@/components/ui/Input'
import { Button }             from '@/components/ui/Button'
import { Modal }              from '@/components/ui/Modal'
import { cadastrarUsuario }   from '@/(auth)/actions/usuarios'
import type { Role }          from '@/types/app'

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'aluno',        label: '🤸 Aluno',        desc: 'Acessa agenda e seu perfil'  },
  { value: 'professor',    label: '🎭 Professor',    desc: 'Gerencia turmas e treinos'   },
  { value: 'funcionario',  label: '🏢 Funcionário',  desc: 'Acesso admin sem financeiro' },
  { value: 'proprietario', label: '👑 Proprietário', desc: 'Acesso total ao sistema'     },
]

interface Props {
  open:    boolean
  onClose: () => void
  onSave:  () => void
}

export function FormCadastroUsuario({ open, onClose, onSave }: Props) {
  const [nome,     setNome]     = useState('')
  const [email,    setEmail]    = useState('')
  const [senha,    setSenha]    = useState('')
  const [telefone, setTelefone] = useState('')
  const [role,     setRole]     = useState<Role>('aluno')
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState('')

  function resetForm() {
    setNome(''); setEmail(''); setSenha('')
    setTelefone(''); setRole('aluno'); setErro('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit() {
    setErro('')

    // Validações no cliente — evitam chamada desnecessária ao servidor
    // com campos obviamente inválidos. O servidor valida novamente.
    if (!nome.trim())         return setErro('Nome obrigatório.')
    if (!email.trim())        return setErro('E-mail obrigatório.')
    if (!email.includes('@')) return setErro('E-mail inválido.')
    if (senha.length < 6)     return setErro('Senha deve ter no mínimo 6 caracteres.')

    setLoading(true)

    // Chama a Server Action — roda no servidor, nunca no browser.
    // A service_role key permanece no servidor.
    // ActionResult discriminado: result.ok determina o fluxo.
    const result = await cadastrarUsuario({
      nome, email, senha, role, telefone,
    })

    setLoading(false)

    if (!result.ok) {
      // Mensagem vinda da Server Action — específica por tipo de erro
      // (email já cadastrado, senha fraca, erro de credencial, etc.)
      setErro(result.error)
      return
    }

    // Sucesso: fecha modal, notifica o pai para atualizar a lista
    resetForm()
    onClose()
    onSave()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo usuário"
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Cadastrar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">

        {/* Seletor de role */}
        <div>
          <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
            Tipo de acesso
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                disabled={loading}
                className={[
                  'flex flex-col gap-0.5 p-3 rounded-xl border text-left transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  role === r.value
                    ? 'border-bordo bg-bordo/5 text-bordo'
                    : 'border-black/[0.06] hover:border-bordo/40 text-gray-dark',
                ].join(' ')}
              >
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="text-[11px] text-gray-mid">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          id="nome"
          label="Nome completo"
          placeholder="Ex: Maria Silva"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoComplete="off"
          disabled={loading}
        />

        <Input
          id="email"
          label="E-mail de acesso"
          type="email"
          placeholder="Ex: maria@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          disabled={loading}
        />

        <Input
          id="telefone"
          label="Telefone (opcional)"
          type="tel"
          placeholder="Ex: (11) 99999-9999"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          disabled={loading}
        />

        <div className="flex flex-col gap-1.5">
          <Input
            id="senha"
            label="Senha provisória"
            type="password"
            placeholder="Mín. 6 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            showPasswordToggle
          />
          <p className="text-[11px] text-gray-mid">
            O usuário poderá alterar a senha após o primeiro acesso.
          </p>
        </div>

        {erro && (
          <div
            className="text-xs font-semibold rounded-xl px-4 py-3 border leading-relaxed"
            style={{
              background:  'rgba(192,57,43,0.06)',
              borderColor: 'rgba(192,57,43,0.25)',
              color:       '#922b21',
            }}
          >
            {erro}
          </div>
        )}

      </div>
    </Modal>
  )
}
