'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/agenda/AgendaAlunoClient.tsx
//
// Client Component — semana navegável + inscrição/cancelamento.
// Optimistic update: estado local atualiza antes do servidor.
// ─────────────────────────────────────────────────────────────

import { useState }              from 'react'
import { PageHeader }            from '@/components/layout/PageHeader'
import { Card }                  from '@/components/ui/Card'
import { Toast }                 from '@/components/ui/Toast'
import {
  listarAulasAluno,
  inscreverAluno,
  cancelarInscricao,
  type AulaAlunoRow,
} from '@/(auth)/actions/inscricoes'

// ── Helpers de data ───────────────────────────────────────────

function gerarDiasDaSemana(inicioISO: string) {
  const dias = []
  const base = new Date(`${inicioISO}T12:00:00`)
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    dias.push({
      iso:   d.toISOString().split('T')[0],
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase(),
      num:   String(d.getDate()).padStart(2, '0'),
      mes:   d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    })
  }
  return dias
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── Props ─────────────────────────────────────────────────────

interface Props {
  aulasIniciais: AulaAlunoRow[]
  semanaInicial: string
}

export function AgendaAlunoClient({ aulasIniciais, semanaInicial }: Props) {

  const [semanaAtiva,    setSemanaAtiva]    = useState(semanaInicial)
  const [aulas,          setAulas]          = useState<AulaAlunoRow[]>(aulasIniciais)
  const [carregando,     setCarregando]     = useState(false)

  const diasDaSemana  = gerarDiasDaSemana(semanaAtiva)
  const hojeISO       = new Date().toISOString().split('T')[0]
  const diaDefault    = diasDaSemana.find((d) => d.iso === hojeISO)?.iso ?? diasDaSemana[0].iso
  const [diaSelecionado, setDiaSelecionado] = useState(diaDefault)

  const [operando, setOperando] = useState<string | null>(null)   // aulaId em operação

  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)
  function showMsg(msg: string) { setToast(msg); setShowToast(true) }

  // ── Navegação entre semanas ────────────────────────────────
  async function handleSemana(direcao: 'anterior' | 'proxima') {
    const base = new Date(`${semanaAtiva}T12:00:00`)
    base.setDate(base.getDate() + (direcao === 'proxima' ? 7 : -7))
    const novoInicio = base.toISOString().split('T')[0]
    const novoFim    = new Date(base)
    novoFim.setDate(base.getDate() + 6)

    setSemanaAtiva(novoInicio)
    setDiaSelecionado(novoInicio)
    setCarregando(true)

    const resultado = await listarAulasAluno(novoInicio, novoFim.toISOString().split('T')[0])
    if (resultado.ok) setAulas(resultado.data)
    setCarregando(false)
  }

  // ── Inscrição com optimistic update ───────────────────────
  async function handleInscrever(aulaId: string) {
    setOperando(aulaId)

    // Atualiza estado local imediatamente (optimistic)
    setAulas((prev) => prev.map((a) =>
      a.id === aulaId
        ? { ...a, inscricaoId: 'temp', inscritos: a.inscritos + 1, vagasLivres: Math.max(0, a.vagasLivres - 1) }
        : a
    ))

    const result = await inscreverAluno(aulaId)
    setOperando(null)

    if (!result.ok) {
      // Reverte estado local
      setAulas((prev) => prev.map((a) =>
        a.id === aulaId
          ? { ...a, inscricaoId: null, inscritos: a.inscritos - 1, vagasLivres: a.vagasLivres + 1 }
          : a
      ))
      showMsg(result.error)
      return
    }

    // Atualiza com o id real e status de lista de espera
    setAulas((prev) => prev.map((a) =>
      a.id === aulaId
        ? { ...a, inscricaoId: result.data.inscricaoId, listaEspera: result.data.listaEspera }
        : a
    ))
    showMsg(result.data.listaEspera ? 'Adicionado à lista de espera.' : 'Inscrição realizada com sucesso!')
  }

  // ── Cancelamento ──────────────────────────────────────────
  async function handleCancelar(aulaId: string, inscricaoId: string) {
    setOperando(aulaId)

    // Optimistic update
    setAulas((prev) => prev.map((a) =>
      a.id === aulaId
        ? { ...a, inscricaoId: null, inscritos: Math.max(0, a.inscritos - 1), vagasLivres: a.vagasLivres + 1 }
        : a
    ))

    const result = await cancelarInscricao(inscricaoId)
    setOperando(null)

    if (!result.ok) {
      // Reverte
      setAulas((prev) => prev.map((a) =>
        a.id === aulaId
          ? { ...a, inscricaoId, inscritos: a.inscritos + 1, vagasLivres: Math.max(0, a.vagasLivres - 1) }
          : a
      ))
      showMsg(result.error)
      return
    }

    showMsg('Inscrição cancelada.')
  }

  // ── Filtro por dia ─────────────────────────────────────────
  const aulasDoDia = aulas
    .filter((a) => a.inicio.startsWith(diaSelecionado))
    .sort((a, b) => a.inicio.localeCompare(b.inicio))

  const semanaLabel = (() => {
    const ini = new Date(`${semanaAtiva}T12:00:00`)
    const fim = new Date(ini)
    fim.setDate(ini.getDate() + 6)
    return `${ini.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
  })()

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={`Inscreva-se nas aulas da semana — ${semanaLabel}.`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => handleSemana('anterior')}
              disabled={carregando}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-black/[0.08]
                         hover:border-bordo/30 hover:text-bordo transition-all
                         disabled:opacity-50"
            >
              ‹ Anterior
            </button>
            <button
              onClick={() => handleSemana('proxima')}
              disabled={carregando}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-black/[0.08]
                         hover:border-bordo/30 hover:text-bordo transition-all
                         disabled:opacity-50"
            >
              Próxima ›
            </button>
          </div>
        }
      />

      {/* Tira de dias */}
      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-sm px-5 py-4 mb-5 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {diasDaSemana.map((d) => {
            const temAula = aulas.some((a) => a.inicio.startsWith(d.iso))
            const ativo   = d.iso === diaSelecionado
            return (
              <button
                key={d.iso}
                onClick={() => setDiaSelecionado(d.iso)}
                disabled={carregando}
                className="flex flex-col items-center px-4 py-2.5 rounded-xl transition-all
                           relative disabled:opacity-50"
                style={
                  ativo
                    ? { background: 'linear-gradient(135deg,#7A1D2C,#5a1520)', color: '#F4E7CE' }
                    : { background: 'transparent', color: '#211D1C' }
                }
              >
                <span className="text-[10px] font-bold uppercase"
                  style={{ color: ativo ? 'rgba(244,231,206,.6)' : '#8a7d70' }}>
                  {d.label} {d.mes}
                </span>
                <span className="text-xl font-extrabold leading-none mt-0.5"
                  style={{ fontFamily: 'var(--font-montserrat)' }}>
                  {d.num}
                </span>
                {/* Ponto indicador de aulas no dia */}
                {temAula && !ativo && (
                  <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: '#7A1D2C' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Aulas do dia */}
      {carregando ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 rounded-full border-2 border-bordo border-t-transparent animate-spin" />
        </div>
      ) : aulasDoDia.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-4xl opacity-30">📅</span>
            <p className="text-sm text-gray-mid">Nenhuma aula disponível neste dia.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {aulasDoDia.map((aula) => {
            const lotada     = aula.vagasLivres === 0 && !aula.inscricaoId
            const emOperacao = operando === aula.id

            const vagasClass = aula.vagasLivres === 0
              ? 'bg-red/15 text-red'
              : aula.vagasLivres <= 3
                ? 'bg-orange/15 text-orange-dk'
                : 'bg-green-light/40 text-chumbo'

            return (
              <div
                key={aula.id}
                className="bg-white rounded-2xl border border-black/[0.04] shadow-sm p-5
                           flex items-center gap-5 flex-wrap"
              >
                {/* Horário */}
                <div className="flex-shrink-0 w-20">
                  <p
                    className="text-lg font-extrabold text-bordo leading-none"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {formatHora(aula.inicio)}
                  </p>
                  <p className="text-[11px] text-gray-mid mt-0.5">
                    até {formatHora(aula.fim)}
                  </p>
                </div>

                <div className="w-px h-10 bg-black/8 flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-dark truncate"
                    style={{ fontFamily: 'var(--font-montserrat)' }}>
                    {aula.emoji ?? '🎪'} {aula.nome}
                  </p>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {aula.instrutor && (
                      <span className="text-xs text-gray-mid">👤 {aula.instrutor}</span>
                    )}
                    {aula.local && (
                      <span className="text-xs text-gray-mid">📍 {aula.local}</span>
                    )}
                  </div>
                </div>

                {/* Vagas */}
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${vagasClass}`}>
                  {aula.vagasLivres > 0 ? `${aula.vagasLivres} vagas` : 'Lotada'}
                  {' / '}{aula.vagas}
                </span>

                {/* Botão de ação */}
                {aula.inscricaoId && !aula.listaEspera ? (
                  // Inscrito — pode cancelar
                  <button
                    onClick={() => handleCancelar(aula.id, aula.inscricaoId!)}
                    disabled={emOperacao}
                    className="text-xs font-bold px-4 py-2 rounded-xl flex-shrink-0
                               bg-bordo/10 text-bordo hover:bg-bordo/20 transition-all
                               disabled:opacity-50"
                  >
                    {emOperacao ? '…' : '✓ Inscrito'}
                  </button>
                ) : aula.listaEspera ? (
                  // Na lista de espera
                  <span className="text-xs font-bold px-4 py-2 rounded-xl flex-shrink-0
                                   bg-orange/15 text-orange-dk">
                    ⏳ Espera
                  </span>
                ) : lotada ? (
                  // Lotada — entrar na lista de espera
                  <button
                    onClick={() => handleInscrever(aula.id)}
                    disabled={emOperacao}
                    className="text-xs font-bold px-4 py-2 rounded-xl flex-shrink-0
                               border border-black/[0.06] text-gray-mid
                               hover:border-bordo hover:text-bordo transition-all
                               disabled:opacity-50"
                  >
                    {emOperacao ? '…' : 'Lista de espera'}
                  </button>
                ) : (
                  // Disponível — inscrever
                  <button
                    onClick={() => handleInscrever(aula.id)}
                    disabled={emOperacao}
                    className="text-xs font-bold px-4 py-2 rounded-xl flex-shrink-0
                               bg-bordo text-off-white hover:bg-bordo-dk transition-all
                               disabled:opacity-50"
                  >
                    {emOperando ? '…' : 'Inscrever-se'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
