import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'

export const metadata = { title: 'Pagamentos — PaVoar' }

const PLANOS = [
  { nome: '🎟️ Plano Básico',    valor: 180, detalhe: '1 modalidade · Fidelidade 3 meses',  destaque: false },
  { nome: '⭐ Plano Completo',   valor: 280, detalhe: 'Até 2 modalidades · Sem fidelidade',  destaque: true  },
  { nome: '💎 Plano Premium',    valor: 480, detalhe: 'Todas as modalidades · Sem fidelidade', destaque: false },
]

const HISTORICO = [
  { plano: 'Plano Completo', mes: 'Julho 2026',  data: '01 jul 2026', metodo: '💳 Cartão', valor: 280 },
  { plano: 'Plano Completo', mes: 'Junho 2026',  data: '01 jun 2026', metodo: '💳 Cartão', valor: 280 },
  { plano: 'Plano Completo', mes: 'Maio 2026',   data: '02 mai 2026', metodo: '📱 PIX',    valor: 280 },
]

export default async function AlunoPagamentosPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'aluno') redirect('/pages/login')

  // Demo: Clara tem contrato ativo. Trocar para false para ver estado "sem contrato".
  const temContrato = true

  if (!temContrato) {
    return (
      <>
        <PageHeader title="Planos & Pagamentos" subtitle="Escolha o plano ideal para o seu ritmo." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANOS.map((p) => (
            <div
              key={p.nome}
              className={`relative bg-white rounded-2xl p-6 flex flex-col gap-4 border-2 transition-all hover:-translate-y-1 hover:shadow-lg ${
                p.destaque ? 'border-purple shadow-md' : 'border-[#E8E8F0]'
              }`}
            >
              {p.destaque && (
                <span className="absolute -top-px right-5 bg-orange-dk text-white text-[9px] font-extrabold px-3 py-0.5 rounded-b-xl tracking-wide">
                  MAIS POPULAR
                </span>
              )}
              <p className="font-poppins text-base font-extrabold text-gray-dark">{p.nome}</p>
              <p className="font-poppins text-4xl font-extrabold text-purple leading-none">
                R$ {p.valor}<span className="text-sm font-medium text-gray-mid">/mês</span>
              </p>
              <p className="text-sm text-gray-mid">{p.detalhe}</p>
              <button className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                p.destaque
                  ? 'bg-orange-dk text-white hover:opacity-90'
                  : 'bg-purple text-white hover:bg-purple-light'
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
        style={{ background: 'linear-gradient(135deg, #2D1B69, #3D2A85)' }}
      >
        <div>
          <p className="text-xs text-white/55 font-semibold uppercase tracking-wider mb-1">⭐ Plano Completo</p>
          <p className="font-poppins text-xl font-extrabold text-white">Tecido Circense · Acrobacia de Solo</p>
          <p className="text-xs text-white/50 mt-1">Vigência: 01 jul – 31 ago 2026</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">Próximo pagamento</p>
          <p className="font-poppins text-xl font-extrabold text-gold">30 ago 2026</p>
          <p className="text-sm text-white/60 mt-0.5">R$ 280,00</p>
        </div>
      </div>

      {/* Forma de pagamento */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="mb-0">Forma de pagamento</CardTitle>
          <button className="text-xs font-semibold text-gray-mid border border-[#E8E8F0] px-3 py-1.5 rounded-xl hover:border-purple hover:text-purple transition-colors">
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
              <p className="font-poppins font-extrabold text-green-dk">R$ {h.valor}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
