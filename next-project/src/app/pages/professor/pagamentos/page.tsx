// ─────────────────────────────────────────────────────────────
// professor/pagamentos/page.tsx — Server Component
// Extrato de remuneração por aula. Sem useState, sem 'use client'.
// Dados demo hardcoded. Sem Supabase, sem role, sem permissions.
// ─────────────────────────────────────────────────────────────

import { PageHeader }      from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { formatBRL }       from '@/lib/utils'

export const metadata = { title: 'Pagamentos — Professor Andorin' }

// ── Dados demo ────────────────────────────────────────────────

const RESUMO_MES = {
  mes:         'Julho 2026',
  aulas:       14,
  presencas:   98,
  valorBruto:  2800,
  status:      'pendente' as const,
  previsaoPag: '05 ago 2026',
}

const DETALHE_AULAS = [
  { data: '30 jul', aula: '🎀 Tecido Circense',    horario: '09h00', presencas: 8,  valor: 200 },
  { data: '30 jul', aula: '💪 Condicionamento',    horario: '17h00', presencas: 6,  valor: 200 },
  { data: '28 jul', aula: '🎀 Tecido Circense',    horario: '09h00', presencas: 9,  valor: 200 },
  { data: '28 jul', aula: '💪 Condicionamento',    horario: '17h00', presencas: 5,  valor: 150 },
  { data: '25 jul', aula: '🎀 Tecido Circense',    horario: '09h00', presencas: 7,  valor: 200 },
  { data: '25 jul', aula: '🤸 Acrobacia de Solo',  horario: '10h30', presencas: 6,  valor: 200 },
  { data: '23 jul', aula: '💪 Condicionamento',    horario: '17h00', presencas: 4,  valor: 150 },
  { data: '23 jul', aula: '🎀 Tecido Circense',    horario: '09h00', presencas: 8,  valor: 200 },
  { data: '21 jul', aula: '🤸 Acrobacia de Solo',  horario: '10h30', presencas: 7,  valor: 200 },
  { data: '18 jul', aula: '🎀 Tecido Circense',    horario: '09h00', presencas: 9,  valor: 200 },
  { data: '18 jul', aula: '💪 Condicionamento',    horario: '17h00', presencas: 6,  valor: 200 },
  { data: '16 jul', aula: '🤸 Acrobacia de Solo',  horario: '10h30', presencas: 5,  valor: 150 },
  { data: '14 jul', aula: '🎀 Tecido Circense',    horario: '09h00', presencas: 8,  valor: 200 },
  { data: '11 jul', aula: '💪 Condicionamento',    horario: '17h00', presencas: 7,  valor: 200 },
]

const HISTORICO = [
  { mes: 'Junho 2026', aulas: 12, presencas: 84, valor: 2400, status: 'pago'    as const },
  { mes: 'Maio 2026',  aulas: 13, presencas: 91, valor: 2600, status: 'pago'    as const },
  { mes: 'Abril 2026', aulas: 11, presencas: 77, valor: 2200, status: 'pago'    as const },
  { mes: 'Mar 2026',   aulas: 10, presencas: 70, valor: 2050, status: 'pago'    as const },
]

// ── Helpers de exibição ───────────────────────────────────────

const STATUS_STYLE = {
  pago:     { label: '✓ Pago',     cls: 'bg-green-light/40 text-chumbo' },
  pendente: { label: '⏳ Pendente', cls: 'bg-orange/15 text-orange-dk'   },
}

export default function ProfessorPagamentosPage() {
  const totalAulas200 = DETALHE_AULAS.filter((a) => a.valor === 200).length
  const totalAulas150 = DETALHE_AULAS.filter((a) => a.valor === 150).length

  return (
    <>
      <PageHeader
        title="Pagamentos 💵"
        subtitle="Extrato de remuneração por aula ministrada."
      />

      {/* Hero do mês atual */}
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
            {RESUMO_MES.mes}
          </p>
          <div className="flex gap-5 mt-3 flex-wrap">
            {[
              { icon: '📅', val: `${RESUMO_MES.aulas} aulas`      },
              { icon: '👥', val: `${RESUMO_MES.presencas} presenças` },
            ].map(({ icon, val }) => (
              <div key={val} className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <p className="text-sm font-semibold text-white">{val}</p>
              </div>
            ))}
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
            {formatBRL(RESUMO_MES.valorBruto)}
          </p>
          <div className="flex items-center gap-2 mt-2 justify-end">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[RESUMO_MES.status].cls}`}>
              {STATUS_STYLE[RESUMO_MES.status].label}
            </span>
            <p className="text-xs" style={{ color: 'rgba(244,231,206,.45)' }}>
              Previsão: {RESUMO_MES.previsaoPag}
            </p>
          </div>
        </div>
      </div>

      {/* Detalhamento + Histórico lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 mb-5">

        {/* Tabela de aulas */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-bg flex items-center justify-between">
            <CardTitle className="mb-0">Detalhamento por aula</CardTitle>
            <span className="text-xs text-gray-mid">{DETALHE_AULAS.length} aulas</span>
          </div>

          <div className="divide-y divide-gray-bg max-h-[480px] overflow-y-auto scrollbar-none">
            {DETALHE_AULAS.map((a, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                {/* Data */}
                <div className="flex-shrink-0 w-14">
                  <p className="text-xs font-bold text-gray-dark">{a.data.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-mid">{a.data.split(' ')[1]}</p>
                </div>

                <div className="w-px h-8 bg-black/6 flex-shrink-0" />

                {/* Aula + horário */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-dark truncate">{a.aula}</p>
                  <p className="text-[11px] text-gray-mid mt-0.5">
                    {a.horario} · {a.presencas} aluno{a.presencas !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Valor + badge */}
                <div className="text-right flex-shrink-0">
                  <p
                    className="text-sm font-extrabold text-chumbo"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {formatBRL(a.valor)}
                  </p>
                  {a.valor === 150 && (
                    <span className="text-[9px] font-bold text-gray-mid">{'< 3 pres.'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé com total */}
          <div className="px-6 py-4 border-t border-gray-bg bg-gray-bg/40 flex justify-between items-center">
            <p className="text-xs text-gray-mid">
              {totalAulas200}× R$200 · {totalAulas150}× R$150
            </p>
            <p
              className="text-base font-extrabold text-chumbo"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {formatBRL(RESUMO_MES.valorBruto)}
            </p>
          </div>
        </Card>

        {/* Coluna direita: regra + histórico */}
        <div className="flex flex-col gap-5">

          {/* Regra de remuneração */}
          <Card>
            <CardTitle>Como é calculado</CardTitle>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-bg">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-extrabold text-off-white flex-shrink-0"
                  style={{ background: '#f27406', fontFamily: 'var(--font-montserrat)' }}
                >
                  R$200
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-dark">3 ou mais presenças</p>
                  <p className="text-xs text-gray-mid mt-0.5">Valor cheio por aula ministrada</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-bg">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-extrabold text-off-white flex-shrink-0"
                  style={{ background: '#8a7d70', fontFamily: 'var(--font-montserrat)' }}
                >
                  R$150
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-dark">Menos de 3 presenças</p>
                  <p className="text-xs text-gray-mid mt-0.5">Valor reduzido por baixa adesão</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-mid pt-1 border-t border-gray-bg">
                O pagamento é processado até o dia 5 do mês seguinte via transferência bancária.
              </p>
            </div>
          </Card>

          {/* Histórico de meses anteriores */}
          <Card padding="none">
            <div className="px-5 py-4 border-b border-gray-bg">
              <CardTitle className="mb-0">Histórico</CardTitle>
            </div>
            <div className="divide-y divide-gray-bg">
              {HISTORICO.map((h) => (
                <div key={h.mes} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-dark">{h.mes}</p>
                    <p className="text-[11px] text-gray-mid mt-0.5">
                      {h.aulas} aulas · {h.presencas} presenças
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-sm font-extrabold text-chumbo"
                      style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                      {formatBRL(h.valor)}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[h.status].cls}`}>
                      {STATUS_STYLE[h.status].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </>
  )
}
