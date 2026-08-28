'use client'
// ─────────────────────────────────────────────────────────────
// AcessosClient.tsx
// Orquestrador da tela de Acessos: controla o modal de cadastro
// e dispara o refresh da lista quando um usuário é criado.
// É Client Component para gerenciar o estado do modal e o refresh.
// ─────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { FormCadastroUsuario } from './FormCadastroUsuario'
import { TabelaAcessos, type UsuarioRow } from './TabelaAcessos'
import { Toast } from '@/components/ui/Toast'

interface Props {
  usuarios: UsuarioRow[]
  meuId:    string
}

export function AcessosClient({ usuarios: inicial, meuId }: Props) {
  const router = useRouter()
  const [modalAberto,  setModalAberto]  = useState(false)
  const [toast,        setToast]        = useState('')
  const [showToast,    setShowToast]    = useState(false)
  const [isPending,    startTransition] = useTransition()

  // Recarrega os dados chamando router.refresh().
  // useTransition marca o período de loading sem bloquear a UI.
  function handleRefresh() {
    startTransition(() => { router.refresh() })
  }

  function handleSalvo() {
    setToast('Usuário cadastrado com sucesso!')
    setShowToast(true)
    handleRefresh()
  }

  return (
    <>
      {/* Cabeçalho da seção com botão Novo usuário */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-gray-mid">
            {inicial.length} {inicial.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
            {isPending && ' · atualizando…'}
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          + Novo usuário
        </Button>
      </div>

      {/* Tabela de usuários */}
      <TabelaAcessos
        usuarios={inicial}
        meuId={meuId}
        onRefresh={handleRefresh}
      />

      {/* Modal de cadastro */}
      <FormCadastroUsuario
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        onSave={handleSalvo}
      />

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
