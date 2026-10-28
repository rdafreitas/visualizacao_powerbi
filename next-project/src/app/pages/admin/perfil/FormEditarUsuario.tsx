'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/perfil/FormEditarUsuario.tsx
//
// Modal de edição de usuário (nome, telefone e tipo de acesso).
// O e-mail é exibido somente leitura — não pode ser alterado.
//
// Renderizado pelo AcessosClient apenas enquanto há um usuário em
// edição, com key={usuario.id}: os campos iniciam com os dados do
// usuário e o estado é descartado ao fechar.
//
// Na própria conta o tipo de acesso fica travado (a Server Action
// também recusa a troca).
// ─────────────────────────────────────────────────────────────

import { useState }           from 'react'
import { Input }              from '@/components/ui/Input'
import { Button }             from '@/components/ui/Button'
import { Modal }              from '@/components/ui/Modal'
import { atualizarUsuario }   from '@/(auth)/actions/usuarios'
import { SeletorRole }        from './SeletorRole'
import type { UsuarioRow }    from './TabelaAcessos'
import type { Role }          from '@/types/app'

interface Props {
  usuario: UsuarioRow
  ehProprio: boolean
  onClose: () => void
  onSave:  () => void
}

export function FormEditarUsuario({ usuario, ehProprio, onClose, onSave }: Props) {
  const [nome,     setNome]     = useState(usuario.nome)
  const [telefone, setTelefone] = useState(usuario.telefone ?? '')
  const [role,     setRole]     = useState<Role>(usuario.role)
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState('')

  async function handleSubmit() {
    setErro('')
    if (!nome.trim()) return setErro('Nome obrigatório.')

    setLoading(true)
    const result = await atualizarUsuario(usuario.id, { nome, telefone, role })
    setLoading(false)

    if (!result.ok) {
      setErro(result.error)
      return
    }

    onClose()
    onSave()
  }

  return (
    <Modal
      open
      onClose={loading ? () => {} : onClose}
      title={`Editar usuário — ${usuario.nome}`}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">

        <SeletorRole value={role} onChange={setRole} disabled={loading || ehProprio} />
        {ehProprio && (
          <p className="text-[11px] text-gray-mid -mt-2">
            Você não pode alterar o seu próprio tipo de acesso.
          </p>
        )}

        <Input
          id="editar-nome"
          label="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoComplete="off"
          disabled={loading}
        />

        <div className="flex flex-col gap-1.5">
          <Input
            id="editar-email"
            label="E-mail de acesso"
            type="email"
            value={usuario.email}
            readOnly
            disabled
          />
          <p className="text-[11px] text-gray-mid">
            O e-mail não pode ser alterado.
          </p>
        </div>

        <Input
          id="editar-telefone"
          label="Telefone (opcional)"
          type="tel"
          placeholder="Ex: (11) 99999-9999"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          disabled={loading}
        />

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
