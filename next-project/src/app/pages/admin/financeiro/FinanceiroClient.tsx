'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/financeiro/FinanceiroClient.tsx
//
// Client Component do módulo financeiro.
// Gerencia toda interatividade: abas, seletor de mês, modal de cadastro.
//
// PADRÃO USADO — Server Component passa dados → Client Component usa:
//   AdminFinanceiroPage (async Server Component)
//     └── busca resumo + transações iniciais no servidor
//     └── passa como props:
//         ├── resumo         → KPIs (receita, despesa, lucro)
//         ├── transacoesIniciais → lista do mês atual
//         └── mesInicial     → 'YYYY-MM' para o seletor
//             └── FinanceiroClient (Client Component)
//                 ├── useState para mês selecionado e lista
//                 ├── chama listarTransacoes() ao mudar o mês
//                 └── chama criarTransacao() ao submeter o form
//
// POR QUE AINDA É CLIENT COMPONENT?
//   A tela tem múltiplos estados locais que exigem Client Component:
//   • Abas do gráfico (tabGrafico)
//   • Mês selecionado e loading de troca de mês
//   • Modal de cadastro de transação
//   • Estado do formulário (tipo, categoria, valor, data)
//
// MUDANÇA DE MÊS SEM RECARREGAR A PÁGINA:
//   Quando o usuário muda o mês, chama listarTransacoes() diretamente
//   como Server Action do Client Component. O Next.js executa no servidor
//   e retorna os dados — sem round-trip HTTP visível no DevTools.
// ─────────────────────────────────────────────────────────────

import { useState, useTransition }  from 'react'
import { useRouter }                from 'next/navigation'
import { PageHeader }               from '@/components/layout/PageHeader'
import { Card, CardTitle }          from '@/components/ui/Card'
import { Tabs }                     from '@/components/ui/Tabs'
import { Button }                   from '@/components/ui/Button'
import { Input }                    from '@/components/ui/Input'
import { Modal }                    from '@/components/ui/Modal'
import { Toast }                    from '@/components/ui/Toast'
import { formatBRL, formatBRLCompact } from '@/lib/utils'
import {
  listarTransacoes,
  criarTransacao,
  excluirTransacao,
  type CriarTransacaoInput,
  type ResumoFinanceiro,
} from '@/(auth)/actions/financeiro'
import {
  CATEGORIAS_RECEITA,
  CATEGORIAS_DESPESA,
} from '@/lib/constants'

// ── Tipos ─────────────────────────────────────────────────────

type TipoTransacao   = 'receita' | 'despesa'
type MetodoPagamento = 'pix' | 'cartao' | 'boleto' | 'transferencia' | 'dinheiro'

// Espelha o retorno de listarTransacoes — subset dos campos
interface TransacaoRow {
  id:               string
  tipo:             TipoTransacao
  categoria:        string
  descricao:        string | null
  valor:            number
  metodo_pagamento: MetodoPagamento | null
  data:             string
  mes:              string
}

interface Props {
  resumo:              ResumoFinanceiro
  transacoesIniciais:  TransacaoRow[]
  mesInicial:          string          // formato 'YYYY-MM'
}

// ── Constantes visuais ────────────────────────────────────────

const TABS_GRAFICO = [
  { key: 'receita_despesa', label: 'Receita × Despesa' },
  { key: 'categorias',      label: 'Por Categoria'     },
]

const METODOS_PAGAMENTO: { value: MetodoPagamento; label: string }[] = [
  { value: 'pix',          label: 'PIX'          },
  { value: 'cartao',       label: 'Cartão'       },
  { value: 'boleto',       label: 'Boleto'       },
  { value: 'transferencia',label: 'Transferência'},
  { value: 'dinheiro',     label: 'Dinheiro'     },
]

// Formata 'YYYY-MM' para exibição: '2026-07' → 'Julho 2026'
function formatarMesLabel(mes: string): string {
  const [ano, m] = mes.split('-')
  const data = new Date(Number(ano), Number(m) - 1, 1)
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// Retorna os últimos 12 meses para o seletor
function gerarMeses(): { value: string; label: string }[] {
  const meses = []
  const hoje  = new Date()
  for (let i = 0; i < 12; i++) {
    const d   = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const val = d.toISOString().substring(0, 7)
    meses.push({ value: val, label: formatarMesLabel(val) })
  }
  return meses
}

// ── Sub-componente: barra horizontal ──────────────────────────

function BarraHorizontal({
  label, valor, max, cor, sub,
}: { label: string; valor: number; max: number; cor: string; sub?: string }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-28 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-dark truncate">{label}</p>
        {sub && <p className="text-[10px] text-gray-mid">{sub}</p>}
      </div>
      <div className="flex-1 h-7 bg-gray-bg rounded-xl overflow-hidden relative">
        <div
          className="h-full rounded-xl transition-all duration-500"
          style={{ width: `${pct}%`, background: cor }}
        />
        <span
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold"
          style={{ color: pct > 55 ? '#F4E7CE' : '#211D1C' }}
        >
          {formatBRLCompact(valor)}
        </span>
      </div>
      <span className="text-[10px] text-gray-mid w-8 text-right flex-shrink-0">{pct}%</span>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export function FinanceiroClient({ resumo, transacoesIniciais, mesInicial }: Props) {
  const router = useRouter()

  // ── Estado do mês e lista ────────────────────────────────────
  const [mesSelecionado, setMesSelecionado] = useState(mesInicial)
  // transacoes começa com os dados do servidor e é atualizado
  // localmente quando o usuário muda de mês ou cria/exclui
  const [transacoes,     setTransacoes]     = useState<TransacaoRow[]>(transacoesIniciais as TransacaoRow[])
  const [carregandoMes,  setCarregandoMes]  = useState(false)

  // ── Estado do resumo para atualização após mutações ──────────
  const [resumoLocal, setResumoLocal] = useState(resumo)

  // ── Estado da aba do gráfico ─────────────────────────────────
  const [tabGrafico, setTabGrafico] = useState('receita_despesa')

  // ── Estado do modal de nova transação ────────────────────────
  const [modalAberto, setModalAberto] = useState(false)
  const [tipo,        setTipo]        = useState<TipoTransacao>('receita')
  const [categoria,   setCategoria]   = useState('')
  const [descricao,   setDescricao]   = useState('')
  const [valor,       setValor]       = useState('')
  const [metodo,      setMetodo]      = useState<MetodoPagamento>('pix')
  const [dataInput,   setDataInput]   = useState(new Date().toISOString().split('T')[0])
  const [erroForm,    setErroForm]    = useState('')
  const [salvando,    setSalvando]    = useState(false)

  // ── Toast de feedback ────────────────────────────────────────
  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)

  // isPending para o botão de excluir
  const [isPending, startTransition] = useTransition()

  const meses    = gerarMeses()
  const mesLabel = formatarMesLabel(mesSelecionado)

  // ── KPIs a partir do resumo ──────────────────────────────────
  // Valores vêm do banco via Server Action — não mais hardcoded
  const kpis = [
    {
      icon:     '💰',
      valor:    resumoLocal.receitas,
      label:    `Receitas — ${mesLabel}`,
      corDelta: 'text-chumbo',
    },
    {
      icon:     '📉',
      valor:    resumoLocal.despesas,
      label:    `Despesas — ${mesLabel}`,
      corDelta: 'text-red',
    },
    {
      icon:     '✅',
      valor:    resumoLocal.lucro,
      label:    'Lucro Líquido',
      corDelta: resumoLocal.lucro >= 0 ? 'text-chumbo' : 'text-red',
    },
    {
      icon:     '📋',
      valor:    transacoes.length,
      label:    `Lançamentos — ${mesLabel}`,
      corDelta: 'text-gray-mid',
      isCount:  true,
    },
  ]

  // ── Troca de mês ─────────────────────────────────────────────
  async function handleMudancaMes(novoMes: string) {
    setMesSelecionado(novoMes)
    setCarregandoMes(true)

    // Chama a Server Action diretamente do Client Component.
    // O Next.js roda no servidor — dados financeiros não aparecem
    // como requests visíveis no DevTools do browser.
    const resultado = await listarTransacoes(novoMes)
    if (resultado.ok) {
      setTransacoes(resultado.data as TransacaoRow[])
    }

    setCarregandoMes(false)
  }

  // ── Submeter nova transação ───────────────────────────────────
  async function handleCriarTransacao() {
    setErroForm('')

    const valorNum = parseFloat(valor.replace(',', '.'))
    if (!categoria)       return setErroForm('Selecione uma categoria.')
    if (isNaN(valorNum) || valorNum <= 0) return setErroForm('Valor inválido.')
    if (!dataInput)       return setErroForm('Informe a data.')

    setSalvando(true)

    const input: CriarTransacaoInput = {
      tipo,
      categoria,
      descricao:        descricao.trim() || undefined,
      valor:            valorNum,
      metodo_pagamento: metodo,
      data:             dataInput,
    }

    const resultado = await criarTransacao(input)
    setSalvando(false)

    if (!resultado.ok) {
      setErroForm(resultado.error)
      return
    }

    // Fecha modal e limpa form
    setModalAberto(false)
    setCategoria(''); setDescricao(''); setValor('')
    setErroForm('')

    // Rebusca a lista do mês atual para refletir a nova transação
    const lista = await listarTransacoes(mesSelecionado)
    if (lista.ok) setTransacoes(lista.data as TransacaoRow[])

    // revalidatePath já foi chamado dentro da Server Action.
    // router.refresh() força o layout a rebuscar o resumo atualizado.
    router.refresh()

    setToast('Transação registrada com sucesso.')
    setShowToast(true)
  }

  // ── Excluir transação ─────────────────────────────────────────
  async function handleExcluir(id: string) {
    startTransition(async () => {
      const resultado = await excluirTransacao(id)

      if (!resultado.ok) {
        setToast(resultado.error)
        setShowToast(true)
        return
      }

      // Remove da lista local imediatamente (UX responsiva)
      // antes do router.refresh() atualizar o servidor
      setTransacoes((prev) => prev.filter((t) => t.id !== id))
      router.refresh()

      setToast('Transação excluída.')
      setShowToast(true)
    })
  }

  // ── Categorias do formulário baseadas no tipo ─────────────────
  const categorias = tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  // ── Dados para o gráfico de categorias ───────────────────────
  const receitasPorCat = transacoes
    .filter((t) => t.tipo === 'receita')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] ?? 0) + t.valor
      return acc
    }, {})

  const despesasPorCat = transacoes
    .filter((t) => t.tipo === 'despesa')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] ?? 0) + t.valor
      return acc
    }, {})

  const maxReceita = Math.max(...Object.values(receitasPorCat), 1)
  const maxDespesa = Math.max(...Object.values(despesasPorCat), 1)

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <PageHeader
          title="Financeiro 💰"
          subtitle={`Receitas, despesas e fluxo de caixa — ${mesLabel}`}
          className="mb-0"
        />

        {/* Seletor de mês */}
        <div className="flex items-center gap-2">
          <select
            value={mesSelecionado}
            onChange={(e) => handleMudancaMes(e.target.value)}
            disabled={carregandoMes}
            className="text-sm border border-black/[0.08] rounded-xl px-3 py-2
                       bg-white text-gray-dark outline-none
                       focus:border-orange transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {meses.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <Button onClick={() => setModalAberto(true)} disabled={carregandoMes}>
            + Nova transação
          </Button>
        </div>
      </div>

      {/* KPIs — valores reais do banco */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {kpis.map((k) => (
          <Card key={k.label}>
            <span className="text-3xl block mb-3">{k.icon}</span>
            <p
              className="text-[26px] font-extrabold text-gray-dark leading-none"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {k.isCount ? k.valor : formatBRLCompact(k.valor)}
            </p>
            <p className="text-xs text-gray-mid mt-1">{k.label}</p>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <CardTitle className="mb-0">Análise do período</CardTitle>
          <Tabs
            tabs={TABS_GRAFICO}
            active={tabGrafico}
            onChange={setTabGrafico}
            className="w-auto"
          />
        </div>

        {tabGrafico === 'receita_despesa' && (
          <div className="flex gap-6">
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-3">
                Receitas
              </p>
              {resumoLocal.receitas === 0 ? (
                <p className="text-sm text-gray-mid">Sem receitas no período.</p>
              ) : (
                Object.entries(receitasPorCat)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, val]) => (
                    <BarraHorizontal
                      key={cat} label={cat} valor={val}
                      max={maxReceita} cor="#f27406"
                    />
                  ))
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-3">
                Despesas
              </p>
              {resumoLocal.despesas === 0 ? (
                <p className="text-sm text-gray-mid">Sem despesas no período.</p>
              ) : (
                Object.entries(despesasPorCat)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, val]) => (
                    <BarraHorizontal
                      key={cat} label={cat} valor={val}
                      max={maxDespesa} cor="#C0392B"
                    />
                  ))
              )}
            </div>
          </div>
        )}

        {tabGrafico === 'categorias' && (
          <div className="space-y-1">
            {transacoes.length === 0 ? (
              <p className="text-sm text-gray-mid text-center py-4">
                Sem lançamentos em {mesLabel}.
              </p>
            ) : (
              [...Object.entries(receitasPorCat), ...Object.entries(despesasPorCat)]
                .sort(([, a], [, b]) => b - a)
                .map(([cat, val]) => (
                  <BarraHorizontal
                    key={cat} label={cat} valor={val}
                    max={Math.max(maxReceita, maxDespesa)} cor="#211D1C"
                  />
                ))
            )}
          </div>
        )}
      </Card>

      {/* Lista de transações reais */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="mb-0">
            Lançamentos — {mesLabel}
          </CardTitle>
          {carregandoMes && (
            <span className="text-xs text-gray-mid animate-pulse">
              Carregando…
            </span>
          )}
        </div>

        {transacoes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-mid">
              Nenhuma transação em {mesLabel}.
            </p>
            <p className="text-xs text-gray-mid mt-1">
              Use o botão "+ Nova transação" para cadastrar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-bg">
            {transacoes.map((t) => (
              <div key={t.id} className="flex items-center gap-4 py-3">

                {/* Ícone de tipo */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center
                              text-base flex-shrink-0"
                  style={{
                    background: t.tipo === 'receita'
                      ? 'rgba(242,116,6,.12)'
                      : 'rgba(192,57,43,.10)',
                  }}
                >
                  {t.tipo === 'receita' ? '💰' : '📉'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-dark truncate">
                    {t.categoria}
                  </p>
                  {t.descricao && (
                    <p className="text-xs text-gray-mid truncate">{t.descricao}</p>
                  )}
                  <p className="text-[10px] text-gray-mid mt-0.5">
                    {new Date(t.data).toLocaleDateString('pt-BR')}
                    {t.metodo_pagamento && ` · ${t.metodo_pagamento.toUpperCase()}`}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className="text-sm font-extrabold"
                    style={{
                      fontFamily: 'var(--font-montserrat)',
                      color: t.tipo === 'receita' ? '#c45e00' : '#922b21',
                    }}
                  >
                    {t.tipo === 'receita' ? '+' : '-'}{formatBRL(t.valor)}
                  </p>
                </div>

                {/* Excluir */}
                <button
                  onClick={() => handleExcluir(t.id)}
                  disabled={isPending}
                  className="text-gray-mid hover:text-red transition-colors
                             disabled:opacity-40 ml-1"
                  aria-label={`Excluir lançamento ${t.categoria}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>

              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal de nova transação */}
      <Modal
        open={modalAberto}
        onClose={() => { setModalAberto(false); setErroForm('') }}
        title="Nova transação"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => { setModalAberto(false); setErroForm('') }}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={handleCriarTransacao} loading={salvando}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">

          {/* Tipo: Receita ou Despesa */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
              Tipo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['receita', 'despesa'] as TipoTransacao[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTipo(t); setCategoria('') }}
                  disabled={salvando}
                  className={[
                    'py-2.5 rounded-xl border text-sm font-bold transition-all',
                    'disabled:opacity-50',
                    tipo === t
                      ? t === 'receita'
                        ? 'border-orange bg-orange/10 text-orange-dk'
                        : 'border-red bg-red/8 text-red'
                      : 'border-black/[0.06] text-gray-mid hover:border-black/20',
                  ].join(' ')}
                >
                  {t === 'receita' ? '💰 Receita' : '📉 Despesa'}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
              Categoria
            </p>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              disabled={salvando}
              className="w-full text-sm border border-black/[0.08] rounded-xl px-3 py-3
                         bg-white text-gray-dark outline-none
                         focus:border-orange transition-colors
                         disabled:opacity-50"
            >
              <option value="">Selecione…</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Input
            id="descricao"
            label="Descrição (opcional)"
            placeholder="Ex: Aluguel mês de julho"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            disabled={salvando}
          />

          <Input
            id="valor"
            label="Valor (R$)"
            type="number"
            placeholder="0,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            disabled={salvando}
          />

          {/* Método de pagamento */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
              Método
            </p>
            <div className="flex gap-2 flex-wrap">
              {METODOS_PAGAMENTO.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMetodo(m.value)}
                  disabled={salvando}
                  className={[
                    'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                    'disabled:opacity-50',
                    metodo === m.value
                      ? 'border-chumbo bg-chumbo text-off-white'
                      : 'border-black/[0.06] text-gray-mid hover:border-black/20',
                  ].join(' ')}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            id="data"
            label="Data"
            type="date"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            disabled={salvando}
          />

          {erroForm && (
            <div
              className="px-4 py-3 rounded-xl border text-xs font-semibold"
              style={{
                background:  'rgba(192,57,43,0.06)',
                borderColor: 'rgba(192,57,43,0.25)',
                color:       '#922b21',
              }}
            >
              {erroForm}
            </div>
          )}

        </div>
      </Modal>

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
