'use client'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { iniciais, avatarColorByName } from '@/lib/utils'

const ALUNOS = [
  { id: '1', nome: 'Ana Lima',        email: 'ana@andorin.com.br',      plano: 'Completo', modalidades: ['Tecido Circense', 'Acrobacia de Solo'],              status: 'ativo' as const,        mensalidade: 280, vencimento: '30 ago 2026' },
  { id: '2', nome: 'Mateus Oliveira', email: 'mateus@andorin.com.br',   plano: 'Premium',  modalidades: ['Tecido Circense', 'Malabares', 'Acrobacia de Solo'], status: 'ativo' as const,        mensalidade: 480, vencimento: '05 ago 2026' },
  { id: '3', nome: 'Clara Santos',    email: 'clara@andorin.com.br',    plano: 'Básico',   modalidades: ['Acrobacia de Solo'],                                  status: 'ativo' as const,        mensalidade: 180, vencimento: '10 ago 2026' },
  { id: '4', nome: 'Rafael Costa',    email: 'rafael@andorin.com.br',   plano: 'Completo', modalidades: ['Malabares', 'Condicionamento'],                       status: 'inadimplente' as const, mensalidade: 280, vencimento: '01 jul 2026' },
  { id: '5', nome: 'Beatriz Andrade', email: 'beatriz@andorin.com.br',  plano: 'Básico',   modalidades: ['Contorcionismo'],                                     status: 'ativo' as const,        mensalidade: 180, vencimento: '15 ago 2026' },
  { id: '6', nome: 'Paulo Rezende',   email: 'paulo@andorin.com.br',    plano: 'Completo', modalidades: ['Tecido Circense', 'Condicionamento'],                 status: 'trial' as const,        mensalidade: 280, vencimento: '03 ago 2026' },
  { id: '7', nome: 'Fernanda Lima',   email: 'fernanda@andorin.com.br', plano: 'Básico',   modalidades: ['Tecido Circense'],                                    status: 'trial' as const,        mensalidade: 180, vencimento: '02 ago 2026' },
  { id: '8', nome: 'Lucas Pereira',   email: 'lucas@andorin.com.br',    plano: 'Premium',  modalidades: ['Malabares', 'Tecido Circense', 'Contorcionismo'],     status: 'inativo' as const,      mensalidade: 480, vencimento: '—'           },
]

const TABS = [
  { key: 'todos',        label: 'Todos (8)'        },
  { key: 'ativo',        label: 'Ativos (5)'       },
  { key: 'inadimplente', label: 'Inadimplentes (1)' },
  { key: 'trial',        label: 'Trial (2)'        },
  { key: 'inativo',      label: 'Inativos (1)'     },
]

const STATUS_LABEL: Record<string, string> = {
  ativo: '🟢 Ativo', inadimplente: '🔴 Inadimplente', trial: '🟡 Trial', inativo: '⚪ Inativo',
}

export default function AdminAlunosPage() {
  const [tab,   setTab]   = useState('todos')
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)

  const filtrados = ALUNOS.filter((a) => {
    const matchTab   = tab === 'todos' || a.status === tab
    const matchBusca = a.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       a.email.toLowerCase().includes(busca.toLowerCase())
    return matchTab && matchBusca
  })

  return (
    <>
      <PageHeader
        title="Alunos"
        subtitle="Gerencie matrículas, planos e situação financeira."
        actions={<Button onClick={() => setModal(true)}>+ Nova matrícula</Button>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: '👥', valor: '84', label: 'Total de alunos', cor: 'text-gray-dark' },
          { icon: '✅', valor: '71', label: 'Ativos',           cor: 'text-chumbo'   },
          { icon: '⚠️', valor: '5',  label: 'Inadimplentes',   cor: 'text-red'       },
          { icon: '🎟️', valor: '8',  label: 'Em trial',        cor: 'text-orange-dk' },
        ].map((k) => (
          <Card key={k.label}>
            <span className="text-3xl block mb-2">{k.icon}</span>
            <p className={`text-[28px] font-extrabold leading-none ${k.cor}`}
              style={{ fontFamily: 'var(--font-montserrat)' }}>{k.valor}</p>
            <p className="text-xs text-gray-mid mt-1">{k.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <Tabs tabs={TABS} active={tab} onChange={setTab} />
          </div>
          <Input id="busca" placeholder="Buscar por nome ou e-mail…"
            value={busca} onChange={(e) => setBusca(e.target.value)} className="sm:w-64" />
        </div>

        <Table>
          <Thead>
            <tr>
              <Th>Aluno</Th><Th>Plano</Th><Th>Modalidades</Th>
              <Th>Situação</Th><Th>Mensalidade</Th><Th>Vencimento</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </Thead>
          <Tbody>
            {filtrados.map((a) => (
              <Tr key={a.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-off-white flex-shrink-0"
                      style={{ background: avatarColorByName(a.nome) }}>{iniciais(a.nome)}</div>
                    <div>
                      <p className="font-semibold text-gray-dark">{a.nome}</p>
                      <p className="text-[11px] text-gray-mid">{a.email}</p>
                    </div>
                  </div>
                </Td>
                <Td><span className="text-sm font-semibold text-gray-dark">{a.plano}</span></Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {a.modalidades.map((m) => (
                      <span key={m} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-bg text-gray-mid">{m}</span>
                    ))}
                  </div>
                </Td>
                <Td><Badge variant={a.status}>{STATUS_LABEL[a.status]}</Badge></Td>
                <Td><span className="font-semibold text-gray-dark">R$ {a.mensalidade}</span></Td>
                <Td className={a.status === 'inadimplente' ? 'text-red font-semibold' : 'text-gray-mid'}>{a.vencimento}</Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline">Ver</Button>
                    <Button size="sm" variant="ghost">Editar</Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Nova matrícula"
        footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => setModal(false)}>Cadastrar</Button></>}>
        <div className="flex flex-col gap-4">
          <Input id="nm" label="Nome completo"  placeholder="Ex: Maria Silva" />
          <Input id="em" label="E-mail"         type="email" placeholder="maria@email.com" />
          <Input id="tel" label="Telefone"       type="tel"   placeholder="(11) 99999-9999" />
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">Plano</p>
            <div className="grid grid-cols-3 gap-2">
              {['Básico · R$180', 'Completo · R$280', 'Premium · R$480'].map((p) => (
                <button key={p} className="p-3 rounded-xl border border-black/[0.06] text-xs font-semibold text-gray-dark hover:border-bordo hover:text-bordo transition-all text-center">{p}</button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
