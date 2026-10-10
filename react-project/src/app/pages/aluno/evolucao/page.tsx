// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/evolucao/page.tsx
// Tela de Evolução — XP, níveis, habilidades e ranking.
// ─────────────────────────────────────────────────────────────

import { getProfile } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'

export const metadata = { title: 'Evolução — PaVoar' }

const NIVEIS = [
  { emoji: '🌱', nome: 'Aprendiz',     xp: '0–99',     nivel: 1, atual: false },
  { emoji: '⚡', nome: 'Iniciante',    xp: '100–199',  nivel: 2, atual: false },
  { emoji: '🥋', nome: 'Intermediário',xp: '200–349',  nivel: 3, atual: true  },
  { emoji: '🔥', nome: 'Avançado',     xp: '350–499',  nivel: 4, atual: false },
  { emoji: '🏆', nome: 'Mestre',       xp: '500+',     nivel: 5, atual: false },
]

const HABILIDADES_TOP = [
  { emoji: '🎀', nome: 'Casulo básico',     modal: 'Tecido Circense',  nivel: 3, nova: false },
  { emoji: '🤸', nome: 'Rolamento frontal', modal: 'Acrobacia',        nivel: 3, nova: false },
  { emoji: '💪', nome: 'Prancha 60s',       modal: 'Condicionamento',  nivel: 3, nova: false },
]

const HABILIDADES_NOVAS = [
  { emoji: '✨', nome: 'Escorpião',               modal: 'Acrobacia', nivel: 1, nova: true  },
  { emoji: '🤸', nome: 'Roda',                    modal: 'Acrobacia', nivel: 1, nova: false },
  { emoji: '🤸', nome: 'Parada de mão assistida', modal: 'Acrobacia', nivel: 1, nova: false },
]

const HISTORICO = [
  { emoji: '🎀', nome: 'Tecido Circense',  data: '29 jul · 09h00', presente: true,  habs: ['Arabesque','Casulo','Escorpião'] },
  { emoji: '🤸', nome: 'Acrobacia',        data: '28 jul · 10h30', presente: true,  habs: ['Roda','Rolamento','Prancha']    },
  { emoji: '🎀', nome: 'Tecido Circense',  data: '26 jul · 09h00', presente: false, habs: []                                },
  { emoji: '🤸', nome: 'Acrobacia',        data: '25 jul · 10h30', presente: true,  habs: ['Bananeira','Parada de mão']    },
]

function NivelDots({ nivel, max = 5 }: { nivel: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < nivel ? 'bg-purple' : 'bg-[#E0E0ED]'}`}
        />
      ))}
    </div>
  )
}

export default async function AlunoEvolucaoPage() {
  const profile = await getProfile()
  const xpTotal = 246
  const xpProx  = 350
  const pct     = Math.round((xpTotal / xpProx) * 100)

  return (
    <>
      <PageHeader title="Minha Evolução" subtitle="Acompanhe seu progresso, habilidades e ranking." />

      {/* Widget XP */}
      <div
        className="rounded-2xl p-7 mb-6 flex flex-wrap gap-8 items-start relative"
        style={{ background: 'linear-gradient(135deg, #1A1A2E, #2D1B69, #3D2A85)' }}
      >
        {/* Nível */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-5xl" style={{ filter: 'drop-shadow(0 4px 16px rgba(255,107,53,.4))' }}>🥋</span>
          <div>
            <p className="font-poppins text-xl font-extrabold text-white">Nível 3 · Intermediário</p>
            <p className="text-xs text-white/50 mt-1">Trimestre Jul–Set 2026</p>
          </div>
        </div>

        {/* XP e barra */}
        <div className="flex-1 min-w-[200px]">
          <p className="font-poppins text-4xl font-extrabold text-gold leading-none mb-3">{xpTotal} XP</p>
          <div className="h-2.5 rounded-full bg-white/15 overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #FF6B35, #FFD166)',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/40 font-semibold">
            <span>🥋 Nível 3 · 200 XP</span>
            <span>🔥 Nível 4 · 350 XP</span>
          </div>
          {/* Fatores */}
          <div className="flex gap-5 mt-4 flex-wrap">
            {[
              { icon: '📅', val: '18 aulas',    pts: '× 10 = 180 pts' },
              { icon: '✅', val: '90% presença', pts: '× 0,5 = 45 pts' },
              { icon: '⭐', val: 'Média 4,2',    pts: '× 5 = 21 pts'  },
            ].map(({ icon, val, pts }) => (
              <div key={val} className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <div>
                  <p className="text-xs font-bold text-white leading-none">{val}</p>
                  <p className="text-[10px] text-white/50">{pts}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-5">

          {/* Novas habilidades */}
          <Card>
            <CardTitle>✨ Novas habilidades</CardTitle>
            <div className="flex flex-col gap-2">
              {HABILIDADES_NOVAS.map((h) => (
                <div key={h.nome} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8E8F0] hover:border-purple/20 hover:bg-[#FAFAFE] transition-all cursor-pointer">
                  <span className="text-xl">{h.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-dark">{h.nome}</p>
                    <p className="text-xs text-gray-mid">{h.modal}</p>
                  </div>
                  <NivelDots nivel={h.nivel} />
                  {h.nova && <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-dk text-white">Nova!</span>}
                </div>
              ))}
            </div>
          </Card>

          {/* Principais habilidades */}
          <Card>
            <CardTitle>🏆 Principais habilidades</CardTitle>
            <div className="flex flex-col gap-2">
              {HABILIDADES_TOP.map((h) => (
                <div key={h.nome} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8E8F0] hover:border-purple/20 hover:bg-[#FAFAFE] transition-all cursor-pointer">
                  <span className="text-xl">{h.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-dark">{h.nome}</p>
                    <p className="text-xs text-gray-mid">{h.modal}</p>
                  </div>
                  <NivelDots nivel={h.nivel} />
                </div>
              ))}
            </div>
          </Card>

          {/* Histórico */}
          <Card>
            <CardTitle>📋 Histórico de aulas</CardTitle>
            <div className="flex flex-col gap-2">
              {HISTORICO.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-[#E8E8F0] hover:border-purple/20 hover:bg-[#FAFAFE] transition-all cursor-pointer">
                  <span className="text-xl mt-0.5">{a.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-dark">{a.nome}</p>
                    <p className="text-xs text-gray-mid">{a.data}</p>
                    {a.habs.length > 0 && (
                      <p className="text-xs text-purple mt-1">→ {a.habs.join(', ')}</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${a.presente ? 'bg-green/15 text-green-dk' : 'bg-gray-bg text-gray-mid'}`}>
                    {a.presente ? '✓ Presente' : 'Falta'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-5">

          {/* Conquistas */}
          <Card>
            <CardTitle>🏆 Conquistas</CardTitle>
            <div className="flex flex-col divide-y divide-gray-bg">
              {[
                { emoji: '🥋', nome: '3° lugar — Tecido Circense', sub: 'Trimestre Abr–Jun 2026' },
                { emoji: '⚡', nome: 'Nível 2 concluído',          sub: 'Trimestre Jan–Mar 2026' },
              ].map(({ emoji, nome, sub }) => (
                <div key={nome} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-bg flex items-center justify-center text-xl flex-shrink-0">{emoji}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-dark">{nome}</p>
                    <p className="text-xs text-gray-mid mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-2.5 rounded-xl bg-purple text-white text-xs font-bold hover:bg-purple-light transition-colors">
              🏅 Ver ranking do trimestre
            </button>
          </Card>

          {/* Níveis de referência */}
          <Card>
            <CardTitle>Níveis do trimestre</CardTitle>
            <div className="flex flex-col gap-2">
              {NIVEIS.map((n) => (
                <div
                  key={n.nivel}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl ${n.atual ? 'bg-purple/8 border border-purple/20' : 'bg-gray-bg'}`}
                >
                  <span className="text-lg w-7 text-center">{n.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-dark">Nível {n.nivel} · {n.nome}</p>
                    <p className="text-[10px] text-gray-mid">{n.xp} XP</p>
                  </div>
                  {n.atual && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple text-white">Você está aqui</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-mid mt-3">Reset a cada trimestre · Avaliações valem XP mesmo sem texto</p>
          </Card>
        </div>
      </div>
    </>
  )
}
