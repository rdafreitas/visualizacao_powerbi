// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/home/page.tsx
// Painel inicial do Aluno — aulas da semana, avaliação, progresso.
// ─────────────────────────────────────────────────────────────

import { getProfile } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'

export const metadata = { title: 'Início — PaVoar' }

// Dados demo (substituir por queries Supabase)
const AULAS_SEMANA = [
  { dia: 'SEG', num: '28', nome: '🎀 Tecido Circense',  sub: '09h · Studio A · Camila Rocha',         status: 'presente', statusColor: 'bg-green/15 text-green-dk' },
  { dia: 'QUA', num: '30', nome: '🤸 Acrobacia de Solo', sub: '10h30 · Sala Principal · Diego Mendes', status: 'Hoje',     statusColor: 'bg-purple/10 text-purple'  },
  { dia: 'SEX', num: '01', nome: '🎀 Tecido Circense',  sub: '09h · Studio A · Camila Rocha',         status: 'Em 2 dias',statusColor: 'bg-gray-bg text-gray-mid'  },
]

const DISPONIVEIS = [
  { emoji: '🎀', nome: 'Tecido Circense',   sub: 'Qui · 09h · 4 vagas',   lotada: false },
  { emoji: '🪢', nome: 'Malabares',         sub: 'Sex · 14h · 11 vagas',  lotada: false },
  { emoji: '🤸', nome: 'Acrobacia de Solo', sub: 'Sáb · 10h30 · 6 vagas', lotada: false },
  { emoji: '🎠', nome: 'Contorcionismo',    sub: 'Sáb · 17h · Lotada',    lotada: true  },
]

const METRICAS_PROGRESSO = [
  { valor: '90%', label: 'Presença Jul',    color: 'text-purple'   },
  { valor: '12',  label: 'Habilidades',     color: 'text-orange-dk'},
  { valor: '246', label: 'XP Total',        color: 'text-green-dk' },
  { valor: '4°',  label: 'No ranking',      color: 'text-gray-dark'},
]

export default async function AlunoHomePage() {
  const profile = await getProfile()

  return (
    <>
      <PageHeader
        title={`Bem-vinda, ${profile?.nome?.split(' ')[0] ?? 'aluna'} 🤸`}
        subtitle="Plano Completo · Tecido Circense + Acrobacia de Solo"
      />

      {/* Slot de avaliação (demo) */}
      <div className="mb-6 p-4 rounded-2xl border-[1.5px] border-gold bg-[#FFFAEB]">
        <p className="text-sm font-bold text-gray-dark mb-1">⭐ Avalie sua última aula e ganhe XP</p>
        <p className="text-xs text-gray-mid mb-3">Tecido Circense · 29 jul 2026 · Studio A · Camila Rocha</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className="text-2xl cursor-pointer hover:scale-110 transition-transform select-none">
              {s <= 3 ? '★' : '☆'}
            </span>
          ))}
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-gold text-[#333]">+XP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 mb-5">
        {/* Aulas da semana */}
        <Card>
          <CardTitle>Minhas aulas esta semana</CardTitle>
          <div className="flex flex-col gap-3">
            {AULAS_SEMANA.map((a) => (
              <div key={a.sub} className="flex items-center gap-4 bg-gray-bg rounded-xl p-3.5">
                <div className="text-center flex-shrink-0 w-10">
                  <p className="text-[10px] font-bold text-gray-mid uppercase">{a.dia}</p>
                  <p className="font-poppins text-xl font-extrabold text-gray-dark leading-none">{a.num}</p>
                </div>
                <div className="w-px h-9 bg-black/8 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-dark truncate">{a.nome}</p>
                  <p className="text-xs text-gray-mid mt-0.5 truncate">{a.sub}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${a.statusColor}`}>
                  {a.status === 'presente' ? '✓ Presente' : a.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Meu progresso */}
        <Card>
          <CardTitle>Meu progresso</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            {METRICAS_PROGRESSO.map(({ valor, label, color }) => (
              <div key={label} className="bg-gray-bg rounded-xl p-3.5 text-center">
                <p className={`font-poppins text-2xl font-extrabold ${color}`}>{valor}</p>
                <p className="text-[10px] text-gray-mid mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Aulas disponíveis */}
      <Card>
        <CardTitle>Disponíveis para você</CardTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {DISPONIVEIS.map((d) => (
            <div
              key={d.nome}
              className="border-[1.5px] border-[#E8E8F0] rounded-2xl p-4 flex flex-col gap-3 hover:border-purple/25 hover:shadow-md transition-all"
            >
              <span className="text-3xl">{d.emoji}</span>
              <div>
                <p className="text-sm font-bold text-gray-dark">{d.nome}</p>
                <p className="text-xs text-gray-mid mt-0.5">{d.sub}</p>
              </div>
              <button
                disabled={d.lotada}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                  d.lotada
                    ? 'bg-gray-bg text-gray-mid cursor-not-allowed'
                    : 'bg-purple text-white hover:bg-purple-light'
                }`}
              >
                {d.lotada ? 'Lista de espera' : 'Inscrever-se'}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
