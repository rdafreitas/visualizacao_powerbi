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

import { useMemo, useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import { Button }                  from '@/components/ui/Button'
import { Chip }                    from '@/components/ui/Chip'
import { Input }                   from '@/components/ui/Input'
import { Toast }                   from '@/components/ui/Toast'
import { filtrarUsuarios }         from '@/lib/utils'
import { FormCadastroUsuario }     from './FormCadastroUsuario'
import { FormEditarUsuario }       from './FormEditarUsuario'
import { ROLES }                   from './SeletorRole'
import { TabelaAcessos, type UsuarioRow } from './TabelaAcessos'

interface Props {
  usuarios: UsuarioRow[]
  meuId:    string
}

export function AcessosClient({ usuarios, meuId }: Props) {
  const router = useRouter()

  const [modalAberto,  setModalAberto]  = useState(false)
  const [editando,     setEditando]     = useState<UsuarioRow | null>(null)
  const [filtroRole,   setFiltroRole]   = useState<'todos' | UsuarioRow['role']>('todos')
  const [busca,        setBusca]        = useState('')
  const [toast,        setToast]        = useState('')
  const [showToast,    setShowToast]    = useState(false)
  const [isPending,    startTransition] = useTransition()

  // A busca por nome só atua sobre quem passou pelo filtro de role.
  const visiveis = useMemo(
    () => filtrarUsuarios(usuarios, filtroRole, busca),
    [usuarios, filtroRole, busca],
  )
  const filtrando = filtroRole !== 'todos' || busca.trim() !== ''

  function limparFiltros() {
    setFiltroRole('todos')
    setBusca('')
  }

  // Solicita ao Next.js que re-execute o Server Component pai.
  // Nenhum dado fica em memória local — tudo vem do banco após o refresh.
  function handleRefresh() {
    startTransition(() => {
      router.refresh()
    })
  }

  function handleSalvo(mensagem: string) {
    setToast(mensagem)
    setShowToast(true)
    handleRefresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-mid">
          {filtrando
            ? `${visiveis.length} de ${usuarios.length} ${usuarios.length === 1 ? 'usuário' : 'usuários'}`
            : `${usuarios.length} ${usuarios.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}`}
          {/* isPending: verdadeiro enquanto o refresh do banco está em andamento */}
          {isPending && ' · atualizando…'}
        </p>
        <Button onClick={() => setModalAberto(true)}>
          + Novo usuário
        </Button>
      </div>

      {usuarios.length > 0 && (
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-sm">
              <Input
                id="busca-usuario"
                type="search"
                placeholder="Buscar por nome"
                aria-label="Buscar usuário por nome"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoComplete="off"
              />
            </div>
            {filtrando && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip
              label="Todos"
              active={filtroRole === 'todos'}
              onClick={() => setFiltroRole('todos')}
            />
            {ROLES.map((r) => (
              <Chip
                key={r.value}
                label={r.label}
                active={filtroRole === r.value}
                onClick={() => setFiltroRole(r.value)}
              />
            ))}
          </div>
        </div>
      )}

      {usuarios.length > 0 && visiveis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <span className="text-4xl opacity-30">🔍</span>
          <p className="text-sm text-gray-mid">Nenhum usuário encontrado com esses filtros.</p>
          <Button variant="outline" size="sm" onClick={limparFiltros}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <TabelaAcessos
          usuarios={visiveis}
          meuId={meuId}
          onRefresh={handleRefresh}
          onEditar={setEditando}
        />
      )}

      <FormCadastroUsuario
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        onSave={() => handleSalvo('Usuário cadastrado com sucesso!')}
      />

      {editando && (
        <FormEditarUsuario
          key={editando.id}
          usuario={editando}
          ehProprio={editando.id === meuId}
          onClose={() => setEditando(null)}
          onSave={() => handleSalvo('Usuário atualizado com sucesso!')}
        />
      )}

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
