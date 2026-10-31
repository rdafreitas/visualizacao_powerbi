'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/professores/ProfessoresClient.tsx
//
// Client Component da tela de Professores.
// Recebe dados reais como props — sem queries no browser.
// ─────────────────────────────────────────────────────────────

import { useState, useTransition }  from 'react'
import { useRouter }                from 'next/navigation'
import { PageHeader }               from '@/components/layout/PageHeader'
import { Card }                     from '@/components/ui/Card'
import { Button }                   from '@/components/ui/Button'
import { Toast }                    from '@/components/ui/Toast'
import { iniciais, avatarColorByName, formatBRL } from '@/lib/utils'
import { alterarStatusAcesso }      from '@/(auth)/actions/usuarios'
import type { ProfessorComMetricas } from '@/(auth)/actions/professores-admin'

// Barra de progresso genérica — usada para presença e pagamento
function Barra({ pct, cor }: { pct: number; cor: string }) {
  return (
    <div className="flex-1 h-2 bg-gray-bg rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, background: cor }}
      />
    </div>
  )
}

interface Props {
  professores:  ProfessorComMetricas[]
  erroInicial?: string
}

export function ProfessoresClient({ professores, erroInicial }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)

  function showMsg(msg: string) { setToast(msg); setShowToast(true) }

  // ── KPIs calculados dos dados reais ──────────────────────────
  const totalProfessores = professores.length
  const totalTurmas      = professores.reduce((s, p) => s + p.turmasAtivas,    0)
  const totalFolha       = professores.reduce((s, p) => s + p.remuneracaoMes,  0)
  const totalPago        = professores.reduce((s, p) => s + p.pagoMes,         0)
  const ativos           = professores.filter((p) => p.ativo).length

  const kpis = [
    { icon: '🎭', valor: String(totalProfessores), label: 'Professores',    cor: 'text-chumbo'    },
    { icon: '✅', valor: String(ativos),            label: 'Com acesso ativo', cor: 'text-chumbo'  },
    { icon: '📅', valor: String(totalTurmas),        label: 'Turmas ativas', cor: 'text-chumbo'    },
    { icon: '💰', valor: formatBRL(totalFolha),      label: 'Folha do mês',  cor: 'text-orange-dk' },
  ]

  // ── Bloquear / ativar acesso ──────────────────────────────────
  async function handleToggleAcesso(p: ProfessorComMetricas) {
    const novoAtivo = !p.ativo
    const result = await alterarStatusAcesso(p.id, novoAtivo)

    if (!result.ok) { showMsg(result.error); return }

    startTransition(() => router.refresh())
    showMsg(
      novoAtivo
        ? `Acesso de ${p.nome} reativado.`
        : `Acesso de ${p.nome} bloqueado.`
    )
  }

  if (erroInicial) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm" style={{ color: '#922b21' }}>{erroInicial}</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Professores 🎭"
        subtitle="Gerencie o corpo docente, turmas e remuneração."
        actions={
          // Professores são criados na tela de Acessos (role = professor).
          // Redireciona em vez de duplicar o formulário de cadastro.
          <Button
            onClick={() => router.push('/pages/admin/perfil/acessos')}
          >
            + Novo professor
          </Button>
        }
      />

      {/* KPIs reais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {kpis.map((k) => (
          <Card key={k.label}>
            <span className="text-3xl block mb-3">{k.icon}</span>
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

      {/* Estado vazio */}
      {professores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl opacity-30">🎭</span>
          <p className="text-sm text-gray-mid">Nenhum professor cadastrado ainda.</p>
          <Button
            size="sm"
            onClick={() => router.push('/pages/admin/perfil/acessos')}
          >
            Ir para Acessos e criar professor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {professores.map((p) => {
            // Percentual já pago da remuneração do mês
            const pctPago = p.remuneracaoMes > 0
              ? Math.round((p.pagoMes / p.remuneracaoMes) * 100)
              : 0

            return (
              <Card key={p.id} padding="none">
                <div className="p-5">

                  {/* Cabeçalho */}
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center
                                 text-xl font-extrabold text-off-white flex-shrink-0"
                      style={{
                        background: avatarColorByName(p.nome),
                        fontFamily: 'var(--font-montserrat)',
                      }}
                    >
                      {iniciais(p.nome)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="font-extrabold text-gray-dark text-base leading-tight"
                        style={{ fontFamily: 'var(--font-montserrat)' }}
                      >
                        {p.nome}
                      </p>
                      <p className="text-xs text-gray-mid mt-0.5">{p.email}</p>
                      {p.telefone && (
                        <p className="text-xs text-gray-mid">{p.telefone}</p>
                      )}

                      {/* Chips de modalidade — derivados das turmas reais */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.modalidades.length > 0
                          ? p.modalidades.map((m) => (
                              <span
                                key={m}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-bg text-gray-mid"
                              >
                                {m}
                              </span>
                            ))
                          : (
                            <span className="text-[10px] text-gray-mid italic">
                              Sem turmas ativas
                            </span>
                          )
                        }
                      </div>
                    </div>

                    {/* Badge de acesso ativo/bloqueado */}
                    <span
                      className={[
                        'text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0',
                        p.ativo
                          ? 'bg-green-light/40 text-chumbo'
                          : 'bg-red/10 text-red',
                      ].join(' ')}
                    >
                      {p.ativo ? '● Ativo' : '● Bloqueado'}
                    </span>
                  </div>

                  {/* Métricas em grid 2×2 */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      {
                        label: 'Turmas ativas',
                        valor: p.turmasAtivas > 0
                          ? `${p.turmasAtivas} turma${p.turmasAtivas > 1 ? 's' : ''}`
                          : '— sem turmas',
                        icon: '📅',
                      },
                      {
                        label: 'Remuneração do mês',
                        valor: p.remuneracaoMes > 0
                          ? formatBRL(p.remuneracaoMes)
                          : '— sem aulas',
                        icon: '💰',
                      },
                      {
                        label: 'Já pago no mês',
                        valor: p.pagoMes > 0 ? formatBRL(p.pagoMes) : 'Pendente',
                        icon: '✅',
                      },
                      {
                        label: 'Modalidades',
                        valor: p.modalidades.length > 0
                          ? `${p.modalidades.length} modalidade${p.modalidades.length > 1 ? 's' : ''}`
                          : '— nenhuma',
                        icon: '🎯',
                      },
                    ].map(({ label, valor, icon }) => (
                      <div key={label} className="bg-gray-bg rounded-xl p-3">
                        <p className="text-[10px] text-gray-mid mb-1">{icon} {label}</p>
                        <p className="text-sm font-bold text-gray-dark truncate">{valor}</p>
                      </div>
                    ))}
                  </div>

                  {/* Barra de pagamento do mês */}
                  {p.remuneracaoMes > 0 && (
                    <div className="mb-1">
                      <div className="flex justify-between mb-1">
                        <p className="text-[11px] text-gray-mid">
                          Pagamento do mês
                        </p>
                        <p className="text-[11px] font-bold text-gray-dark">
                          {pctPago}% pago
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Barra
                          pct={pctPago}
                          cor={pctPago === 100 ? '#BFD6A1' : '#f27406'}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Rodapé com ações */}
                <div className="flex gap-2 px-5 py-3 border-t border-gray-bg">
                  <Button
                    size="sm"
                    variant={p.ativo ? 'danger' : 'secondary'}
                    onClick={() => handleToggleAcesso(p)}
                  >
                    {p.ativo ? '🔒 Bloquear' : '🔓 Reativar'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
