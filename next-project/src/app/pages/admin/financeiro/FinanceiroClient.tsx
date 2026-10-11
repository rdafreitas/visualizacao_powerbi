'use client'
// ─────────────────────────────────────────────────────────────
// FinanceiroClient — Client Component
// Contém toda a lógica interativa (useState para as abas do gráfico).
// Separado do page.tsx para que o Server Component possa exportar
// o metadata sem conflito com o 'use client'.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { PageHeader }      from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Tabs }            from '@/components/ui/Tabs'
import { formatBRL, formatBRLCompact } from '@/lib/utils'

// ── Dados demo ────────────────────────────────────────────────

const KPIS = [
  { icon: '💰', valor: 18240, label: 'Receita Julho',  delta: '↑ +12% vs junho',  corDelta: 'text-chumbo' },
  { icon: '📉', valor: 3520,  label: 'Despesas Julho', delta: '↑ +10% vs junho',  corDelta: 'text-red'    },
  { icon: '✅', valor: 14720, label: 'Lucro Líquido',  delta: '↑ +13% vs junho',  corDelta: 'text-chumbo' },
  { icon: '⚠️', valor: 1400,  label: 'Em Aberto (5)',  delta: '5 inadimplentes',  corDelta: 'text-red'    },
]

const HISTORICO = [
  { mes: 'Fev', receita: 14250, despesa: 2880 },
  { mes: 'Mar', receita: 14680, despesa: 2940 },
  { mes: 'Abr', receita: 14380, despesa: 2860 },
  { mes: 'Mai', receita: 15100, despesa: 3000 },
  { mes: 'Jun', receita: 16300, despesa: 3180 },
  { mes: 'Jul', receita: 18240, despesa: 3520 },
]

const RECEITA_PLANOS = [
  { nome: 'Premium',  alunos: 5,  valor: 2400, cor: '#7A1D2C' },
  { nome: 'Completo', alunos: 28, valor: 7840, cor: '#f27406' },
  { nome: 'Básico',   alunos: 51, valor: 8000, cor: '#BAD0D9' },
]

const FOLHA = [
  { nome: 'Camila Rocha', aulas: 14, valor: 2800 },
  { nome: 'Diego Mendes', aulas: 14, valor: 2400 },
  { nome: 'Lara Vaz',     aulas: 12, valor: 1800 },
  { nome: 'Ana Lima',     aulas: 10, valor: 1400 },
]

const DESPESAS_FIXAS = [
  { item: 'Aluguel Studio A',    valor: 2200 },
  { item: 'Aluguel Studio B',    valor: 1800 },
  { item: 'Energia elétrica',    valor: 620  },
  { item: 'Internet + telefone', valor: 280  },
  { item: 'Plataforma digital',  valor: 180  },
  { item: 'Contabilidade',       valor: 440  },
]

const TABS_GRAFICO = [
  { key: 'receita_despesa', label: 'Receita × Despesa' },
  { key: 'planos',          label: 'Por Plano'          },
  { key: 'folha',           label: 'Folha'              },
]

// ── Sub-componentes internos ──────────────────────────────────

function BarraHorizontal({
  label, valor, max, cor, sub,
}: { label: string; valor: number; max: number; cor: string; sub?: string }) {
  const pct = Math.round((valor / max) * 100)
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-24 flex-shrink-0">
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

function GraficoReceitaDespesa() {
  const maxVal = Math.max(...HISTORICO.map((h) => h.receita))
  return (
    <div className="flex items-end gap-3 h-48 pt-4">
      {HISTORICO.map((h, i) => {
        const pctR     = (h.receita / maxVal) * 100
        const pctD     = (h.despesa / maxVal) * 100
        const isUltimo = i === HISTORICO.length - 1
        return (
          <div key={h.mes} className="flex-1 flex flex-col items-center gap-1">
            {isUltimo && (
              <p className="text-[9px] font-bold text-orange-dk mb-1">
                {formatBRLCompact(h.receita)}
              </p>
            )}
            <div className="w-full flex items-end gap-0.5" style={{ height: '160px' }}>
              <div
                className="flex-1 rounded-t-lg transition-all duration-500"
                style={{
                  height:     `${pctR}%`,
                  background: isUltimo
                    ? 'linear-gradient(180deg,#f27406,#c45e00)'
                    : 'rgba(242,116,6,.25)',
                }}
                title={`Receita: ${formatBRL(h.receita)}`}
              />
              <div
                className="flex-1 rounded-t-lg transition-all duration-500"
                style={{
                  height:     `${pctD}%`,
                  background: isUltimo
                    ? 'linear-gradient(180deg,#C0392B,#922b21)'
                    : 'rgba(192,57,43,.18)',
                }}
                title={`Despesa: ${formatBRL(h.despesa)}`}
              />
            </div>
            <p className={`text-[10px] font-bold ${isUltimo ? 'text-orange-dk' : 'text-gray-mid'}`}>
              {h.mes}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ── Componente principal exportado ────────────────────────────

export function FinanceiroClient() {
  const [tabGrafico, setTabGrafico] = useState('receita_despesa')

  const totalFolha = FOLHA.reduce((s, f) => s + f.valor, 0)
  const totalFixas = DESPESAS_FIXAS.reduce((s, d) => s + d.valor, 0)
  const maxPlano   = Math.max(...RECEITA_PLANOS.map((p) => p.valor))
  const maxFolha   = Math.max(...FOLHA.map((f) => f.valor))

  return (
    <>
      <PageHeader
        title="Financeiro 💰"
        subtitle="Receitas, despesas e folha de pagamento — Julho 2026."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {KPIS.map((k) => (
          <Card key={k.label}>
            <span className="text-3xl block mb-3">{k.icon}</span>
            <p className="text-[26px] font-extrabold text-gray-dark leading-none"
              style={{ fontFamily: 'var(--font-montserrat)' }}>
              {formatBRLCompact(k.valor)}
            </p>
            <p className="text-xs text-gray-mid mt-1">{k.label}</p>
            <p className={`text-xs font-semibold mt-2 ${k.corDelta}`}>{k.delta}</p>
          </Card>
        ))}
      </div>

      {/* Gráfico com abas */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <CardTitle className="mb-0">Histórico 6 meses</CardTitle>
          <Tabs tabs={TABS_GRAFICO} active={tabGrafico} onChange={setTabGrafico} className="w-auto" />
        </div>

        {tabGrafico === 'receita_despesa' && (
          <>
            <div className="flex gap-5 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-orange" />
                <span className="text-xs text-gray-mid">Receita</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red" />
                <span className="text-xs text-gray-mid">Despesa</span>
              </div>
            </div>
            <GraficoReceitaDespesa />
          </>
        )}

        {tabGrafico === 'planos' && (
          <div className="flex flex-col gap-1 mt-2">
            {RECEITA_PLANOS.map((p) => (
              <BarraHorizontal key={p.nome} label={p.nome} valor={p.valor}
                max={maxPlano} cor={p.cor} sub={`${p.alunos} alunos`} />
            ))}
            <p className="text-[10px] text-gray-mid mt-3 pt-3 border-t border-gray-bg">
              Total receita contratos: {formatBRL(RECEITA_PLANOS.reduce((s, p) => s + p.valor, 0))}
            </p>
          </div>
        )}

        {tabGrafico === 'folha' && (
          <div className="flex flex-col gap-1 mt-2">
            {FOLHA.map((f) => (
              <BarraHorizontal key={f.nome} label={f.nome} valor={f.valor}
                max={maxFolha} cor="#211D1C" sub={`${f.aulas} aulas`} />
            ))}
            <p className="text-[10px] text-gray-mid mt-3 pt-3 border-t border-gray-bg">
              Total folha: {formatBRL(totalFolha)}
            </p>
          </div>
        )}
      </Card>

      {/* Receita por plano + Despesas fixas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <CardTitle>Receita por plano</CardTitle>
          <div className="flex flex-col divide-y divide-gray-bg">
            {RECEITA_PLANOS.map((p) => (
              <div key={p.nome} className="flex items-center gap-3 py-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.cor }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-dark">{p.nome}</p>
                  <p className="text-xs text-gray-mid">{p.alunos} alunos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-gray-dark"
                    style={{ fontFamily: 'var(--font-montserrat)' }}>{formatBRL(p.valor)}</p>
                  <p className="text-[10px] text-gray-mid">
                    {formatBRL(Math.round(p.valor / p.alunos))}/aluno
                  </p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3">
              <p className="text-sm font-bold text-gray-dark">Total</p>
              <p className="text-base font-extrabold text-bordo"
                style={{ fontFamily: 'var(--font-montserrat)' }}>
                {formatBRL(RECEITA_PLANOS.reduce((s, p) => s + p.valor, 0))}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Despesas fixas</CardTitle>
          <div className="flex flex-col divide-y divide-gray-bg">
            {DESPESAS_FIXAS.map((d) => (
              <div key={d.item} className="flex justify-between items-center py-2.5">
                <p className="text-sm text-gray-dark">{d.item}</p>
                <p className="text-sm font-semibold text-gray-dark">{formatBRL(d.valor)}</p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3">
              <p className="text-sm font-bold text-gray-dark">Total fixas</p>
              <p className="text-base font-extrabold text-red"
                style={{ fontFamily: 'var(--font-montserrat)' }}>{formatBRL(totalFixas)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Folha de professores */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="mb-0">Folha de professores — Julho 2026</CardTitle>
          <span className="text-sm font-extrabold text-gray-dark"
            style={{ fontFamily: 'var(--font-montserrat)' }}>
            Total: {formatBRL(totalFolha)}
          </span>
        </div>
        <div className="flex flex-col divide-y divide-gray-bg">
          {FOLHA.map((f) => (
            <div key={f.nome} className="flex items-center gap-4 py-3">
              <div
                className="w-8 h-8 rounded-full bg-gray-bg flex items-center justify-center text-xs font-bold text-gray-dark flex-shrink-0"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {f.nome.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-dark">{f.nome}</p>
                <p className="text-xs text-gray-mid">{f.aulas} aulas ministradas</p>
              </div>
              <div className="text-right">
                <p className="text-base font-extrabold text-chumbo"
                  style={{ fontFamily: 'var(--font-montserrat)' }}>{formatBRL(f.valor)}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange/10 text-orange-dk">
                  Pendente
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
