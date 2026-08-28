'use client'
// ─────────────────────────────────────────────────────────────
// TabelaAcessos.tsx
// Lista de todos os usuários com status de acesso.
// Client Component pois gerencia o modal de redefinição de senha
// e a ação de ativar/desativar sem recarregar a página inteira.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { alterarStatusAcesso, redefinirSenha } from '@/lib/actions/usuarios'
import { iniciais, avatarColorByName } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/permissions'
import type { Role } from '@/types/app'

export interface UsuarioRow {
  id:           string
  nome:         string
  role:         Role
  telefone:     string | null
  email:        string
  ativo:        boolean
  ultimoAcesso: string | null
  criadoPor:    string | null
  createdAt:    string
}

interface Props {
  usuarios:   UsuarioRow[]
  meuId:      string          // id do proprietario logado (para proteger a si mesmo)
  onRefresh:  () => void      // callback para recarregar a lista
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function TabelaAcessos({ usuarios, meuId, onRefresh }: Props) {
  // Estado do modal de redefinição de senha
  const [modalSenha, setModalSenha]   = useState<UsuarioRow | null>(null)
  const [novaSenha,  setNovaSenha]    = useState('')
  const [errSenha,   setErrSenha]     = useState('')
  const [loadSenha,  setLoadSenha]    = useState(false)

  // Toast de feedback
  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)

  function showMsg(msg: string) {
    setToast(msg); setShowToast(true)
  }

  // ── Ativar / desativar acesso ────────────────────────────
  async function handleToggleAtivo(u: UsuarioRow) {
    const result = await alterarStatusAcesso(u.id, !u.ativo)
    if (!result.ok) { showMsg(result.error); return }
    showMsg(u.ativo ? `Acesso de ${u.nome} desativado.` : `Acesso de ${u.nome} ativado.`)
    onRefresh()
  }

  // ── Redefinir senha ──────────────────────────────────────
  async function handleRedefinirSenha() {
    if (!modalSenha) return
    setErrSenha('')
    if (novaSenha.length < 6) { setErrSenha('Mínimo 6 caracteres.'); return }
    setLoadSenha(true)
    const result = await redefinirSenha(modalSenha.id, novaSenha)
    setLoadSenha(false)
    if (!result.ok) { setErrSenha(result.error); return }
    setModalSenha(null)
    setNovaSenha('')
    showMsg(`Senha de ${modalSenha.nome} redefinida.`)
  }

  if (usuarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <span className="text-4xl opacity-30">👤</span>
        <p className="text-sm text-gray-mid">Nenhum usuário cadastrado ainda.</p>
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
              {/* Avatar + nome */}
              <Td>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: avatarColorByName(u.nome) }}
                  >
                    {iniciais(u.nome)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-dark leading-tight">{u.nome}</p>
                    {u.telefone && (
                      <p className="text-[11px] text-gray-mid">{u.telefone}</p>
                    )}
                  </div>
                </div>
              </Td>

              <Td className="text-gray-mid">{u.email}</Td>

              <Td>
                <Badge variant={u.role as Role}>
                  {ROLE_LABELS[u.role]}
                </Badge>
              </Td>

              {/* Situação: ativo / inativo */}
              <Td>
                <span className={[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                  u.ativo
                    ? 'bg-green/15 text-green-dk'
                    : 'bg-red/10 text-red',
                ].join(' ')}>
                  <span className={`w-1.5 h-1.5 rounded-full ${u.ativo ? 'bg-green-dk' : 'bg-red'}`} />
                  {u.ativo ? 'Ativo' : 'Bloqueado'}
                </span>
              </Td>

              <Td className="text-gray-mid text-sm">{formatDate(u.ultimoAcesso)}</Td>
              <Td className="text-gray-mid text-sm">{formatDate(u.createdAt)}</Td>

              {/* Ações */}
              <Td>
                <div className="flex items-center justify-end gap-2">
                  {/* Redefinir senha — não aparece para o próprio admin */}
                  {u.id !== meuId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setModalSenha(u); setNovaSenha(''); setErrSenha('') }}
                    >
                      🔑 Senha
                    </Button>
                  )}

                  {/* Ativar / Desativar — não aparece para o próprio admin */}
                  {u.id !== meuId && (
                    <Button
                      size="sm"
                      variant={u.ativo ? 'danger' : 'secondary'}
                      onClick={() => handleToggleAtivo(u)}
                    >
                      {u.ativo ? 'Bloquear' : 'Ativar'}
                    </Button>
                  )}

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
            <Button variant="ghost" onClick={() => setModalSenha(null)}>
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
            Digite a nova senha para <strong className="text-gray-dark">{modalSenha?.nome}</strong>.
            Ela vai substituir a senha atual imediatamente.
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
          />
        </div>
      </Modal>

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
