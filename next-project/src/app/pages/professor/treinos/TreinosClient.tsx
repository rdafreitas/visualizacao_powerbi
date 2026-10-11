'use client'
// ─────────────────────────────────────────────────────────────
// TreinosClient — Client Component
// Filtros por valência com Chip, modal de detalhes ao clicar
// no card. Sem Supabase, sem role, sem permissions.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { PageHeader }      from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button }          from '@/components/ui/Button'
import { Chip }            from '@/components/ui/Chip'
import { Modal }           from '@/components/ui/Modal'

// ── Dados demo ────────────────────────────────────────────────

type Exercicio = {
  id:          string
  nome:        string
  emoji:       string
  modalidade:  string
  valencias:   string[]
  nivel:       'Iniciante' | 'Intermediário' | 'Avançado'
  descricao:   string
  series?:     string
  obs?:        string
}

const EXERCICIOS: Exercicio[] = [
  {
    id: '1', emoji: '🎀',
    nome: 'Arabesque no tecido', modalidade: 'Tecido Circense',
    valencias: ['Flexibilidade', 'Equilíbrio'], nivel: 'Intermediário',
    descricao: 'Posição de arabesque sustentada no ponto médio do tecido, com extensão total da perna de trás.',
    series: '3 × 20s cada lado', obs: 'Manter quadril paralelo ao chão.',
  },
  {
    id: '2', emoji: '🎀',
    nome: 'Casulo básico', modalidade: 'Tecido Circense',
    valencias: ['Força', 'Flexibilidade'], nivel: 'Iniciante',
    descricao: 'Enrolamento completo no tecido formando casulo simétrico com os dois lados do pano cruzados.',
    series: '4 repetições', obs: 'Conferir tensão igual nos dois lados antes de subir.',
  },
  {
    id: '3', emoji: '🎀',
    nome: 'Escorpião no tecido', modalidade: 'Tecido Circense',
    valencias: ['Flexibilidade', 'Expressividade'], nivel: 'Avançado',
    descricao: 'Posição invertida com flexão profunda da coluna e toque dos pés na cabeça, sustentado pelo tecido.',
    series: '2 × 10s', obs: 'Aquecer coluna por no mínimo 10 min antes.',
  },
  {
    id: '4', emoji: '🤸',
    nome: 'Rolamento frontal', modalidade: 'Acrobacia de Solo',
    valencias: ['Coordenação', 'Agilidade'], nivel: 'Iniciante',
    descricao: 'Rolamento contínuo para frente com mãos no chão, queixo no peito e impulso dos pés.',
    series: '3 × 5 rep',
  },
  {
    id: '5', emoji: '🤸',
    nome: 'Roda', modalidade: 'Acrobacia de Solo',
    valencias: ['Força', 'Equilíbrio'], nivel: 'Intermediário',
    descricao: 'Giro lateral apoiado alternadamente nas mãos e nos pés, mantendo o corpo em linha reta.',
    series: '4 × 3 rep cada lado', obs: 'Olhar para o chão durante o movimento.',
  },
  {
    id: '6', emoji: '🤸',
    nome: 'Parada de mão', modalidade: 'Acrobacia de Solo',
    valencias: ['Força', 'Equilíbrio'], nivel: 'Avançado',
    descricao: 'Equilíbrio invertido sustentado sobre as mãos com corpo totalmente estendido.',
    series: '3 × 5s', obs: 'Sempre com spotter até 20s de sustentação.',
  },
  {
    id: '7', emoji: '🪢',
    nome: 'Cascata 3 bolas', modalidade: 'Malabares',
    valencias: ['Coordenação', 'Agilidade'], nivel: 'Iniciante',
    descricao: 'Padrão básico de malabarismo com 3 objetos em cascata contínua.',
    series: '5 × 30s', obs: 'Manter cotovelos próximos ao corpo.',
  },
  {
    id: '8', emoji: '💪',
    nome: 'Prancha 60s', modalidade: 'Condicionamento',
    valencias: ['Força', 'Resistência'], nivel: 'Iniciante',
    descricao: 'Posição de prancha abdominal com antebraços no chão, quadril neutro, sustentada por 60 segundos.',
    series: '3 × 60s', obs: 'Não deixar o quadril subir ou afundar.',
  },
  {
    id: '9', emoji: '💪',
    nome: 'Agachamento sumô', modalidade: 'Condicionamento',
    valencias: ['Força', 'Flexibilidade'], nivel: 'Iniciante',
    descricao: 'Agachamento com pés afastados além da largura dos ombros e pés virados para fora.',
    series: '4 × 12 rep',
  },
  {
    id: '10', emoji: '🎠',
    nome: 'Ponte de coluna', modalidade: 'Contorcionismo',
    valencias: ['Flexibilidade', 'Força'], nivel: 'Intermediário',
    descricao: 'Flexão profunda da coluna com apoio das mãos e pés no chão, formando arco completo.',
    series: '3 × 15s', obs: 'Aquecer coluna por 15 min antes.',
  },
  {
    id: '11', emoji: '🎠',
    nome: 'Escorpião em pé', modalidade: 'Contorcionismo',
    valencias: ['Flexibilidade', 'Equilíbrio'], nivel: 'Avançado',
    descricao: 'Equilíbrio em uma perna com flexão da coluna e toque do pé na cabeça.',
    series: '2 × 8s cada lado', obs: 'Usar parede de apoio até dominar o equilíbrio.',
  },
]

const VALENCIAS_FILTRO = [
  'Todos', 'Força', 'Flexibilidade', 'Equilíbrio',
  'Coordenação', 'Agilidade', 'Resistência', 'Expressividade',
]

const NIVEL_COR: Record<string, string> = {
  Iniciante:     'bg-green-light/40 text-chumbo',
  Intermediário: 'bg-orange/15 text-orange-dk',
  Avançado:      'bg-red/10 text-red',
}

const MODALIDADE_EMOJI: Record<string, string> = {
  'Tecido Circense':  '🎀',
  'Acrobacia de Solo':'🤸',
  'Malabares':        '🪢',
  'Condicionamento':  '💪',
  'Contorcionismo':   '🎠',
}

export function TreinosClient() {
  const [filtro,   setFiltro]   = useState('Todos')
  const [detalhe,  setDetalhe]  = useState<Exercicio | null>(null)
  const [modalAdd, setModalAdd] = useState(false)

  const exerciciosFiltrados = filtro === 'Todos'
    ? EXERCICIOS
    : EXERCICIOS.filter((e) => e.valencias.includes(filtro))

  // Agrupar por modalidade para exibição
  const porModalidade = exerciciosFiltrados.reduce<Record<string, Exercicio[]>>((acc, ex) => {
    if (!acc[ex.modalidade]) acc[ex.modalidade] = []
    acc[ex.modalidade].push(ex)
    return acc
  }, {})

  return (
    <>
      <PageHeader
        title="Biblioteca de Treinos 🏋️"
        subtitle={`${EXERCICIOS.length} exercícios cadastrados — filtre por valência.`}
        actions={
          <Button onClick={() => setModalAdd(true)}>+ Novo exercício</Button>
        }
      />

      {/* Filtros por valência */}
      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-sm px-5 py-4 mb-5">
        <p className="text-[10px] font-bold text-gray-mid uppercase tracking-wider mb-3">
          Filtrar por valência
        </p>
        <div className="flex flex-wrap gap-2">
          {VALENCIAS_FILTRO.map((v) => (
            <Chip
              key={v}
              label={v}
              active={filtro === v}
              onClick={() => setFiltro(v)}
            />
          ))}
        </div>
      </div>

      {/* Contador de resultados */}
      {filtro !== 'Todos' && (
        <p className="text-sm text-gray-mid mb-4">
          {exerciciosFiltrados.length} exercício{exerciciosFiltrados.length !== 1 ? 's' : ''} com valência <strong className="text-chumbo">{filtro}</strong>
        </p>
      )}

      {/* Sem resultados */}
      {exerciciosFiltrados.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <span className="text-4xl opacity-30">🔍</span>
            <p className="text-sm font-semibold text-gray-dark">Nenhum exercício com esta valência.</p>
            <Button variant="secondary" size="sm" onClick={() => setFiltro('Todos')}>
              Ver todos
            </Button>
          </div>
        </Card>
      )}

      {/* Grid agrupado por modalidade */}
      {Object.entries(porModalidade).map(([modalidade, exercicios]) => (
        <div key={modalidade} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{MODALIDADE_EMOJI[modalidade] ?? '🏋️'}</span>
            <h3
              className="text-sm font-bold text-gray-dark"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {modalidade}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-bg text-gray-mid">
              {exercicios.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exercicios.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setDetalhe(ex)}
                className="text-left bg-white rounded-2xl border border-black/[0.04] shadow-sm p-4 hover:border-chumbo/20 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                {/* Cabeçalho do card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p
                    className="text-sm font-bold text-gray-dark group-hover:text-chumbo transition-colors leading-tight"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {ex.nome}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${NIVEL_COR[ex.nivel]}`}>
                    {ex.nivel}
                  </span>
                </div>

                {/* Descrição resumida */}
                <p className="text-xs text-gray-mid leading-relaxed mb-3 line-clamp-2">
                  {ex.descricao}
                </p>

                {/* Chips de valência */}
                <div className="flex flex-wrap gap-1">
                  {ex.valencias.map((v) => (
                    <span
                      key={v}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        v === filtro && filtro !== 'Todos'
                          ? 'bg-chumbo text-off-white'
                          : 'bg-gray-bg text-gray-mid'
                      }`}
                    >
                      {v}
                    </span>
                  ))}
                </div>

                {/* Series se existir */}
                {ex.series && (
                  <p className="text-[10px] text-gray-mid mt-2 pt-2 border-t border-gray-bg">
                    📊 {ex.series}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Modal de detalhes do exercício */}
      <Modal
        open={!!detalhe}
        onClose={() => setDetalhe(null)}
        title={detalhe?.nome ?? ''}
        maxWidth="max-w-lg"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="ghost" onClick={() => setDetalhe(null)} className="flex-1">Fechar</Button>
            <Button variant="outline" className="flex-1">✏️ Editar exercício</Button>
          </div>
        }
      >
        {detalhe && (
          <div className="flex flex-col gap-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-bg text-gray-mid">
                {MODALIDADE_EMOJI[detalhe.modalidade]} {detalhe.modalidade}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${NIVEL_COR[detalhe.nivel]}`}>
                {detalhe.nivel}
              </span>
            </div>

            {/* Descrição */}
            <div className="bg-gray-bg rounded-xl p-4">
              <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-1">Descrição</p>
              <p className="text-sm text-gray-dark leading-relaxed">{detalhe.descricao}</p>
            </div>

            {/* Séries */}
            {detalhe.series && (
              <div className="flex items-center gap-3 bg-chumbo/5 rounded-xl p-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="text-[10px] font-bold text-gray-mid uppercase tracking-wide">Séries / Repetições</p>
                  <p className="text-sm font-bold text-chumbo">{detalhe.series}</p>
                </div>
              </div>
            )}

            {/* Observação */}
            {detalhe.obs && (
              <div className="flex items-start gap-3 bg-orange/8 border border-orange/20 rounded-xl p-3">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-[10px] font-bold text-orange-dk uppercase tracking-wide">Observação</p>
                  <p className="text-sm text-gray-dark leading-relaxed">{detalhe.obs}</p>
                </div>
              </div>
            )}

            {/* Valências */}
            <div>
              <p className="text-[10px] font-bold text-gray-mid uppercase tracking-wide mb-2">Valências</p>
              <div className="flex flex-wrap gap-2">
                {detalhe.valencias.map((v) => (
                  <span key={v} className="text-xs font-semibold px-3 py-1 rounded-full bg-chumbo/8 text-chumbo">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de novo exercício */}
      <Modal
        open={modalAdd}
        onClose={() => setModalAdd(false)}
        title="Novo exercício"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalAdd(false)}>Cancelar</Button>
            <Button onClick={() => setModalAdd(false)}>Salvar exercício</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-mid leading-relaxed">
            O formulário de cadastro de exercícios será implementado junto com a integração do banco de dados.
          </p>
          <div className="bg-gray-bg rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">🏗️</span>
            <p className="text-xs text-gray-mid">Campos: nome, modalidade, valências, nível, descrição, séries e observações.</p>
          </div>
        </div>
      </Modal>
    </>
  )
}
