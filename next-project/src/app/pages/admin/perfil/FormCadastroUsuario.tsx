'use client'
// ─────────────────────────────────────────────────────────────
// FormCadastroUsuario — versão FRONT-END ESTÁTICO
// Movido para app/pages/admin/perfil/.
// Ação de cadastro simulada (console.log).
// Quando o back-end for integrado:
//   1. Importar cadastrarUsuario de '@/lib/actions/usuarios'
//   2. Importar Role de '@/types/app'
//   3. Substituir handleSubmit pelo código original
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Input }  from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal }  from '@/components/ui/Modal'

type Role = 'proprietario' | 'funcionario' | 'professor' | 'aluno'

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

  function handleClose() { resetForm(); onClose() }

  async function handleSubmit() {
    setErro('')
    if (!nome.trim())         return setErro('Nome obrigatório.')
    if (!email.trim())        return setErro('E-mail obrigatório.')
    if (!email.includes('@')) return setErro('E-mail inválido.')
    if (senha.length < 6)     return setErro('Senha deve ter no mínimo 6 caracteres.')

    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    console.log('[demo] cadastrar usuário:', { nome, email, role, telefone })
    setLoading(false)
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
          <Button variant="ghost" onClick={handleClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading}>Cadastrar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
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
                className={[
                  'flex flex-col gap-0.5 p-3 rounded-xl border text-left transition-all',
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

        <Input id="nome" label="Nome completo" placeholder="Ex: Maria Silva"
          value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" />

        <Input id="email" label="E-mail de acesso" type="email" placeholder="Ex: maria@email.com"
          value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />

        <Input id="telefone" label="Telefone (opcional)" type="tel" placeholder="Ex: (11) 99999-9999"
          value={telefone} onChange={(e) => setTelefone(e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <Input id="senha" label="Senha provisória" type="password" placeholder="Mín. 6 caracteres"
            value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
          <p className="text-[11px] text-gray-mid">
            O usuário poderá alterar a senha após o primeiro acesso.
          </p>
        </div>

        {erro && (
          <p className="text-xs text-red font-semibold bg-red/8 border border-red/20 rounded-xl px-4 py-3">
            {erro}
          </p>
        )}
      </div>
    </Modal>
  )
}
