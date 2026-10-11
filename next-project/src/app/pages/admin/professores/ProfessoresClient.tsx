'use client'
// ─────────────────────────────────────────────────────────────
// ProfessoresClient — Client Component
// Dados demo hardcoded. Modal de cadastro simulado.
// Sem Supabase, sem permissions, sem role.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { PageHeader }      from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button }          from '@/components/ui/Button'
import { Modal }           from '@/components/ui/Modal'
import { Input }           from '@/components/ui/Input'
import { iniciais, avatarColorByName } from '@/lib/utils'

// ── Dados demo ────────────────────────────────────────────────

const PROFESSORES = [
  {
    id: '1',
    nome:          'Camila Rocha',
    email:         'camila@andorin.com.br',
    telefone:      '(11) 98888-0001',
    especialidade: 'Tecido Circense',
    turmas:        3,
    alunosTotal:   28,
    presencaMedia: 88,
    remuneracao:   2800,
    modalidades:   ['Tecido Circense', 'Condicionamento'],
    status:        'ativo' as const,
  },
  {
    id: '2',
    nome:          'Diego Mendes',
    email:         'diego@andorin.com.br',
    telefone:      '(11) 98888-0002',
    especialidade: 'Acrobacia de Solo',
    turmas:        4,
    alunosTotal:   36,
    presencaMedia: 92,
    remuneracao:   2400,
    modalidades:   ['Acrobacia de Solo', 'Condicionamento'],
    status:        'ativo' as const,
  },
  {
    id: '3',
    nome:          'Lara Vaz',
    email:         'lara@andorin.com.br',
    telefone:      '(11) 98888-0003',
    especialidade: 'Malabares',
    turmas:        2,
    alunosTotal:   18,
    presencaMedia: 85,
    remuneracao:   1800,
    modalidades:   ['Malabares'],
    status:        'ativo' as const,
  },
  {
    id: '4',
    nome:          'Ana Lima',
    email:         'ana@andorin.com.br',
    telefone:      '(11) 98888-0004',
    especialidade: 'Contorcionismo',
    turmas:        2,
    alunosTotal:   12,
    presencaMedia: 79,
    remuneracao:   1400,
    modalidades:   ['Contorcionismo', 'Acrobacia de Solo'],
    status:        'ativo' as const,
  },
]

const KPIS = [
  { icon: '🎭', valor: '4',        label: 'Professores',     cor: 'text-chumbo'    },
  { icon: '📅', valor: '11',       label: 'Turmas ativas',   cor: 'text-chumbo'    },
  { icon: '👥', valor: '94',       label: 'Alunos no total', cor: 'text-chumbo'    },
  { icon: '💰', valor: 'R$ 8,4k',  label: 'Folha do mês',    cor: 'text-orange-dk' },
]

// Barra de presença — reutilizável e sem biblioteca
function BarraPresenca({ valor }: { valor: number }) {
  const cor = valor >= 90 ? '#BFD6A1' : valor >= 80 ? '#f27406' : '#C0392B'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${valor}%`, background: cor }}
        />
      </div>
      <span className="text-xs font-bold text-gray-dark w-8 text-right">{valor}%</span>
    </div>
  )
}

export function ProfessoresClient() {
  const [modal, setModal] = useState(false)

  return (
    <>
      <PageHeader
        title="Professores 🎭"
        subtitle="Gerencie o corpo docente, turmas e remuneração."
        actions={<Button onClick={() => setModal(true)}>+ Novo professor</Button>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {KPIS.map((k) => (
          <Card key={k.label}>
            <span className="text-3xl block mb-3">{k.icon}</span>
            <p className={`text-[28px] font-extrabold leading-none ${k.cor}`}
              style={{ fontFamily: 'var(--font-montserrat)' }}>
              {k.valor}
            </p>
            <p className="text-xs text-gray-mid mt-1">{k.label}</p>
          </Card>
        ))}
      </div>

      {/* Grid de cards de professores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {PROFESSORES.map((p) => (
          <Card key={p.id} padding="none">
            <div className="p-5">

              {/* Cabeçalho do card */}
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold text-off-white flex-shrink-0"
                  style={{
                    background:  avatarColorByName(p.nome),
                    fontFamily:  'var(--font-montserrat)',
                  }}
                >
                  {iniciais(p.nome)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-gray-dark text-base leading-tight"
                    style={{ fontFamily: 'var(--font-montserrat)' }}>
                    {p.nome}
                  </p>
                  <p className="text-xs text-gray-mid mt-0.5">{p.email}</p>
                  <p className="text-xs text-gray-mid">{p.telefone}</p>

                  {/* Chips de modalidade */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.modalidades.map((m) => (
                      <span
                        key={m}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-bg text-gray-mid"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-light/40 text-chumbo flex-shrink-0">
                  ● Ativo
                </span>
              </div>

              {/* Métricas em grid 2×2 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Turmas',         valor: `${p.turmas}`,              icon: '📅' },
                  { label: 'Alunos',         valor: `${p.alunosTotal}`,         icon: '👥' },
                  { label: 'Remuneração',    valor: `R$ ${p.remuneracao.toLocaleString('pt-BR')}`, icon: '💰' },
                  { label: 'Especialidade',  valor: p.especialidade,            icon: '🎯' },
                ].map(({ label, valor, icon }) => (
                  <div key={label} className="bg-gray-bg rounded-xl p-3">
                    <p className="text-[10px] text-gray-mid mb-1">{icon} {label}</p>
                    <p className="text-sm font-bold text-gray-dark truncate">{valor}</p>
                  </div>
                ))}
              </div>

              {/* Barra de presença média */}
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <p className="text-[11px] text-gray-mid">Presença média dos alunos</p>
                </div>
                <BarraPresenca valor={p.presencaMedia} />
              </div>
            </div>

            {/* Rodapé do card com ações */}
            <div className="flex gap-2 px-5 py-3 border-t border-gray-bg">
              <Button size="sm" variant="outline" className="flex-1">
                👁 Ver turmas
              </Button>
              <Button size="sm" variant="ghost" className="flex-1">
                ✏️ Editar
              </Button>
              <Button size="sm" variant="danger">
                🔒 Bloquear
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de cadastro */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Novo professor"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={() => setModal(false)}>Cadastrar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input id="p-nome"  label="Nome completo"   placeholder="Ex: João Silva"         />
          <Input id="p-email" label="E-mail de acesso" type="email" placeholder="joao@andorin.com.br" />
          <Input id="p-tel"   label="Telefone"         type="tel"   placeholder="(11) 99999-9999"     />
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
              Especialidade principal
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Tecido Circense', 'Acrobacia de Solo', 'Malabares', 'Contorcionismo', 'Condicionamento', 'Outra'].map((esp) => (
                <button
                  key={esp}
                  type="button"
                  className="p-2.5 rounded-xl border border-black/[0.06] text-xs font-semibold text-gray-dark hover:border-bordo hover:text-bordo transition-all text-left"
                >
                  {esp}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
