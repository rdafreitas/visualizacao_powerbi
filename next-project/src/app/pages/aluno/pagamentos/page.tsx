import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'

export const metadata = { title: 'Pagamentos — Andorin' }

const PLANOS = [
  { nome: '🎟️ Plano Básico',  valor: 180, detalhe: '1 modalidade · Fidelidade 3 meses',    destaque: false },
  { nome: '⭐ Plano Completo', valor: 280, detalhe: 'Até 2 modalidades · Sem fidelidade',    destaque: true  },
  { nome: '💎 Plano Premium',  valor: 480, detalhe: 'Todas as modalidades · Sem fidelidade', destaque: false },
]

const HISTORICO = [
  { plano: 'Plano Completo', mes: 'Julho 2026', data: '01 jul 2026', metodo: '💳 Cartão', valor: 280 },
  { plano: 'Plano Completo', mes: 'Junho 2026', data: '01 jun 2026', metodo: '💳 Cartão', valor: 280 },
  { plano: 'Plano Completo', mes: 'Maio 2026',  data: '02 mai 2026', metodo: '📱 PIX',    valor: 280 },
]

// Demo: true = aluna com contrato, false = sem contrato (ver tela de planos)
const temContrato = true

export default function AlunoPagamentosPage() {
  if (!temContrato) {
    return (
      <>
        <PageHeader title="Planos & Pagamentos" subtitle="Escolha o plano ideal para o seu ritmo." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANOS.map((p) => (
            <div
              key={p.nome}
              className={`relative bg-white rounded-2xl p-6 flex flex-col gap-4 border-2 transition-all hover:-translate-y-1 hover:shadow-lg ${
                p.destaque ? 'border-bordo shadow-md' : 'border-black/[0.06]'
              }`}
            >
              {p.destaque && (
                <span className="absolute -top-px right-5 bg-orange text-off-white text-[9px] font-extrabold px-3 py-0.5 rounded-b-xl tracking-wide">
                  MAIS POPULAR
                </span>
              )}
              <p className="text-base font-extrabold text-gray-dark"
                style={{ fontFamily: 'var(--font-montserrat)' }}>{p.nome}</p>
              <p className="text-4xl font-extrabold text-bordo leading-none"
                style={{ fontFamily: 'var(--font-montserrat)' }}>
                R$ {p.valor}<span className="text-sm font-medium text-gray-mid">/mês</span>
              </p>
              <p className="text-sm text-gray-mid">{p.detalhe}</p>
              <button className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                p.destaque ? 'bg-orange text-off-white hover:opacity-90' : 'bg-bordo text-off-white hover:bg-bordo-dk'
              }`}>
                Contratar
              </button>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Planos & Pagamentos" subtitle="Gerencie seu plano e histórico." />

      {/* Hero plano ativo */}
      <div
        className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-5 flex-wrap"
        style={{ background: 'linear-gradient(135deg, #211D1C, #7A1D2C)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(244,231,206,.55)' }}>
            ⭐ Plano Completo
          </p>
          <p className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Tecido Circense · Acrobacia de Solo
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(244,231,206,.5)' }}>Vigência: 01 jul – 31 ago 2026</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(244,231,206,.5)' }}>
            Próximo pagamento
          </p>
          <p className="text-xl font-extrabold text-orange" style={{ fontFamily: 'var(--font-montserrat)' }}>30 ago 2026</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(244,231,206,.6)' }}>R$ 280,00</p>
        </div>
      </div>

      {/* Forma de pagamento */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="mb-0">Forma de pagamento</CardTitle>
          <button className="text-xs font-semibold text-gray-mid border border-black/[0.06] px-3 py-1.5 rounded-xl hover:border-bordo hover:text-bordo transition-colors">
            Trocar
          </button>
        </div>
        <div className="flex items-center gap-4 bg-gray-bg rounded-xl p-4">
          <span className="text-3xl">💳</span>
          <div>
            <p className="text-sm font-bold text-gray-dark">•••• •••• •••• 4892</p>
            <p className="text-xs text-gray-mid mt-0.5">Visa · Cobrança automática todo dia 30</p>
          </div>
        </div>
      </Card>

      {/* Histórico */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-bg">
          <CardTitle className="mb-0">Histórico de pagamentos</CardTitle>
        </div>
        <div className="divide-y divide-gray-bg">
          {HISTORICO.map((h, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-dark">{h.plano} — {h.mes}</p>
                <p className="text-xs text-gray-mid mt-0.5">Debitado em {h.data} · {h.metodo}</p>
              </div>
              <p className="font-extrabold text-chumbo" style={{ fontFamily: 'var(--font-montserrat)' }}>
                R$ {h.valor}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
