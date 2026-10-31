'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/agenda/AgendaClient.tsx
//
// Client Component — toda interatividade da tela de agenda.
//
// RESPONSABILIDADES:
//   • Tira de dias dinâmica com navegação entre semanas
//   • Filtro de aulas por dia selecionado (em memória)
//   • Modal de nova aula com seletor de professor real
//   • Modal de cancelamento com campo de motivo
//   • Server Actions chamadas diretamente do client
// ─────────────────────────────────────────────────────────────

import { useState, useTransition }  from 'react'
import { PageHeader }               from '@/components/layout/PageHeader'
import { Card }                     from '@/components/ui/Card'
import { Button }                   from '@/components/ui/Button'
import { Input }                    from '@/components/ui/Input'
import { Modal }                    from '@/components/ui/Modal'
import { Toast }                    from '@/components/ui/Toast'
import { formatDataCurta }          from '@/lib/utils'
import {
  listarAulasDaSemana,
  criarAula,
  cancelarAula,
  type AulaAdminRow,
  type ProfessorSimples,
} from '@/(auth)/actions/agenda-admin'

// ── Helpers de data ───────────────────────────────────────────

// Gera os 7 dias da semana a partir da segunda-feira
function gerarDiasDaSemana(inicioISO: string) {
  const dias = []
  // T12:00:00 evita interpretação errada de timezone
  const base = new Date(`${inicioISO}T12:00:00`)
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    dias.push({
      iso:   d.toISOString().split('T')[0],
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','').toUpperCase(),
      num:   String(d.getDate()).padStart(2, '0'),
      mes:   d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.',''),
    })
  }
  return dias
}

// Formata hora de ISO timestamptz para 'HH:MM'
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour:   '2-digit',
    minute: '2-digit',
  })
}

// Cor da barra lateral por instrutor (determinística por nome)
const CORES_BARRA = ['#7A1D2C','#f27406','#211D1C','#5a1520','#BAD0D9','#BFD6A1','#3a3330','#d96604']
function corPorNome(nome: string) {
  let hash = 0
  for (const c of nome) hash = (hash * 31 + c.charCodeAt(0)) & 0xFFFFFF
  return CORES_BARRA[hash % CORES_BARRA.length]
}

// ── Props ─────────────────────────────────────────────────────

interface Props {
  aulasSemanaInicial: AulaAdminRow[]
  professores:        ProfessorSimples[]
  semanaInicial:      string   // ISO date da segunda-feira
}

// ── Componente ────────────────────────────────────────────────

export function AgendaClient({ aulasSemanaInicial, professores, semanaInicial }: Props) {

  // Estado da semana e lista de aulas
  const [semanaAtiva,   setSemanaAtiva]   = useState(semanaInicial)
  const [aulas,         setAulas]         = useState<AulaAdminRow[]>(aulasSemanaInicial)
  const [carregando,    setCarregando]    = useState(false)

  // Dia selecionado na tira — inicia no hoje ou na segunda da semana
  const diasDaSemana = gerarDiasDaSemana(semanaAtiva)
  const hojeISO      = new Date().toISOString().split('T')[0]
  const diaInicial   = diasDaSemana.find((d) => d.iso === hojeISO)?.iso ?? diasDaSemana[0].iso
  const [diaSelecionado, setDiaSelecionado] = useState(diaInicial)

  // Estado do modal de nova aula
  const [modalNova,     setModalNova]     = useState(false)
  const [formNome,      setFormNome]      = useState('')
  const [formEmoji,     setFormEmoji]     = useState('🎪')
  const [formProf,      setFormProf]      = useState('')
  const [formLocal,     setFormLocal]     = useState('')
  const [formData,      setFormData]      = useState(hojeISO)
  const [formInicio,    setFormInicio]    = useState('09:00')
  const [formFim,       setFormFim]       = useState('10:00')
  const [formVagas,     setFormVagas]     = useState('12')
  const [erroModal,     setErroModal]     = useState('')
  const [salvando,      setSalvando]      = useState(false)

  // Estado do modal de cancelamento
  const [modalCancelar,     setModalCancelar]     = useState(false)
  const [aulaCancelar,      setAulaCancelar]      = useState<AulaAdminRow | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [cancelando,        setCancelando]        = useState(false)

  // Toast
  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)
  const [, startTransition]       = useTransition()

  function showMsg(msg: string) { setToast(msg); setShowToast(true) }

  // ── Navegação entre semanas ────────────────────────────────
  async function handleSemana(direcao: 'anterior' | 'proxima') {
    const base = new Date(`${semanaAtiva}T12:00:00`)
    base.setDate(base.getDate() + (direcao === 'proxima' ? 7 : -7))
    const novoInicio = base.toISOString().split('T')[0]
    const novoFim    = new Date(base)
    novoFim.setDate(base.getDate() + 6)
    const novoFimISO = novoFim.toISOString().split('T')[0]

    setSemanaAtiva(novoInicio)
    setDiaSelecionado(novoInicio) // reseta para segunda da nova semana
    setCarregando(true)

    // Server Action chamada do Client Component —
    // executa no servidor, dados não aparecem no DevTools como query HTTP
    const resultado = await listarAulasDaSemana(novoInicio, novoFimISO)
    if (resultado.ok) setAulas(resultado.data)
    setCarregando(false)
  }

  // ── Filtro em memória por dia selecionado ──────────────────
  // ISO timestamptz '2026-07-30T09:00:00' começa com o ISO date
  // → startsWith é suficiente para filtrar por dia sem nova query
  const aulasDoDia = aulas
    .filter((a) => a.inicio.startsWith(diaSelecionado))
    .sort((a, b) => a.inicio.localeCompare(b.inicio))

  // ── Criar aula ─────────────────────────────────────────────
  async function handleCriarAula() {
    setErroModal('')

    if (!formNome.trim()) return setErroModal('Nome da aula é obrigatório.')
    if (!formProf)        return setErroModal('Selecione um professor.')
    if (!formData)        return setErroModal('Informe a data.')
    if (!formInicio || !formFim) return setErroModal('Informe os horários.')
    const vagasNum = parseInt(formVagas)
    if (isNaN(vagasNum) || vagasNum < 1) return setErroModal('Vagas deve ser pelo menos 1.')

    // Monta datetime ISO completo para o banco
    const inicioISO = `${formData}T${formInicio}:00`
    const fimISO    = `${formData}T${formFim}:00`

    setSalvando(true)
    const resultado = await criarAula({
      nome:        formNome.trim(),
      emoji:       formEmoji.trim() || undefined,
      instrutorId: formProf,
      local:       formLocal.trim() || undefined,
      inicio:      inicioISO,
      fim:         fimISO,
      vagas:       vagasNum,
    })
    setSalvando(false)

    if (!resultado.ok) { setErroModal(resultado.error); return }

    // Rebusca a semana atual para incluir a nova aula
    const novoFim = new Date(`${semanaAtiva}T12:00:00`)
    novoFim.setDate(novoFim.getDate() + 6)
    const lista = await listarAulasDaSemana(semanaAtiva, novoFim.toISOString().split('T')[0])
    if (lista.ok) setAulas(lista.data)

    setModalNova(false)
    setFormNome(''); setFormEmoji('🎪'); setFormProf('')
    setFormLocal(''); setFormInicio('09:00'); setFormFim('10:00')
    setFormVagas('12')
    showMsg('Aula criada com sucesso.')
  }

  // ── Cancelar aula ─────────────────────────────────────────
  async function handleCancelar() {
    if (!aulaCancelar) return

    setCancelando(true)
    const resultado = await cancelarAula(aulaCancelar.id, motivoCancelamento)
    setCancelando(false)

    if (!resultado.ok) { showMsg(resultado.error); return }

    // Remove da lista local imediatamente — UX responsiva
    setAulas((prev) => prev.filter((a) => a.id !== aulaCancelar.id))
    setModalCancelar(false)
    setAulaCancelar(null)
    setMotivoCancelamento('')
    showMsg(`Aula "${aulaCancelar.nome}" cancelada.`)
  }

  // ── Render ─────────────────────────────────────────────────

  const semanaLabel = (() => {
    const ini = new Date(`${semanaAtiva}T12:00:00`)
    const fim = new Date(ini)
    fim.setDate(ini.getDate() + 6)
    return `${formatDataCurta(ini)} – ${formatDataCurta(fim)}`
  })()

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={`Semana de ${semanaLabel}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSemana('anterior')} disabled={carregando}>‹ Anterior</Button>
            <Button variant="outline" onClick={() => handleSemana('proxima')}  disabled={carregando}>Próxima ›</Button>
            <Button onClick={() => setModalNova(true)}>+ Nova aula</Button>
          </div>
        }
      />

      {/* Tira de dias */}
      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-sm px-5 py-4 mb-5 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {diasDaSemana.map((d) => {
            const ativo   = d.iso === diaSelecionado
            const qtdAulas = aulas.filter((a) => a.inicio.startsWith(d.iso)).length
            return (
              <button
                key={d.iso}
                onClick={() => setDiaSelecionado(d.iso)}
                disabled={carregando}
                className="flex flex-col items-center px-5 py-2.5 rounded-xl transition-all
                           disabled:opacity-50 relative"
                style={
                  ativo
                    ? { background: 'linear-gradient(135deg,#c45e00,#f27406)', color: '#F4E7CE' }
                    : { background: 'transparent', color: '#211D1C' }
                }
              >
                <span
                  className="text-[10px] font-bold uppercase"
                  style={{ color: ativo ? 'rgba(244,231,206,.7)' : '#8a7d70' }}
                >
                  {d.label} {d.mes}
                </span>
                <span
                  className="text-xl font-extrabold leading-none mt-0.5"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  {d.num}
                </span>
                {/* Badge com contagem de aulas do dia */}
                {qtdAulas > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px]
                               font-bold flex items-center justify-center"
                    style={{
                      background: ativo ? 'rgba(255,255,255,.3)' : '#f27406',
                      color:      ativo ? '#F4E7CE' : '#fff',
                    }}
                  >
                    {qtdAulas}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Aulas do dia */}
      {carregando ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 rounded-full border-2 border-orange border-t-transparent animate-spin" />
        </div>
      ) : aulasDoDia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl opacity-30">📅</span>
          <p className="text-sm text-gray-mid">Nenhuma aula agendada para este dia.</p>
          <Button size="sm" onClick={() => setModalNova(true)}>+ Criar aula para este dia</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {aulasDoDia.map((a) => {
            const cor    = corPorNome(a.instrutorNome)
            const pct    = Math.round((a.inscritos / a.vagas) * 100)
            const lotada = a.inscritos >= a.vagas

            return (
              <Card key={a.id} padding="none">
                <div className="flex items-stretch">
                  {/* Barra lateral colorida — cor determinística por professor */}
                  <div
                    className="w-1.5 rounded-l-2xl flex-shrink-0"
                    style={{ background: cor }}
                  />

                  <div className="flex-1 p-5 flex items-center gap-5 flex-wrap">
                    {/* Horário */}
                    <div className="flex-shrink-0 w-20">
                      <p
                        className="text-lg font-extrabold leading-none"
                        style={{ color: cor, fontFamily: 'var(--font-montserrat)' }}
                      >
                        {formatHora(a.inicio)}
                      </p>
                      <p className="text-[11px] text-gray-mid mt-0.5">
                        até {formatHora(a.fim)}
                      </p>
                    </div>

                    <div className="w-px h-10 bg-black/8 flex-shrink-0" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-bold text-gray-dark"
                        style={{ fontFamily: 'var(--font-montserrat)' }}
                      >
                        {a.emoji ?? '🎪'} {a.nome}
                      </p>
                      <div className="flex gap-4 mt-1 flex-wrap">
                        <span className="text-xs text-gray-mid">👤 {a.instrutorNome}</span>
                        {a.local && (
                          <span className="text-xs text-gray-mid">📍 {a.local}</span>
                        )}
                      </div>
                    </div>

                    {/* Ocupação */}
                    <div className="flex-shrink-0 min-w-[140px]">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-mid">Ocupação</span>
                        <span className="font-bold text-gray-dark">
                          {a.inscritos}/{a.vagas}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-bg overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width:      `${Math.min(pct, 100)}%`,
                            background: lotada ? '#C0392B' : cor,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-mid mt-1">
                        {pct}% ocupado{lotada ? ' · Lotada' : ''}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setAulaCancelar(a)
                          setMotivoCancelamento('')
                          setModalCancelar(true)
                        }}
                      >
                        Cancelar aula
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de nova aula */}
      <Modal
        open={modalNova}
        onClose={() => { setModalNova(false); setErroModal('') }}
        title="Nova aula"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalNova(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={handleCriarAula} loading={salvando}>
              Salvar aula
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">

          <div className="grid grid-cols-[1fr_80px] gap-3">
            <Input
              id="nome"
              label="Nome da aula"
              placeholder="Ex: Tecido Circense"
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              disabled={salvando}
            />
            <Input
              id="emoji"
              label="Emoji"
              placeholder="🎪"
              value={formEmoji}
              onChange={(e) => setFormEmoji(e.target.value)}
              disabled={salvando}
            />
          </div>

          {/* Seletor de professor — dados reais do banco */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
              Professor
            </p>
            <select
              value={formProf}
              onChange={(e) => setFormProf(e.target.value)}
              disabled={salvando}
              className="w-full text-sm border border-black/[0.08] rounded-xl px-3 py-3
                         bg-white text-gray-dark outline-none focus:border-orange
                         disabled:opacity-50"
            >
              <option value="">Selecione…</option>
              {professores.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            {professores.length === 0 && (
              <p className="text-[11px] text-gray-mid mt-1">
                Nenhum professor cadastrado. Crie usuários com role "Professor" primeiro.
              </p>
            )}
          </div>

          <Input
            id="local"
            label="Local (opcional)"
            placeholder="Ex: Studio A"
            value={formLocal}
            onChange={(e) => setFormLocal(e.target.value)}
            disabled={salvando}
          />

          <Input
            id="data"
            label="Data"
            type="date"
            value={formData}
            onChange={(e) => setFormData(e.target.value)}
            disabled={salvando}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="inicio"
              label="Início"
              type="time"
              value={formInicio}
              onChange={(e) => setFormInicio(e.target.value)}
              disabled={salvando}
            />
            <Input
              id="fim"
              label="Término"
              type="time"
              value={formFim}
              onChange={(e) => setFormFim(e.target.value)}
              disabled={salvando}
            />
          </div>

          <Input
            id="vagas"
            label="Vagas"
            type="number"
            placeholder="Ex: 12"
            value={formVagas}
            onChange={(e) => setFormVagas(e.target.value)}
            disabled={salvando}
          />

          {erroModal && (
            <div
              className="px-4 py-3 rounded-xl border text-xs font-semibold"
              style={{
                background:  'rgba(192,57,43,0.06)',
                borderColor: 'rgba(192,57,43,0.25)',
                color:       '#922b21',
              }}
            >
              {erroModal}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de cancelamento */}
      <Modal
        open={modalCancelar}
        onClose={() => setModalCancelar(false)}
        title={`Cancelar aula — ${aulaCancelar?.nome ?? ''}`}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalCancelar(false)} disabled={cancelando}>
              Voltar
            </Button>
            <Button variant="danger" onClick={handleCancelar} loading={cancelando}>
              Confirmar cancelamento
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-mid">
            Esta ação não pode ser desfeita. A aula ficará marcada como cancelada no histórico.
          </p>
          <Input
            id="motivo"
            label="Motivo (opcional)"
            placeholder="Ex: Queda de energia no studio"
            value={motivoCancelamento}
            onChange={(e) => setMotivoCancelamento(e.target.value)}
            disabled={cancelando}
          />
        </div>
      </Modal>

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
