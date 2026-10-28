'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/perfil/AcessosClient.tsx
//
// Orquestrador da tela de Acessos.
// Client Component porque gerencia estado local (modal aberto,
// toast) e usa hooks do React (useTransition, useRouter).
//
// PADRÃO USADO: Server Component passa dados → Client Component orquestra
//   AcessosPage (Server Component)
//     └── busca dados no servidor com listarUsuariosComCredencial()
//     └── passa como props: usuarios[] e meuId
//         └── AcessosClient (Client Component)
//             ├── gerencia abertura do modal de cadastro
//             ├── dispara router.refresh() após mutações
//             └── passa dados para TabelaAcessos e FormCadastroUsuario
//
// POR QUE router.refresh() E NÃO recarregar o estado local?
//   router.refresh() instrui o Next.js a re-executar o Server Component
//   pai (AcessosPage), que chama listarUsuariosComCredencial() novamente
//   e passa os dados atualizados para baixo como props.
//   Isso garante que a lista sempre reflete o estado real do banco —
//   não um estado local que pode estar desincronizado.
//
// POR QUE useTransition() PARA O REFRESH?
//   startTransition marca o refresh como operação não-urgente.
//   isPending fica true durante o refresh — usado para exibir
//   "atualizando…" no contador de usuários sem bloquear a UI.
// ─────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import { Button }                  from '@/components/ui/Button'
import { Toast }                   from '@/components/ui/Toast'
import { FormCadastroUsuario }     from './FormCadastroUsuario'
import { TabelaAcessos, type UsuarioRow } from './TabelaAcessos'

interface Props {
  usuarios: UsuarioRow[]
  meuId:    string
}

export function AcessosClient({ usuarios, meuId }: Props) {
  const router = useRouter()

  const [modalAberto,  setModalAberto]  = useState(false)
  const [toast,        setToast]        = useState('')
  const [showToast,    setShowToast]    = useState(false)
  const [isPending,    startTransition] = useTransition()

  // Solicita ao Next.js que re-execute o Server Component pai.
  // Nenhum dado fica em memória local — tudo vem do banco após o refresh.
  function handleRefresh() {
    startTransition(() => {
      router.refresh()
    })
  }

  function handleSalvo() {
    setToast('Usuário cadastrado com sucesso!')
    setShowToast(true)
    handleRefresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-mid">
          {usuarios.length}{' '}
          {usuarios.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
          {/* isPending: verdadeiro enquanto o refresh do banco está em andamento */}
          {isPending && ' · atualizando…'}
        </p>
        <Button onClick={() => setModalAberto(true)}>
          + Novo usuário
        </Button>
      </div>

      <TabelaAcessos
        usuarios={usuarios}
        meuId={meuId}
        onRefresh={handleRefresh}
      />

      <FormCadastroUsuario
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        onSave={handleSalvo}
      />

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
