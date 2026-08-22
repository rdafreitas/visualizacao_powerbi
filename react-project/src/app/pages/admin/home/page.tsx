import { getProfile } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'

export const metadata = { title: 'Início — PaVoar Admin' }

const METRICS = [
  { icon: '👥', value: '84',      label: 'Alunos Ativos',  delta: '↑ +6 este mês',   color: 'text-green-dk' },
  { icon: '💰', value: 'R$18,2k', label: 'Receita Julho',  delta: '↑ +12% vs junho', color: 'text-green-dk' },
  { icon: '📅', value: '7',       label: 'Aulas Hoje',     delta: '3 restantes',      color: 'text-gray-mid' },
  { icon: '⚠️', value: '5',       label: 'Inadimplentes',  delta: 'Requer atenção',   color: 'text-red'      },
]

const FEED = [
  { icon: '💳', text: 'Pagamento recebido — Mateus Oliveira', sub: 'R$280,00 · PIX · agora' },
  { icon: '🆕', text: 'Nova aluna — Fernanda Lima',           sub: 'Plano Básico · há 2h'   },
  { icon: '⚠️', text: 'Mensalidade em atraso — Rafael Costa', sub: '5 dias · há 3h'          },
  { icon: '📊', text: 'Relatório gerado — Frequência julho',  sub: 'PDF · ontem'              },
]

const QUICK = [
  { icon: '👥', label: 'Alunos',     href: '/pages/admin/alunos'      },
  { icon: '💰', label: 'Financeiro', href: '/pages/admin/financeiro'   },
  { icon: '🎭', label: 'Professores',href: '/pages/admin/professores'  },
  { icon: '📅', label: 'Agenda',     href: '/pages/admin/agenda'       },
]

export default async function AdminHomePage() {
  const profile = await getProfile()

  return (
    <>
      <PageHeader
        title="Visão Geral 👑"
        subtitle={`Bem-vindo, ${profile?.nome ?? ''}. Quarta-feira, 30 de julho de 2026.`}
      />

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {METRICS.map((m) => (
          <Card key={m.label}>
            <span className="text-3xl block mb-3">{m.icon}</span>
            <p className="font-poppins text-[28px] font-extrabold text-gray-dark leading-none">{m.value}</p>
            <p className="text-xs text-gray-mid mt-1">{m.label}</p>
            <p className={`text-xs font-semibold mt-2 ${m.color}`}>{m.delta}</p>
          </Card>
        ))}
      </div>

      {/* Feed + Acesso Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardTitle>Atividade Recente</CardTitle>
          <div className="flex flex-col divide-y divide-gray-bg">
            {FEED.map((f) => (
              <div key={f.text} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-gray-bg flex items-center justify-center text-lg flex-shrink-0">{f.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-dark">{f.text}</p>
                  <p className="text-xs text-gray-mid mt-0.5">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Acesso Rápido</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            {QUICK.map((item) => (
              <a key={item.label} href={item.href}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-bg hover:bg-white hover:border hover:border-purple/15 hover:-translate-y-0.5 transition-all no-underline">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] font-bold text-gray-mid">{item.label}</span>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
