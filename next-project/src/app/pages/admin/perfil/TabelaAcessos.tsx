'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/perfil/TabelaAcessos.tsx
//
// Tabela de usuários com ações de editar, redefinir senha e bloquear.
// Client Component: gerencia estado do modal de senha e toasts.
//
// Ações (botões de ícone, com tooltip):
//   ✏️ Editar        → onEditar(usuario): o AcessosClient abre o formulário
//   🔑 Mude a senha  → redefinirSenha        ← (auth)/actions/usuarios
//   🔒 Desative o usuário → alterarStatusAcesso ← (auth)/actions/usuarios
//
// Após cada ação bem-sucedida, onRefresh() é chamado —
// que dispara router.refresh() no AcessosClient, re-executando
// o Server Component pai e atualizando a lista com dados do banco.
// ─────────────────────────────────────────────────────────────

import { useState }                              from 'react'
import { Table, Thead, Th, Tbody, Tr, Td }       from '@/components/ui/Table'
import { Badge }                                 from '@/components/ui/Badge'
import { Button }                                from '@/components/ui/Button'
import { IconButton }                            from '@/components/ui/IconButton'
import { IconLapis, IconChave, IconCadeado, IconCadeadoAberto } from '@/components/ui/icons'
import { Modal }                                 from '@/components/ui/Modal'
import { Input }                                 from '@/components/ui/Input'
import { Toast }                                 from '@/components/ui/Toast'
import { alterarStatusAcesso, redefinirSenha }   from '@/(auth)/actions/usuarios'
import { iniciais, avatarColorByName }           from '@/lib/utils'

// ── Tipo exportado — usado pelo AcessosClient e AcessosPage ──
// Espelha o retorno normalizado de listarUsuariosComCredencial()
export interface UsuarioRow {
  id:           string
  nome:         string
  role:         'proprietario' | 'funcionario' | 'professor' | 'aluno'
  telefone:     string | null
  email:        string
  ativo:        boolean
  ultimoAcesso: string | null
  createdAt:    string
}

const ROLE_LABELS: Record<UsuarioRow['role'], string> = {
  proprietario: '👑 Proprietário',
  funcionario:  '🏢 Funcionário',
  professor:    '🎭 Professor',
  aluno:        '🤸 Aluno',
}

interface Props {
  usuarios:  UsuarioRow[]
  meuId:     string      // id do usuário logado — para marcar a própria linha
  onRefresh: () => void  // dispara router.refresh() no AcessosClient
  onEditar:  (usuario: UsuarioRow) => void  // abre o modal de edição no AcessosClient
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function TabelaAcessos({ usuarios, meuId, onRefresh, onEditar }: Props) {

  // Estado do modal de redefinição de senha
  const [modalSenha, setModalSenha] = useState<UsuarioRow | null>(null)
  const [novaSenha,  setNovaSenha]  = useState('')
  const [errSenha,   setErrSenha]   = useState('')
  const [loadSenha,  setLoadSenha]  = useState(false)

  // Toast de feedback para ações
  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)

  function showMsg(msg: string) {
    setToast(msg)
    setShowToast(true)
  }

  // ── Ativar / Bloquear ──────────────────────────────────────
  async function handleToggleAtivo(u: UsuarioRow) {
    // ActionResult: result.ok determina o fluxo — sem necessidade de ?.
    const result = await alterarStatusAcesso(u.id, !u.ativo)

    if (!result.ok) {
      showMsg(result.error)
      return
    }

    showMsg(
      u.ativo
        ? `Acesso de ${u.nome} bloqueado.`
        : `Acesso de ${u.nome} reativado.`
    )
    // Atualiza a lista buscando dados frescos do banco
    onRefresh()
  }

  // ── Redefinir senha ────────────────────────────────────────
  async function handleRedefinirSenha() {
    if (!modalSenha) return
    setErrSenha('')

    if (novaSenha.length < 6) {
      setErrSenha('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoadSenha(true)
    const result = await redefinirSenha(modalSenha.id, novaSenha)
    setLoadSenha(false)

    if (!result.ok) {
      setErrSenha(result.error)
      return
    }

    setModalSenha(null)
    setNovaSenha('')
    showMsg(`Senha de ${modalSenha.nome} redefinida com sucesso.`)
  }

  // ── Estado vazio ───────────────────────────────────────────
  if (usuarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <span className="text-4xl opacity-30">👤</span>
        <p className="text-sm text-gray-mid">Nenhum usuário cadastrado ainda.</p>
        <p className="text-xs text-gray-mid">Use o botão "+ Novo usuário" para começar.</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <Thead>
          <tr>
            <Th>Usuário</Th>
            <Th>E-mail</Th>
            <Th>Tipo</Th>
            <Th>Situação</Th>
            <Th>Último acesso</Th>
            <Th>Cadastrado em</Th>
            <Th className="text-right">Ações</Th>
          </tr>
        </Thead>
        <Tbody>
          {usuarios.map((u) => (
            <Tr key={u.id}>

              {/* Avatar + nome + telefone */}
              <Td>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center
                                text-xs font-bold text-off-white flex-shrink-0"
                    style={{ background: avatarColorByName(u.nome) }}
                  >
                    {iniciais(u.nome)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-dark leading-tight">
                      {u.nome}
                    </p>
                    {u.telefone && (
                      <p className="text-[11px] text-gray-mid">{u.telefone}</p>
                    )}
                  </div>
                </div>
              </Td>

              <Td className="text-gray-mid">{u.email}</Td>

              {/* Badge de role */}
              <Td>
                <Badge variant={u.role}>
                  {ROLE_LABELS[u.role]}
                </Badge>
              </Td>

              {/* Status ativo/bloqueado */}
              <Td>
                <span className={[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                  u.ativo
                    ? 'bg-green-light/40 text-chumbo'
                    : 'bg-red/10 text-red',
                ].join(' ')}>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.ativo ? 'bg-chumbo' : 'bg-red'}`} />
                  {u.ativo ? 'Ativo' : 'Bloqueado'}
                </span>
              </Td>

              <Td className="text-gray-mid text-sm">{formatDate(u.ultimoAcesso)}</Td>
              <Td className="text-gray-mid text-sm">{formatDate(u.createdAt)}</Td>

              {/* Ações — ocultas na própria linha */}
              <Td>
                <div className="flex items-center justify-end gap-2">

                  <IconButton label="Editar" onClick={() => onEditar(u)}>
                    <IconLapis />
                  </IconButton>

                  {u.id !== meuId && (
                    <IconButton
                      label="Mude a senha"
                      onClick={() => {
                        setModalSenha(u)
                        setNovaSenha('')
                        setErrSenha('')
                      }}
                    >
                      <IconChave />
                    </IconButton>
                  )}

                  {u.id !== meuId && (
                    <IconButton
                      label={u.ativo ? 'Desative o usuário' : 'Ative o usuário'}
                      variant={u.ativo ? 'danger' : 'secondary'}
                      onClick={() => handleToggleAtivo(u)}
                    >
                      {u.ativo ? <IconCadeado /> : <IconCadeadoAberto />}
                    </IconButton>
                  )}

                  {/* Linha do próprio usuário — sem senha/bloqueio */}
                  {u.id === meuId && (
                    <span className="text-xs text-gray-mid italic">Você</span>
                  )}

                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Modal: redefinir senha */}
      <Modal
        open={!!modalSenha}
        onClose={() => setModalSenha(null)}
        title={`Redefinir senha — ${modalSenha?.nome ?? ''}`}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalSenha(null)} disabled={loadSenha}>
              Cancelar
            </Button>
            <Button onClick={handleRedefinirSenha} loading={loadSenha}>
              Salvar nova senha
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-mid">
            Digite a nova senha para{' '}
            <strong className="text-gray-dark">{modalSenha?.nome}</strong>.
            Ela substituirá a senha atual imediatamente.
          </p>
          <Input
            id="nova-senha"
            label="Nova senha"
            type="password"
            placeholder="Mín. 6 caracteres"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            autoComplete="new-password"
            error={errSenha}
            showPasswordToggle
          />
        </div>
      </Modal>

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
