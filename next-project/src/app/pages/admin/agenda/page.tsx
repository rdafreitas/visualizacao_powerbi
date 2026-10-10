'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

const DIAS = [
  { label: 'SEG', num: '28', ativo: false },
  { label: 'TER', num: '29', ativo: false },
  { label: 'QUA', num: '30', ativo: true  },
  { label: 'QUI', num: '31', ativo: false },
  { label: 'SEX', num: '01', ativo: false },
  { label: 'SÁB', num: '02', ativo: false },
]

const AULAS = [
  { id: '1', hora: '09:00', fim: '10:00', emoji: '🎀', nome: 'Tecido Circense',   prof: 'Camila Rocha', local: 'Studio A',       inscritos: 8,  vagas: 10, cor: '#7A1D2C' },
  { id: '2', hora: '10:30', fim: '12:00', emoji: '🤸', nome: 'Acrobacia de Solo', prof: 'Diego Mendes', local: 'Sala Principal', inscritos: 10, vagas: 12, cor: '#211D1C' },
  { id: '3', hora: '14:00', fim: '15:30', emoji: '🪢', nome: 'Malabares',         prof: 'Lara Vaz',     local: 'Área Externa',   inscritos: 4,  vagas: 15, cor: '#f27406' },
  { id: '4', hora: '15:00', fim: '16:30', emoji: '🎠', nome: 'Contorcionismo',    prof: 'Ana Lima',     local: 'Studio B',       inscritos: 8,  vagas: 8,  cor: '#5a1520' },
  { id: '5', hora: '17:00', fim: '18:00', emoji: '💪', nome: 'Condicionamento',   prof: 'Diego Mendes', local: 'Sala Principal', inscritos: 6,  vagas: 20, cor: '#3a3330' },
]

export default function AdminAgendaPage() {
  const [diaAtivo, setDiaAtivo] = useState('30')
  const [modal, setModal]       = useState(false)

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Aulas do dia, inscrições e ocupação por turma."
        actions={<Button onClick={() => setModal(true)}>+ Nova aula</Button>}
      />

      {/* Tira de dias */}
      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-sm px-5 py-4 mb-5 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {DIAS.map((d) => (
            <button key={d.num} onClick={() => setDiaAtivo(d.num)}
              className="flex flex-col items-center px-5 py-2.5 rounded-xl transition-all"
              style={diaAtivo === d.num
                ? { background: 'linear-gradient(135deg,#c45e00,#f27406)', color: '#F4E7CE' }
                : { background: 'transparent', color: '#211D1C' }
              }
            >
              <span className="text-[10px] font-bold uppercase" style={{ color: diaAtivo === d.num ? 'rgba(244,231,206,.7)' : '#8a7d70' }}>
                {d.label} Jul
              </span>
              <span className="text-xl font-extrabold leading-none mt-0.5"
                style={{ fontFamily: 'var(--font-montserrat)' }}>{d.num}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards de aulas */}
      <div className="flex flex-col gap-4">
        {AULAS.map((a) => {
          const pct = Math.round((a.inscritos / a.vagas) * 100)
          const lotada = a.inscritos >= a.vagas
          return (
            <Card key={a.id} padding="none">
              <div className="flex items-stretch">
                {/* Barra lateral colorida */}
                <div className="w-1.5 rounded-l-2xl flex-shrink-0" style={{ background: a.cor }} />
                <div className="flex-1 p-5 flex items-center gap-5 flex-wrap">
                  {/* Horário */}
                  <div className="flex-shrink-0 w-20">
                    <p className="text-lg font-extrabold leading-none" style={{ color: a.cor, fontFamily: 'var(--font-montserrat)' }}>{a.hora}</p>
                    <p className="text-[11px] text-gray-mid mt-0.5">até {a.fim}</p>
                  </div>
                  <div className="w-px h-10 bg-black/8 flex-shrink-0" />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-dark" style={{ fontFamily: 'var(--font-montserrat)' }}>{a.emoji} {a.nome}</p>
                    <div className="flex gap-4 mt-1 flex-wrap">
                      <span className="text-xs text-gray-mid">👤 {a.prof}</span>
                      <span className="text-xs text-gray-mid">📍 {a.local}</span>
                    </div>
                  </div>
                  {/* Ocupação */}
                  <div className="flex-shrink-0 min-w-[140px]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-mid">Ocupação</span>
                      <span className="font-bold text-gray-dark">{a.inscritos}/{a.vagas}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-bg overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: lotada ? '#C0392B' : a.cor }} />
                    </div>
                    <p className="text-[10px] text-gray-mid mt-1">{pct}% ocupado{lotada ? ' · Lotada' : ''}</p>
                  </div>
                  {/* Ações */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline">Ver alunos</Button>
                    <Button size="sm" variant="ghost">Editar</Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modal nova aula */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nova aula"
        footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => setModal(false)}>Salvar</Button></>}>
        <div className="flex flex-col gap-4">
          <Input id="m-nome"  label="Nome da aula"    placeholder="Ex: Tecido Circense" />
          <Input id="m-prof"  label="Professor"        placeholder="Ex: Camila Rocha"   />
          <Input id="m-local" label="Local"            placeholder="Ex: Studio A"       />
          <div className="grid grid-cols-2 gap-3">
            <Input id="m-ini"  label="Início"  type="time" />
            <Input id="m-fim"  label="Término" type="time" />
          </div>
          <Input id="m-vagas" label="Vagas"    type="number" placeholder="Ex: 12" />
        </div>
      </Modal>
    </>
  )
}
