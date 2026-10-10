'use client'
// ─────────────────────────────────────────────────────────────
// AcessosClient — versão FRONT-END ESTÁTICO
// Dados demo hardcoded. router.refresh() e useTransition removidos.
// Quando o back-end for integrado:
//   1. Receber usuarios e meuId como props do Server Component pai
//   2. Restaurar useTransition e router.refresh() no handleRefresh
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Toast }  from '@/components/ui/Toast'
import { FormCadastroUsuario } from './FormCadastroUsuario'
import { TabelaAcessos, type UsuarioRow } from './TabelaAcessos'

// Dados demo — substituir por props vindas do Server Component
const DEMO_USUARIOS: UsuarioRow[] = [
  { id: '1', nome: "Renan D'Alexandro", role: 'proprietario', email: 'renan@andorin.com.br',  telefone: '(11) 98888-0001', ativo: true,  ultimoAcesso: '2026-07-30T10:00:00Z', createdAt: '2024-01-15T00:00:00Z' },
  { id: '2', nome: 'Camila Rocha',      role: 'professor',    email: 'camila@andorin.com.br', telefone: '(11) 98888-0002', ativo: true,  ultimoAcesso: '2026-07-29T14:30:00Z', createdAt: '2024-03-01T00:00:00Z' },
  { id: '3', nome: 'Diego Mendes',      role: 'professor',    email: 'diego@andorin.com.br',  telefone: '(11) 98888-0003', ativo: true,  ultimoAcesso: '2026-07-30T09:15:00Z', createdAt: '2024-03-01T00:00:00Z' },
  { id: '4', nome: 'Ana Lima',          role: 'aluno',        email: 'ana@andorin.com.br',    telefone: null,               ativo: true,  ultimoAcesso: '2026-07-28T11:00:00Z', createdAt: '2025-01-10T00:00:00Z' },
  { id: '5', nome: 'Rafael Costa',      role: 'aluno',        email: 'rafael@andorin.com.br', telefone: null,               ativo: false, ultimoAcesso: '2026-06-01T08:00:00Z', createdAt: '2025-02-20T00:00:00Z' },
]

const DEMO_MEU_ID = '1' // simula o proprietário logado

export function AcessosClient() {
  const [modalAberto, setModalAberto] = useState(false)
  const [toast,       setToast]       = useState('')
  const [showToast,   setShowToast]   = useState(false)

  // Demo: refresh não faz nada (sem Supabase)
  function handleRefresh() {
    console.log('[demo] refresh da lista de usuários')
  }

  function handleSalvo() {
    setToast('Usuário cadastrado com sucesso!')
    setShowToast(true)
    handleRefresh()
  }

  return (
    <>
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-mid">
          {DEMO_USUARIOS.length} usuários cadastrados
        </p>
        <Button onClick={() => setModalAberto(true)}>
          + Novo usuário
        </Button>
      </div>

      {/* Tabela */}
      <TabelaAcessos
        usuarios={DEMO_USUARIOS}
        meuId={DEMO_MEU_ID}
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
