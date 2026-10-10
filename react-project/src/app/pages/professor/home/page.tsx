// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/home/page.tsx
// Painel inicial do Professor — avisos, métricas e check-ins.
// ─────────────────────────────────────────────────────────────

import { getProfile } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'

export const metadata = { title: 'Início — Professor PaVoar' }

// Dados demo (substituir por queries Supabase)
const METRICAS = [
  { icon: '📅', value: '3',  label: 'Aulas Hoje',        delta: 'Próxima: 10h30',    color: 'text-gray-mid'  },
  { icon: '🤸', value: '18', label: 'Alunos Esperados',   delta: '↑ 2 novos',         color: 'text-green-dk'  },
  { icon: '🔔', value: '5',  label: 'Avisos',             delta: 'Verificar abaixo',  color: 'text-orange-dk' },
  { icon: '✅', value: '4',  label: 'Check-ins Hoje',     delta: 'de 18 esperados',   color: 'text-gray-mid'  },
]

const AVISOS = [
  { tipo: 'verde',    icon: '💵', titulo: 'Pagamento recebido',          corpo: 'Salário de Julho/2026 disponível para visualização.' },
  { tipo: 'laranja',  icon: '🏋️', titulo: 'Acrobacia de Solo — 10h30',  corpo: 'Treino não definido. A aula começa em menos de 48h.',   badge: 'Treino'          },
  { tipo: 'laranja',  icon: '🏋️', titulo: 'Acrobacia Avançada — 15h',   corpo: 'Treino não definido. A aula começa em menos de 48h.',   badge: 'Treino'          },
  { tipo: 'vermelho', icon: '🚨', titulo: 'Queda de energia no studio.', corpo: undefined,                                               badge: 'Aula / Cancelada' },
  { tipo: 'saude',    icon: '🩺', titulo: 'Acrobacia · Clara Santos',    corpo: 'Tendinite no ombro direito.'                           },
  { tipo: 'trial',    icon: '🎟️', titulo: 'Acrobacia · Fernanda Lima',   corpo: undefined,                                               badge: 'Trial'            },
]

const CHECKINS = [
  { nome: 'Clara Santos',    aula: 'Acrobacia de Solo', horario: '30 jul · 10h30' },
  { nome: 'Mateus Oliveira', aula: 'Acrobacia de Solo', horario: '30 jul · 10h30' },
  { nome: 'Paulo Rezende',   aula: 'Condicionamento',   horario: '28 jul · 14h'   },
  { nome: 'Beatriz Andrade', aula: 'Condicionamento',   horario: '28 jul · 14h'   },
]

const AVISO_STYLE: Record<string, string> = {
  verde:    'bg-[#EDFCF6] border-l-4 border-[#06D6A0]',
  laranja:  'bg-[#FFF4EE] border-l-4 border-[#FF6B35]',
  vermelho: 'bg-[#FEF0F4] border-l-4 border-[#EF476F]',
  saude:    'bg-[#FFF5F5] border-l-4 border-[#FFB3C1]',
  trial:    'bg-[#FFFAEB] border-l-4 border-[#FFD166]',
}

const BADGE_STYLE: Record<string, string> = {
  Treino:           'bg-orange-dk text-white',
  'Aula / Cancelada': 'bg-red text-white',
  Trial:            'bg-gold text-[#333]',
}

export default async function ProfessorHomePage() {
  const profile = await getProfile()

  return (
    <>
      <PageHeader
        title={`Painel do Professor 🎭`}
        subtitle={`Bem-vindo, ${profile?.nome ?? ''}. Quarta-feira, 30 de julho de 2026.`}
      />

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {METRICAS.map((m) => (
          <Card key={m.label}>
            <span className="text-3xl block mb-3">{m.icon}</span>
            <p className="font-poppins text-[28px] font-extrabold text-gray-dark leading-none">{m.value}</p>
            <p className="text-xs text-gray-mid mt-1">{m.label}</p>
            <p className={`text-xs font-semibold mt-2 ${m.color}`}>{m.delta}</p>
          </Card>
        ))}
      </div>

      {/* Avisos + Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        {/* Avisos */}
        <Card>
          <CardTitle>Avisos Importantes</CardTitle>
          <div className="flex flex-col gap-2.5">
            {AVISOS.map((a, i) => (
              <div key={i} className={`rounded-xl p-3 flex items-start gap-3 ${AVISO_STYLE[a.tipo]}`}>
                <span className="text-lg flex-shrink-0 mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-dark">{a.titulo}</p>
                  {a.corpo && <p className="text-xs text-gray-mid mt-0.5 leading-relaxed">{a.corpo}</p>}
                </div>
                {a.badge && (
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${BADGE_STYLE[a.badge] ?? 'bg-gray-bg text-gray-mid'}`}>
                    {a.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Check-ins */}
        <Card>
          <CardTitle>Check-ins da Semana</CardTitle>
          <div className="flex flex-col divide-y divide-gray-bg">
            {CHECKINS.map((c) => (
              <div key={c.nome} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-8 h-8 rounded-lg bg-[#EDFCF6] flex items-center justify-center text-sm flex-shrink-0">✅</div>
                <div>
                  <p className="text-sm font-semibold text-gray-dark">{c.nome}</p>
                  <p className="text-xs text-gray-mid mt-0.5">{c.aula} · {c.horario}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
