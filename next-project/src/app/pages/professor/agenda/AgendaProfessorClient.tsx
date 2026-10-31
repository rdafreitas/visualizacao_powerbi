'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/agenda/AgendaProfessorClient.tsx
//
// Client Component — check-in real com optimistic update.
// Dados chegam do Server Component como props — sem queries no browser.
//
// OPTIMISTIC UPDATE:
//   O estado local é atualizado ANTES da resposta do servidor.
//   Se o servidor retornar erro, o estado é revertido.
//   Isso elimina o delay visual e torna o check-in fluido.
// ─────────────────────────────────────────────────────────────

import { useState }            from 'react'
import { PageHeader }          from '@/components/layout/PageHeader'
import { Card }                from '@/components/ui/Card'
import { Button }              from '@/components/ui/Button'
import { Modal }               from '@/components/ui/Modal'
import { Toast }               from '@/components/ui/Toast'
import { iniciais, avatarColorByName, formatDataCurta } from '@/lib/utils'
import {
  listarAulasProfessor,
  marcarPresenca,
  definirTreinoDaAula,
  type AulaProfessorRow,
} from '@/(auth)/actions/checkin'
import type { TreinoRow } from '@/(auth)/actions/treinos'

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
  aulasSemanaInicial: AulaProfessorRow[]
  treinos:            TreinoRow[]
  semanaInicial:      string
}

export function AgendaProfessorClient({ aulasSemanaInicial, treinos, semanaInicial }: Props) {

  const [semanaAtiva,    setSemanaAtiva]    = useState(semanaInicial)
  const [aulas,          setAulas]          = useState<AulaProfessorRow[]>(aulasSemanaInicial)
  const [carregando,     setCarregando]     = useState(false)

  const diasDaSemana  = gerarDiasDaSemana(semanaAtiva)
  const hojeISO       = new Date().toISOString().split('T')[0]
  const diaDefault    = diasDaSemana.find((d) => d.iso === hojeISO)?.iso ?? diasDaSemana[0].iso
  const [diaSelecionado, setDiaSelecionado] = useState(diaDefault)

  // Aula expandida para mostrar lista de alunos
  const [aulaAberta,    setAulaAberta]    = useState<string | null>(null)

  // Modal de restrição de saúde
  const [modalSaude,    setModalSaude]    = useState<{ nome: string; restricoes: string[] } | null>(null)

  // Modal de definir treino da aula
  const [modalTreino,   setModalTreino]   = useState<AulaProfessorRow | null>(null)
  const [treinoSel,     setTreinoSel]     = useState('')
  const [salvandoTreino, setSalvandoTreino] = useState(false)

  // Toast
  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)
  function showMsg(msg: string) { setToast(msg); setShowToast(true) }

  // ── Navegação entre semanas ───────────────────────────────────
  async function handleSemana(direcao: 'anterior' | 'proxima') {
    const base = new Date(`${semanaAtiva}T12:00:00`)
    base.setDate(base.getDate() + (direcao === 'proxima' ? 7 : -7))
    const novoInicio = base.toISOString().split('T')[0]
    const novoFim    = new Date(base)
    novoFim.setDate(base.getDate() + 6)

    setSemanaAtiva(novoInicio)
    setDiaSelecionado(novoInicio)
    setCarregando(true)

    const resultado = await listarAulasProfessor(novoInicio, novoFim.toISOString().split('T')[0])
    if (resultado.ok) setAulas(resultado.data)
    setCarregando(false)
  }

  // ── Check-in com optimistic update ───────────────────────────
  async function handleCheckin(
    aulaId:      string,
    inscricaoId: string,
    presente:    boolean
  ) {
    // Atualiza estado local ANTES da resposta do servidor
    setAulas((prev) => prev.map((a) => {
      if (a.id !== aulaId) return a
      return {
        ...a,
        inscritos: a.inscritos.map((i) =>
          i.id === inscricaoId ? { ...i, presente } : i
        ),
      }
    }))

    const result = await marcarPresenca(inscricaoId, presente)

    if (!result.ok) {
      // Reverte se falhou
      setAulas((prev) => prev.map((a) => {
        if (a.id !== aulaId) return a
        return {
          ...a,
          inscritos: a.inscritos.map((i) =>
            i.id === inscricaoId ? { ...i, presente: !presente } : i
          ),
        }
      }))
      showMsg(result.error)
    }
    // Sem showMsg de sucesso — o ✓ visual é feedback suficiente
  }

  // ── Definir treino da aula ────────────────────────────────────
  async function handleDefinirTreino() {
    if (!modalTreino || !treinoSel) return

    setSalvandoTreino(true)
    const result = await definirTreinoDaAula(modalTreino.id, treinoSel)
    setSalvandoTreino(false)

    if (!result.ok) { showMsg(result.error); return }

    setModalTreino(null)
    setTreinoSel('')
    showMsg('Treino definido para a aula.')
  }

  // ── Filtro por dia em memória ─────────────────────────────────
  const aulasDoDia = aulas
    .filter((a) => a.inicio.startsWith(diaSelecionado))
    .sort((a, b) => a.inicio.localeCompare(b.inicio))

  const semanaLabel = (() => {
    const ini = new Date(`${semanaAtiva}T12:00:00`)
    const fim = new Date(ini)
    fim.setDate(ini.getDate() + 6)
    return `${formatDataCurta(ini)} – ${formatDataCurta(fim)}`
  })()

  return (
    <>
      <PageHeader
        title="Agenda 📅"
        subtitle={`Semana de ${semanaLabel} — suas aulas e check-in.`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSemana('anterior')} disabled={carregando}>
              ‹ Anterior
            </Button>
            <Button variant="outline" onClick={() => handleSemana('proxima')} disabled={carregando}>
              Próxima ›
            </Button>
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
                className="flex flex-col items-center px-5 py-2.5 rounded-xl transition-all
                           relative disabled:opacity-50"
                style={
                  ativo
                    ? { background: 'linear-gradient(135deg,#211D1C,#3a3330)', color: '#F4E7CE' }
                    : { background: 'transparent', color: '#211D1C' }
                }
              >
                <span
                  className="text-[10px] font-bold uppercase"
                  style={{ color: ativo ? 'rgba(244,231,206,.6)' : '#8a7d70' }}
                >
                  {d.label} {d.mes}
                </span>
                <span
                  className="text-xl font-extrabold leading-none mt-0.5"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  {d.num}
                </span>
                {temAula && !ativo && (
                  <span
                    className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: '#3a3330' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo do dia */}
      {carregando ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 rounded-full border-2 border-chumbo border-t-transparent animate-spin" />
        </div>
      ) : aulasDoDia.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="text-4xl opacity-30">😴</span>
            <p className="text-sm text-gray-dark font-semibold">Nenhuma aula neste dia.</p>
            <p className="text-xs text-gray-mid">Aproveite para preparar treinos ou descansar.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {aulasDoDia.map((aula) => {
            const aberta    = aulaAberta === aula.id
            const presentes = aula.inscritos.filter((i) => i.presente).length
            const total     = aula.inscritos.length
            const pct       = total > 0 ? Math.round((presentes / total) * 100) : 0
            const temSaude  = aula.inscritos.some((i) => i.restricoes.length > 0)

            return (
              <Card key={aula.id} padding="none">

                {/* Cabeçalho clicável */}
                <button
                  className="w-full flex items-center gap-5 p-5 text-left"
                  onClick={() => setAulaAberta(aberta ? null : aula.id)}
                >
                  <div className="flex-shrink-0 w-20">
                    <p
                      className="text-lg font-extrabold leading-none text-chumbo"
                      style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                      {formatHora(aula.inicio)}
                    </p>
                    <p className="text-[11px] text-gray-mid mt-0.5">até {formatHora(aula.fim)}</p>
                  </div>

                  <div className="w-px h-10 bg-black/8 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold text-gray-dark"
                      style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                      {aula.emoji ?? '🎪'} {aula.nome}
                    </p>
                    <div className="flex gap-3 mt-0.5 flex-wrap">
                      {aula.local && (
                        <span className="text-xs text-gray-mid">📍 {aula.local}</span>
                      )}
                      {aula.habilidadeNome && (
                        <span className="text-xs text-gray-mid">
                          🎯 {aula.habilidadeNome} (Nível {aula.nivelDaAula})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {temSaude && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-light/30 text-chumbo">
                        🩺 Alertas
                      </span>
                    )}
                    {!aula.habilidadeNome && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setModalTreino(aula)
                          setTreinoSel('')
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full
                                   bg-orange/15 text-orange-dk hover:bg-orange/25 transition-colors"
                      >
                        ⚠️ Definir treino
                      </button>
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
                    {/* Barra de presença */}
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

                    {total === 0 ? (
                      <p className="text-sm text-gray-mid text-center py-6">
                        Nenhum aluno inscrito nesta aula.
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-bg">
                        {aula.inscritos.map((al) => (
                          <div key={al.id} className="flex items-center gap-4 px-5 py-3">
                            {/* Avatar */}
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center
                                         text-xs font-bold text-off-white flex-shrink-0"
                              style={{ background: avatarColorByName(al.nome) }}
                            >
                              {iniciais(al.nome)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-dark truncate">{al.nome}</p>
                            </div>

                            {/* Alerta de saúde — abre modal com detalhe */}
                            {al.restricoes.length > 0 && (
                              <button
                                onClick={() => setModalSaude({ nome: al.nome, restricoes: al.restricoes })}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full
                                           bg-blue-light/30 text-chumbo hover:bg-blue-light/50
                                           transition-colors flex-shrink-0"
                              >
                                🩺 {al.restricoes.length > 1 ? `${al.restricoes.length} alertas` : 'Alerta'}
                              </button>
                            )}

                            {/* Botão de check-in com optimistic update */}
                            <button
                              onClick={() => handleCheckin(aula.id, al.id, !al.presente)}
                              className="w-8 h-8 rounded-full border-2 flex items-center
                                         justify-center transition-all flex-shrink-0"
                              aria-label={al.presente ? `Desmarcar presença de ${al.nome}` : `Marcar presença de ${al.nome}`}
                              style={
                                al.presente
                                  ? { background: '#BFD6A1', borderColor: '#BFD6A1', color: '#211D1C' }
                                  : { background: 'transparent', borderColor: '#c8bcb0', color: 'transparent' }
                              }
                            >
                              {al.presente && <span className="text-sm font-bold">✓</span>}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-bg bg-gray-bg/40">
                      <p className="text-xs text-gray-mid">
                        {presentes} de {total} presentes
                        {' · '}
                        {pct >= 3
                          ? '💰 R$50 calculados'
                          : `💰 R$30 (faltam ${3 - presentes} para R$50)`}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de alerta de saúde */}
      <Modal
        open={!!modalSaude}
        onClose={() => setModalSaude(null)}
        title={`🩺 Alertas — ${modalSaude?.nome ?? ''}`}
        maxWidth="max-w-sm"
        footer={<Button onClick={() => setModalSaude(null)}>Entendido</Button>}
      >
        <div className="flex flex-col gap-3">
          {(modalSaude?.restricoes ?? []).map((r, i) => (
            <div key={i} className="bg-blue-light/15 border border-blue-light/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-chumbo">{r}</p>
            </div>
          ))}
          <p className="text-sm text-gray-mid leading-relaxed">
            Adapte os exercícios para este aluno e evite movimentos que agravem a condição.
          </p>
        </div>
      </Modal>

      {/* Modal de definir treino */}
      <Modal
        open={!!modalTreino}
        onClose={() => { setModalTreino(null); setTreinoSel('') }}
        title={`Definir treino — ${modalTreino?.nome ?? ''}`}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalTreino(null)} disabled={salvandoTreino}>
              Cancelar
            </Button>
            <Button
              onClick={handleDefinirTreino}
              loading={salvandoTreino}
              disabled={!treinoSel}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-mid">
            Selecione um exercício da sua biblioteca para esta aula.
          </p>
          {treinos.length === 0 ? (
            <p className="text-xs text-gray-mid italic">
              Nenhum exercício na biblioteca. Crie exercícios na aba Treinos.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {treinos.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTreinoSel(t.id)}
                  className={[
                    'flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                    treinoSel === t.id
                      ? 'border-chumbo bg-chumbo/5 text-chumbo'
                      : 'border-black/[0.06] text-gray-dark hover:border-chumbo/30',
                  ].join(' ')}
                >
                  <div>
                    <p className="text-sm font-semibold">{t.nome}</p>
                    {t.nivel && (
                      <p className="text-[11px] text-gray-mid">{t.nivel}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
