'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/alunos/AlunosClient.tsx
//
// Client Component — gerencia toda a interatividade da tela.
// Recebe dados reais como props do Server Component (page.tsx).
//
// RESPONSABILIDADES:
//   • Filtro por tab (status) e busca por nome/email em memória
//   • Contagens dinâmicas por status (calculadas dos dados reais)
//   • Modal de nova matrícula conectado à Server Action
//   • Atualização da lista via router.refresh() após mutações
// ─────────────────────────────────────────────────────────────

import { useState, useTransition }          from 'react'
import { useRouter }                        from 'next/navigation'
import { PageHeader }                       from '@/components/layout/PageHeader'
import { Card }                             from '@/components/ui/Card'
import { Badge }                            from '@/components/ui/Badge'
import { Button }                           from '@/components/ui/Button'
import { Input }                            from '@/components/ui/Input'
import { Tabs }                             from '@/components/ui/Tabs'
import { Modal }                            from '@/components/ui/Modal'
import { Toast }                            from '@/components/ui/Toast'
import { Table, Thead, Th, Tbody, Tr, Td }  from '@/components/ui/Table'
import { iniciais, avatarColorByName, formatBRL, formatDataCurta } from '@/lib/utils'
import { criarMatricula, atualizarStatusMatricula } from '@/(auth)/actions/matriculas'
import type { AlunoComMatricula, PlanoRow }          from '@/(auth)/actions/matriculas'

// ── Status válidos e seus labels visuais ──────────────────────
// 'experimental' é o nome correto do banco — não 'trial'
type MatriculaStatus = 'ativo' | 'inadimplente' | 'experimental' | 'inativo'

const STATUS_LABEL: Record<MatriculaStatus | 'sem_matricula', string> = {
  ativo:         '🟢 Ativo',
  inadimplente:  '🔴 Inadimplente',
  experimental:  '🟡 Experimental',
  inativo:       '⚪ Inativo',
  sem_matricula: '➖ Sem matrícula',
}

const STATUS_COR_VENC: Record<string, string> = {
  inadimplente: 'text-red font-semibold',
}

interface Props {
  alunos:       AlunoComMatricula[]
  planos:       PlanoRow[]
  erroInicial?: string
}

export function AlunosClient({ alunos, planos, erroInicial }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ── Estado de filtros ──────────────────────────────────────
  const [tab,   setTab]   = useState<MatriculaStatus | 'todos' | 'sem_matricula'>('todos')
  const [busca, setBusca] = useState('')

  // ── Estado do modal de nova matrícula ──────────────────────
  const [modal,       setModal]       = useState(false)
  const [alunoSel,    setAlunoSel]    = useState('')
  const [planoSel,    setPlanoSel]    = useState('')
  const [statusSel,   setStatusSel]   = useState<MatriculaStatus>('experimental')
  const [erroModal,   setErroModal]   = useState('')
  const [salvando,    setSalvando]    = useState(false)

  // ── Toast ─────────────────────────────────────────────────
  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)

  function showMsg(msg: string) { setToast(msg); setShowToast(true) }

  // ── Contagens dinâmicas para as tabs ──────────────────────
  // Calculadas dos dados reais — sem hardcode
  const contagens = {
    todos:         alunos.length,
    ativo:         alunos.filter((a) => a.status === 'ativo').length,
    inadimplente:  alunos.filter((a) => a.status === 'inadimplente').length,
    experimental:  alunos.filter((a) => a.status === 'experimental').length,
    inativo:       alunos.filter((a) => a.status === 'inativo').length,
    sem_matricula: alunos.filter((a) => !a.status).length,
  }

  const TABS = [
    { key: 'todos',         label: `Todos (${contagens.todos})` },
    { key: 'ativo',         label: `Ativos (${contagens.ativo})` },
    { key: 'inadimplente',  label: `Inadimplentes (${contagens.inadimplente})` },
    { key: 'experimental',  label: `Experimental (${contagens.experimental})` },
    { key: 'inativo',       label: `Inativos (${contagens.inativo})` },
    { key: 'sem_matricula', label: `Sem matrícula (${contagens.sem_matricula})` },
  ]

  // ── Filtro em memória ──────────────────────────────────────
  const filtrados = alunos.filter((a) => {
    const matchTab =
      tab === 'todos'
        ? true
        : tab === 'sem_matricula'
          ? !a.status
          : a.status === tab

    const buscaMin = busca.toLowerCase()
    const matchBusca =
      !busca ||
      a.nome.toLowerCase().includes(buscaMin) ||
      a.email.toLowerCase().includes(buscaMin)

    return matchTab && matchBusca
  })

  // ── KPIs calculados dos dados reais ───────────────────────
  const kpis = [
    { icon: '👥', valor: contagens.todos,         label: 'Total de alunos',  cor: 'text-gray-dark' },
    { icon: '✅', valor: contagens.ativo,          label: 'Ativos',           cor: 'text-chumbo'   },
    { icon: '⚠️', valor: contagens.inadimplente,  label: 'Inadimplentes',    cor: 'text-red'       },
    { icon: '🎟️', valor: contagens.experimental,  label: 'Em experimental',  cor: 'text-orange-dk' },
  ]

  // ── Handler de nova matrícula ─────────────────────────────
  async function handleCriarMatricula() {
    setErroModal('')

    if (!alunoSel) return setErroModal('Selecione um aluno.')
    if (!planoSel) return setErroModal('Selecione um plano.')

    setSalvando(true)
    const result = await criarMatricula({
      alunoId: alunoSel,
      planoId: planoSel,
      status:  statusSel,
    })
    setSalvando(false)

    if (!result.ok) { setErroModal(result.error); return }

    setModal(false)
    setAlunoSel(''); setPlanoSel('')
    setStatusSel('experimental')

    // Rebusca dados atualizados do Server Component pai
    startTransition(() => { router.refresh() })
    showMsg('Matrícula criada com sucesso.')
  }

  // ── Handler de atualização de status ─────────────────────
  async function handleAtualizarStatus(
    aluno:     AlunoComMatricula,
    novoStatus: MatriculaStatus
  ) {
    if (!aluno.matriculaId) return

    const result = await atualizarStatusMatricula(
      aluno.matriculaId,
      aluno.id,
      novoStatus
    )

    if (!result.ok) { showMsg(result.error); return }

    startTransition(() => { router.refresh() })
    showMsg(`Status de ${aluno.nome} atualizado para ${STATUS_LABEL[novoStatus]}.`)
  }

  // Alunos sem matrícula — disponíveis no seletor do modal
  const alunosSemMatricula = alunos.filter((a) => !a.status || a.status === 'inativo')

  if (erroInicial) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm text-red">{erroInicial}</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Alunos"
        subtitle="Gerencie matrículas, planos e situação financeira."
        actions={<Button onClick={() => setModal(true)}>+ Nova matrícula</Button>}
      />

      {/* KPIs reais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <span className="text-3xl block mb-2">{k.icon}</span>
            <p
              className={`text-[28px] font-extrabold leading-none ${k.cor}`}
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {k.valor}
            </p>
            <p className="text-xs text-gray-mid mt-1">{k.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 overflow-x-auto">
            <Tabs tabs={TABS} active={tab} onChange={(v) => setTab(v as typeof tab)} />
          </div>
          <Input
            id="busca"
            placeholder="Buscar por nome ou e-mail…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="sm:w-64"
          />
        </div>

        {/* Estado vazio */}
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-4xl opacity-30">👤</span>
            <p className="text-sm text-gray-mid">
              {busca
                ? `Nenhum aluno encontrado para "${busca}".`
                : 'Nenhum aluno nesta categoria.'}
            </p>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Aluno</Th>
                <Th>Plano</Th>
                <Th>Situação</Th>
                <Th>Mensalidade</Th>
                <Th>Vencimento</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </Thead>
            <Tbody>
              {filtrados.map((a) => {
                const statusKey = (a.status ?? 'sem_matricula') as keyof typeof STATUS_LABEL
                const vencLabel = a.vencimento
                  ? formatDataCurta(new Date(a.vencimento))
                  : '—'

                return (
                  <Tr key={a.id}>
                    {/* Aluno */}
                    <Td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center
                                     text-xs font-bold text-off-white flex-shrink-0"
                          style={{ background: avatarColorByName(a.nome) }}
                        >
                          {iniciais(a.nome)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-dark">{a.nome}</p>
                          <p className="text-[11px] text-gray-mid">{a.email}</p>
                        </div>
                      </div>
                    </Td>

                    {/* Plano */}
                    <Td>
                      <span className="text-sm font-semibold text-gray-dark">
                        {a.planoNome ?? '—'}
                      </span>
                    </Td>

                    {/* Status */}
                    <Td>
                      <Badge variant={a.status ?? 'inativo'}>
                        {STATUS_LABEL[statusKey]}
                      </Badge>
                    </Td>

                    {/* Mensalidade */}
                    <Td>
                      <span className="font-semibold text-gray-dark">
                        {a.planoValor ? formatBRL(a.planoValor) : '—'}
                      </span>
                    </Td>

                    {/* Vencimento */}
                    <Td className={STATUS_COR_VENC[a.status ?? ''] ?? 'text-gray-mid'}>
                      {vencLabel}
                    </Td>

                    {/* Ações */}
                    <Td>
                      <div className="flex justify-end gap-2">
                        {/* Botão de atualização de status rápida */}
                        {a.status === 'ativo' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleAtualizarStatus(a, 'inadimplente')}
                            disabled={isPending}
                          >
                            Inadimplente
                          </Button>
                        )}
                        {a.status === 'inadimplente' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAtualizarStatus(a, 'ativo')}
                            disabled={isPending}
                          >
                            Regularizar
                          </Button>
                        )}
                        {a.status === 'experimental' && (
                          <Button
                            size="sm"
                            onClick={() => handleAtualizarStatus(a, 'ativo')}
                            disabled={isPending}
                          >
                            Confirmar
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Modal de nova matrícula */}
      <Modal
        open={modal}
        onClose={() => { setModal(false); setErroModal('') }}
        title="Nova matrícula"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={handleCriarMatricula} loading={salvando}>
              Cadastrar matrícula
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">

          {/* Seletor de aluno */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
              Aluno
            </p>
            <select
              value={alunoSel}
              onChange={(e) => setAlunoSel(e.target.value)}
              disabled={salvando}
              className="w-full text-sm border border-black/[0.08] rounded-xl px-3 py-3
                         bg-white text-gray-dark outline-none focus:border-orange
                         disabled:opacity-50"
            >
              <option value="">Selecione um aluno…</option>
              {alunosSemMatricula.map((a) => (
                <option key={a.id} value={a.id}>{a.nome} — {a.email}</option>
              ))}
            </select>
            {alunosSemMatricula.length === 0 && (
              <p className="text-[11px] text-gray-mid mt-1">
                Todos os alunos já possuem matrícula ativa ou experimental.
              </p>
            )}
          </div>

          {/* Seletor de plano */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
              Plano
            </p>
            <div className="grid grid-cols-1 gap-2">
              {planos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanoSel(p.id)}
                  disabled={salvando}
                  className={[
                    'flex items-center justify-between p-3 rounded-xl border text-left',
                    'transition-all disabled:opacity-50',
                    planoSel === p.id
                      ? 'border-bordo bg-bordo/5 text-bordo'
                      : 'border-black/[0.06] hover:border-bordo/40 text-gray-dark',
                  ].join(' ')}
                >
                  <span className="font-semibold text-sm">{p.nome}</span>
                  <span className="text-sm font-bold">{formatBRL(p.valor)}/mês</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status inicial */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
              Status inicial
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['experimental', 'ativo'] as MatriculaStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusSel(s)}
                  disabled={salvando}
                  className={[
                    'py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-50',
                    statusSel === s
                      ? 'border-chumbo bg-chumbo text-off-white'
                      : 'border-black/[0.06] text-gray-mid hover:border-black/20',
                  ].join(' ')}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {erroModal && (
            <div
              className="px-4 py-3 rounded-xl border text-xs font-semibold"
              style={{
                background:  'rgba(192,57,43,0.06)',
                borderColor: 'rgba(192,57,43,0.25)',
                color:       '#922b21',
              }}
            >
              {erroModal}
            </div>
          )}
        </div>
      </Modal>

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
