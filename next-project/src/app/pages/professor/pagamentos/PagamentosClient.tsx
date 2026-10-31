'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/pagamentos/PagamentosClient.tsx
//
// Client Component — gerencia seletor de mês e exibição.
// Necessário porque mudar de mês muda os dados exibidos
// (useState + Server Action chamada do client).
// ─────────────────────────────────────────────────────────────

import { useState }                  from 'react'
import { PageHeader }                from '@/components/layout/PageHeader'
import { Card, CardTitle }           from '@/components/ui/Card'
import { Toast }                     from '@/components/ui/Toast'
import { formatBRL, formatDataCurta } from '@/lib/utils'
import { VALOR_AULA_ALTO, VALOR_AULA_BAIXO, THRESHOLD_PRESENCAS } from '@/lib/constants'
import {
  listarPagamentosProfessor,
  type PagamentoDetalhe,
  type MesHistorico,
} from '@/(auth)/actions/pagamentos-professor'

// ── Estilos de status ─────────────────────────────────────────

const STATUS_STYLE = {
  pago:     { label: '✓ Pago',      cls: 'bg-green-light/40 text-chumbo'  },
  parcial:  { label: '◑ Parcial',   cls: 'bg-blue-light/30 text-chumbo'   },
  pendente: { label: '⏳ Pendente',  cls: 'bg-orange/15 text-orange-dk'    },
}

// ── Helpers ───────────────────────────────────────────────────

function formatarMesLabel(mes: string) {
  // 'YYYY-MM-01' ou 'YYYY-MM' → 'Julho 2026'
  const [ano, m] = mes.split('-')
  const d = new Date(Number(ano), Number(m) - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function gerarUltimos12Meses(): { value: string; label: string }[] {
  const meses = []
  const hoje  = new Date()
  for (let i = 0; i < 12; i++) {
    const d   = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const val = d.toISOString().substring(0, 7)
    meses.push({
      value: val,
      label: formatarMesLabel(val),
    })
  }
  return meses
}

// ── Props ─────────────────────────────────────────────────────

interface Props {
  pagamentosIniciais: PagamentoDetalhe[]
  historico:          MesHistorico[]
  mesInicial:         string   // 'YYYY-MM'
}

export function PagamentosClient({ pagamentosIniciais, historico, mesInicial }: Props) {

  const [mesSelecionado, setMesSelecionado] = useState(mesInicial)
  const [pagamentos,     setPagamentos]     = useState<PagamentoDetalhe[]>(pagamentosIniciais)
  const [carregando,     setCarregando]     = useState(false)

  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)

  const meses = gerarUltimos12Meses()

  // ── Troca de mês ─────────────────────────────────────────────
  async function handleMudancaMes(novoMes: string) {
    setMesSelecionado(novoMes)
    setCarregando(true)
    const resultado = await listarPagamentosProfessor(novoMes)
    if (resultado.ok) setPagamentos(resultado.data)
    else { setToast(resultado.error); setShowToast(true) }
    setCarregando(false)
  }

  // ── Cálculos do mês selecionado ───────────────────────────────
  const totalValor     = pagamentos.reduce((s, p) => s + p.valor,     0)
  const totalPresencas = pagamentos.reduce((s, p) => s + p.presencas, 0)
  const totalAulas200  = pagamentos.filter((p) => p.valor >= VALOR_AULA_ALTO).length
  const totalAulas150  = pagamentos.filter((p) => p.valor <  VALOR_AULA_ALTO).length

  const statusMes: 'pago' | 'parcial' | 'pendente' =
    pagamentos.length === 0
      ? 'pendente'
      : pagamentos.every((p) => p.pago)
        ? 'pago'
        : pagamentos.some((p) => p.pago)
          ? 'parcial'
          : 'pendente'

  const mesLabel = formatarMesLabel(mesSelecionado)

  return (
    <>
      <PageHeader
        title="Pagamentos 💵"
        subtitle="Extrato de remuneração por aula ministrada."
      />

      {/* Seletor de mês */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-xs font-bold text-gray-mid uppercase tracking-wide">
          Competência
        </label>
        <select
          value={mesSelecionado}
          onChange={(e) => handleMudancaMes(e.target.value)}
          disabled={carregando}
          className="text-sm border border-black/[0.08] rounded-xl px-3 py-2
                     bg-white text-gray-dark outline-none focus:border-chumbo
                     disabled:opacity-50 transition-colors"
        >
          {meses.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        {carregando && (
          <span className="w-4 h-4 rounded-full border-2 border-chumbo border-t-transparent animate-spin" />
        )}
      </div>

      {/* Hero do mês — resumo financeiro */}
      <div
        className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-5 flex-wrap"
        style={{ background: 'linear-gradient(135deg, #211D1C, #3a3330)' }}
      >
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'rgba(244,231,206,.50)' }}
          >
            Competência
          </p>
          <p
            className="text-xl font-extrabold text-white"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            {mesLabel}
          </p>
          <div className="flex gap-5 mt-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <p className="text-sm font-semibold text-white">
                {pagamentos.length} aula{pagamentos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <p className="text-sm font-semibold text-white">
                {totalPresencas} presença{totalPresencas !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'rgba(244,231,206,.50)' }}
          >
            Remuneração bruta
          </p>
          <p
            className="text-3xl font-extrabold"
            style={{ color: '#f27406', fontFamily: 'var(--font-montserrat)' }}
          >
            {formatBRL(totalValor)}
          </p>
          {pagamentos.length > 0 && (
            <div className="flex items-center gap-2 mt-2 justify-end">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[statusMes].cls}`}>
                {STATUS_STYLE[statusMes].label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Detalhamento + Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 mb-5">

        {/* Tabela de aulas do mês */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-bg flex items-center justify-between">
            <CardTitle className="mb-0">Detalhamento por aula</CardTitle>
            <span className="text-xs text-gray-mid">{pagamentos.length} aulas</span>
          </div>

          {pagamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-3xl opacity-30">📋</span>
              <p className="text-sm text-gray-mid">
                Nenhuma aula com presenças em {mesLabel}.
              </p>
              <p className="text-xs text-gray-mid">
                Marque presenças na Agenda para gerar pagamentos.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-bg max-h-[480px] overflow-y-auto scrollbar-none">
                {pagamentos.map((p) => {
                  const dataAula  = p.inicio ? new Date(p.inicio) : null
                  const isAltoVal = p.valor >= VALOR_AULA_ALTO
                  return (
                    <div key={p.id} className="flex items-center gap-4 px-6 py-3.5">
                      {/* Data */}
                      <div className="flex-shrink-0 w-14">
                        {dataAula ? (
                          <>
                            <p className="text-xs font-bold text-gray-dark">
                              {String(dataAula.getDate()).padStart(2, '0')}
                            </p>
                            <p className="text-[10px] text-gray-mid">
                              {dataAula.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-mid">—</p>
                        )}
                      </div>

                      <div className="w-px h-8 bg-black/6 flex-shrink-0" />

                      {/* Aula */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-dark truncate">
                          {p.aulaEmoji ?? '🎪'} {p.aulaNome}
                        </p>
                        <p className="text-[11px] text-gray-mid mt-0.5">
                          {dataAula
                            ? dataAula.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                          {' · '}
                          {p.presencas} aluno{p.presencas !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Valor + status */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className="text-sm font-extrabold text-chumbo"
                          style={{ fontFamily: 'var(--font-montserrat)' }}
                        >
                          {formatBRL(p.valor)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {!isAltoVal && (
                            <span className="text-[9px] text-gray-mid">
                              {'< '}{THRESHOLD_PRESENCAS} pres.
                            </span>
                          )}
                          {p.pago && (
                            <span className="text-[9px] font-bold text-green-700">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Rodapé com totais */}
              <div className="px-6 py-4 border-t border-gray-bg bg-gray-bg/40 flex justify-between items-center">
                <p className="text-xs text-gray-mid">
                  {totalAulas200}× {formatBRL(VALOR_AULA_ALTO)}
                  {totalAulas150 > 0 && ` · ${totalAulas150}× ${formatBRL(VALOR_AULA_BAIXO)}`}
                </p>
                <p
                  className="text-base font-extrabold text-chumbo"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  {formatBRL(totalValor)}
                </p>
              </div>
            </>
          )}
        </Card>

        {/* Coluna direita */}
        <div className="flex flex-col gap-5">

          {/* Regra de remuneração — com constantes reais */}
          <Card>
            <CardTitle>Como é calculado</CardTitle>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-bg">
                <div
                  className="w-14 h-10 rounded-xl flex items-center justify-center
                             text-sm font-extrabold text-off-white flex-shrink-0"
                  style={{ background: '#f27406', fontFamily: 'var(--font-montserrat)' }}
                >
                  {formatBRL(VALOR_AULA_ALTO)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-dark">
                    {THRESHOLD_PRESENCAS}+ presenças
                  </p>
                  <p className="text-xs text-gray-mid mt-0.5">Valor cheio por aula</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-bg">
                <div
                  className="w-14 h-10 rounded-xl flex items-center justify-center
                             text-sm font-extrabold text-off-white flex-shrink-0"
                  style={{ background: '#8a7d70', fontFamily: 'var(--font-montserrat)' }}
                >
                  {formatBRL(VALOR_AULA_BAIXO)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-dark">
                    Menos de {THRESHOLD_PRESENCAS} presenças
                  </p>
                  <p className="text-xs text-gray-mid mt-0.5">Valor reduzido</p>
                </div>
              </div>

              <p className="text-[11px] text-gray-mid pt-1 border-t border-gray-bg">
                Calculado automaticamente após cada check-in.
                Pagamento processado pelo administrador.
              </p>
            </div>
          </Card>

          {/* Histórico de meses */}
          <Card padding="none">
            <div className="px-5 py-4 border-b border-gray-bg">
              <CardTitle className="mb-0">Histórico</CardTitle>
            </div>

            {historico.length === 0 ? (
              <p className="text-sm text-gray-mid text-center py-6">
                Nenhum histórico disponível.
              </p>
            ) : (
              <div className="divide-y divide-gray-bg">
                {historico.map((h) => (
                  <div key={h.mes} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-dark">
                        {formatarMesLabel(h.mes)}
                      </p>
                      <p className="text-[11px] text-gray-mid mt-0.5">
                        {h.totalAulas} aulas · {h.totalPresencas} presenças
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-sm font-extrabold text-chumbo"
                        style={{ fontFamily: 'var(--font-montserrat)' }}
                      >
                        {formatBRL(h.totalValor)}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          h.todoPago
                            ? STATUS_STYLE.pago.cls
                            : STATUS_STYLE.pendente.cls
                        }`}
                      >
                        {h.todoPago ? STATUS_STYLE.pago.label : STATUS_STYLE.pendente.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
