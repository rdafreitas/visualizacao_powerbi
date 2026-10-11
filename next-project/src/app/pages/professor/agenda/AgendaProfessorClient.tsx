'use client'
// ─────────────────────────────────────────────────────────────
// AgendaProfessorClient — Client Component
// Tira de dias interativa, lista de alunos expansível por aula,
// check-in simulado com useState. Sem Supabase, sem role.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { PageHeader }      from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button }          from '@/components/ui/Button'
import { Modal }           from '@/components/ui/Modal'
import { iniciais, avatarColorByName } from '@/lib/utils'

// ── Dados demo ────────────────────────────────────────────────

const DIAS = [
  { label: 'SEG', num: '28', mes: 'Jul' },
  { label: 'TER', num: '29', mes: 'Jul' },
  { label: 'QUA', num: '30', mes: 'Jul' },
  { label: 'QUI', num: '31', mes: 'Jul' },
  { label: 'SEX', num: '01', mes: 'Ago' },
  { label: 'SÁB', num: '02', mes: 'Ago' },
]

type Aluno = { nome: string; plano: string; presente: boolean; saude: string | null }

type Aula = {
  id:       string
  hora:     string
  fim:      string
  emoji:    string
  nome:     string
  local:    string
  alunos:   Aluno[]
}

const AULAS_POR_DIA: Record<string, Aula[]> = {
  '28': [
    {
      id: 'a1', hora: '09:00', fim: '10:00',
      emoji: '🎀', nome: 'Tecido Circense', local: 'Studio A',
      alunos: [
        { nome: 'Ana Lima',        plano: 'Completo', presente: true,  saude: null                   },
        { nome: 'Clara Santos',    plano: 'Básico',   presente: true,  saude: 'Tendinite no ombro'   },
        { nome: 'Beatriz Andrade', plano: 'Básico',   presente: false, saude: null                   },
        { nome: 'Fernanda Lima',   plano: 'Básico',   presente: false, saude: null                   },
        { nome: 'Paula Mendes',    plano: 'Premium',  presente: true,  saude: null                   },
      ],
    },
    {
      id: 'a2', hora: '17:00', fim: '18:00',
      emoji: '💪', nome: 'Condicionamento', local: 'Sala Principal',
      alunos: [
        { nome: 'Paulo Rezende',   plano: 'Completo', presente: true,  saude: null           },
        { nome: 'Lucas Pereira',   plano: 'Premium',  presente: false, saude: 'Dor lombar'   },
        { nome: 'Mateus Oliveira', plano: 'Premium',  presente: true,  saude: null           },
      ],
    },
  ],
  '30': [
    {
      id: 'b1', hora: '09:00', fim: '10:00',
      emoji: '🎀', nome: 'Tecido Circense', local: 'Studio A',
      alunos: [
        { nome: 'Ana Lima',        plano: 'Completo', presente: false, saude: null                   },
        { nome: 'Clara Santos',    plano: 'Básico',   presente: false, saude: 'Tendinite no ombro'   },
        { nome: 'Beatriz Andrade', plano: 'Básico',   presente: false, saude: null                   },
        { nome: 'Fernanda Lima',   plano: 'Básico',   presente: false, saude: null                   },
        { nome: 'Paula Mendes',    plano: 'Premium',  presente: false, saude: null                   },
      ],
    },
    {
      id: 'b2', hora: '10:30', fim: '12:00',
      emoji: '🤸', nome: 'Acrobacia de Solo', local: 'Sala Principal',
      alunos: [
        { nome: 'Mateus Oliveira', plano: 'Premium',  presente: false, saude: null         },
        { nome: 'Paulo Rezende',   plano: 'Completo', presente: false, saude: null         },
        { nome: 'Rafael Costa',    plano: 'Completo', presente: false, saude: 'Joelho'     },
      ],
    },
    {
      id: 'b3', hora: '17:00', fim: '18:00',
      emoji: '💪', nome: 'Condicionamento', local: 'Sala Principal',
      alunos: [
        { nome: 'Lucas Pereira',   plano: 'Premium',  presente: false, saude: null },
        { nome: 'Paulo Rezende',   plano: 'Completo', presente: false, saude: null },
      ],
    },
  ],
  '01': [
    {
      id: 'c1', hora: '10:00', fim: '11:30',
      emoji: '🎀', nome: 'Tecido Circense', local: 'Studio A',
      alunos: [
        { nome: 'Ana Lima',        plano: 'Completo', presente: false, saude: null },
        { nome: 'Clara Santos',    plano: 'Básico',   presente: false, saude: null },
        { nome: 'Paula Mendes',    plano: 'Premium',  presente: false, saude: null },
      ],
    },
  ],
}

const DIAS_COM_AULA = Object.keys(AULAS_POR_DIA)

// ── Página principal ──────────────────────────────────────────

export function AgendaProfessorClient() {
  const [diaAtivo,   setDiaAtivo]   = useState('30')
  const [aulaAberta, setAulaAberta] = useState<string | null>('b1')

  // Estado de check-in: { [aulaId]: { [nomeAluno]: boolean } }
  const [checkins, setCheckins] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {}
    Object.entries(AULAS_POR_DIA).forEach(([, aulas]) => {
      aulas.forEach((a) => {
        init[a.id] = {}
        a.alunos.forEach((al) => { init[a.id][al.nome] = al.presente })
      })
    })
    return init
  })

  // Modal de alerta de saúde
  const [modalSaude, setModalSaude] = useState<Aluno | null>(null)

  function toggleCheckin(aulaId: string, nomeAluno: string) {
    setCheckins((prev) => ({
      ...prev,
      [aulaId]: {
        ...prev[aulaId],
        [nomeAluno]: !prev[aulaId]?.[nomeAluno],
      },
    }))
  }

  const aulasHoje = AULAS_POR_DIA[diaAtivo] ?? []

  return (
    <>
      <PageHeader
        title="Agenda 📅"
        subtitle="Suas aulas do dia, alunos inscritos e check-in."
      />

      {/* Tira de dias */}
      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-sm px-5 py-4 mb-5 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {DIAS.map((d) => {
            const temAula  = DIAS_COM_AULA.includes(d.num)
            const isAtivo  = diaAtivo === d.num
            return (
              <button
                key={d.num}
                onClick={() => { setDiaAtivo(d.num); setAulaAberta(null) }}
                className="flex flex-col items-center px-5 py-2.5 rounded-xl transition-all relative"
                style={
                  isAtivo
                    ? { background: 'linear-gradient(135deg,#211D1C,#3a3330)', color: '#F4E7CE' }
                    : { background: 'transparent', color: '#211D1C' }
                }
              >
                <span
                  className="text-[10px] font-bold uppercase"
                  style={{ color: isAtivo ? 'rgba(244,231,206,.6)' : '#8a7d70' }}
                >
                  {d.label} {d.mes}
                </span>
                <span
                  className="text-xl font-extrabold leading-none mt-0.5"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  {d.num}
                </span>
                {/* Bolinha indicadora de aulas */}
                {temAula && !isAtivo && (
                  <span
                    className="absolute bottom-1.5 w-1 h-1 rounded-full"
                    style={{ background: '#211D1C' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sem aulas no dia */}
      {aulasHoje.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <span className="text-4xl opacity-30">😴</span>
            <p className="text-sm font-semibold text-gray-dark">Nenhuma aula neste dia.</p>
            <p className="text-xs text-gray-mid">Aproveite para descansar ou preparar treinos.</p>
          </div>
        </Card>
      )}

      {/* Lista de aulas do dia */}
      <div className="flex flex-col gap-4">
        {aulasHoje.map((aula) => {
          const aberta       = aulaAberta === aula.id
          const checkinsAula = checkins[aula.id] ?? {}
          const presentes    = Object.values(checkinsAula).filter(Boolean).length
          const total        = aula.alunos.length
          const pct          = Math.round((presentes / total) * 100)
          const temSaude     = aula.alunos.some((a) => a.saude)

          return (
            <Card key={aula.id} padding="none">
              {/* Cabeçalho da aula — clicável para expandir */}
              <button
                className="w-full flex items-center gap-5 p-5 text-left"
                onClick={() => setAulaAberta(aberta ? null : aula.id)}
              >
                {/* Horário */}
                <div className="flex-shrink-0 w-20">
                  <p
                    className="text-lg font-extrabold leading-none text-chumbo"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {aula.hora}
                  </p>
                  <p className="text-[11px] text-gray-mid mt-0.5">até {aula.fim}</p>
                </div>

                <div className="w-px h-10 bg-black/8 flex-shrink-0" />

                {/* Info da aula */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-gray-dark"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {aula.emoji} {aula.nome}
                  </p>
                  <p className="text-xs text-gray-mid mt-0.5">📍 {aula.local}</p>
                </div>

                {/* Presença + badge saúde */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {temSaude && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-light/30 text-chumbo">
                      🩺 Alertas
                    </span>
                  )}
                  <div className="text-right">
                    <p
                      className="text-base font-extrabold text-chumbo"
                      style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                      {presentes}/{total}
                    </p>
                    <p className="text-[10px] text-gray-mid">{pct}% presença</p>
                  </div>
                  <span className="text-gray-mid text-lg">{aberta ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Lista de alunos — expansível */}
              {aberta && (
                <div className="border-t border-gray-bg">
                  {/* Barra de progresso da presença */}
                  <div className="px-5 pt-4 pb-2">
                    <div className="h-1.5 bg-gray-bg rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width:      `${pct}%`,
                          background: pct >= 80 ? '#BFD6A1' : pct >= 50 ? '#f27406' : '#C0392B',
                        }}
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-gray-bg">
                    {aula.alunos.map((al) => {
                      const presente = checkinsAula[al.nome] ?? false
                      return (
                        <div key={al.nome} className="flex items-center gap-4 px-5 py-3">
                          {/* Avatar */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-off-white flex-shrink-0"
                            style={{ background: avatarColorByName(al.nome) }}
                          >
                            {iniciais(al.nome)}
                          </div>

                          {/* Nome + plano */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-dark truncate">{al.nome}</p>
                            <p className="text-[11px] text-gray-mid">{al.plano}</p>
                          </div>

                          {/* Badge saúde — abre modal */}
                          {al.saude && (
                            <button
                              onClick={() => setModalSaude(al)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-light/30 text-chumbo hover:bg-blue-light/50 transition-colors flex-shrink-0"
                            >
                              🩺 {al.saude}
                            </button>
                          )}

                          {/* Botão de check-in */}
                          <button
                            onClick={() => toggleCheckin(aula.id, al.nome)}
                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                            style={
                              presente
                                ? { background: '#BFD6A1', borderColor: '#BFD6A1', color: '#211D1C' }
                                : { background: 'transparent', borderColor: '#c8bcb0', color: 'transparent' }
                            }
                          >
                            {presente && <span className="text-sm font-bold">✓</span>}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Rodapé com resumo e botão de confirmar */}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-bg bg-gray-bg/40">
                    <p className="text-xs text-gray-mid">
                      {presentes} de {total} marcados como presentes
                    </p>
                    <Button size="sm" variant="primary">
                      ✓ Confirmar lista
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Modal de alerta de saúde */}
      <Modal
        open={!!modalSaude}
        onClose={() => setModalSaude(null)}
        title={`🩺 Alerta de saúde — ${modalSaude?.nome ?? ''}`}
        maxWidth="max-w-sm"
        footer={
          <Button onClick={() => setModalSaude(null)}>Entendido</Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="bg-blue-light/15 border border-blue-light/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-chumbo">{modalSaude?.saude}</p>
          </div>
          <p className="text-sm text-gray-mid leading-relaxed">
            Adapte os exercícios desta aula para este aluno. Em caso de dúvida,
            consulte o responsável ou evite movimentos que agravem a condição.
          </p>
        </div>
      </Modal>
    </>
  )
}
