'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/home/AlunoHomeClient.tsx
// Atualizado na 3D.3: placeholders substituídos pelas actions reais.
// ─────────────────────────────────────────────────────────────

import { useState }      from 'react'
import { useRouter }     from 'next/navigation'
import { PageHeader }    from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Toast }         from '@/components/ui/Toast'
import { inscreverAluno, avaliarAula } from '@/(auth)/actions/inscricoes'

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function formatDiaSemana(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()
}
function formatDia(iso: string) {
  return String(new Date(iso).getDate()).padStart(2, '0')
}
function statusDaAula(inicio: string, presente: boolean): { label: string; cor: string } {
  const d   = new Date(inicio)
  const now = new Date()
  if (presente)                                 return { label: '✓ Presente', cor: 'bg-green-light/40 text-chumbo' }
  if (d < now)                                  return { label: 'Ausente',    cor: 'bg-red/10 text-red'            }
  if (d.toDateString() === now.toDateString())  return { label: 'Hoje',       cor: 'bg-bordo/10 text-bordo'        }
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
  return { label: `Em ${diff}d`, cor: 'bg-gray-bg text-gray-mid' }
}
function calcularNivel(xp: number) {
  if (xp >= 500) return 5
  if (xp >= 200) return 4
  if (xp >= 100) return 3
  if (xp >=  50) return 2
  return 1
}

interface MinhaAula {
  inscricaoId: string; aulaId: string; nome: string; emoji: string | null
  inicio: string; local: string | null; instrutor: string | null; presente: boolean
}
interface AulaDisponivel {
  id: string; nome: string; emoji: string | null; inicio: string
  local: string | null; vagas: number; inscritos: number; vagasLivres: number
}
interface AulaPendente {
  inscricaoId: string; aulaId: string; nome: string
  emoji: string | null; inicio: string; local: string | null
}
interface Props {
  profile: { nome: string; xpTotal: number }
  minhasAulas:      MinhaAula[]
  aulasDisponiveis: AulaDisponivel[]
  aulaPendente:     AulaPendente | null
  metricas: { taxaPresenca: number; totalHabilidades: number; posicaoRanking: number; totalAlunos: number; mesLabel: string }
}

export function AlunoHomeClient({ profile, minhasAulas, aulasDisponiveis, aulaPendente, metricas }: Props) {
  const router = useRouter()

  const [estrelas,       setEstrelas]       = useState(0)
  const [estrelasHover,  setEstrelasHover]  = useState(0)
  const [avaliacaoFeita, setAvaliacaoFeita] = useState(false)
  const [enviandoAv,     setEnviandoAv]     = useState(false)
  const [inscrevendo,    setInscrevendo]    = useState<string | null>(null)
  const [toast,          setToast]          = useState('')
  const [showToast,      setShowToast]      = useState(false)
  function showMsg(msg: string) { setToast(msg); setShowToast(true) }

  const nivel = calcularNivel(profile.xpTotal)

  // ── Avaliação com Server Action real ─────────────────────
  async function handleAvaliar() {
    if (!estrelas || !aulaPendente) return
    setEnviandoAv(true)
    const result = await avaliarAula(aulaPendente.inscricaoId, estrelas)
    setEnviandoAv(false)
    if (!result.ok) { showMsg(result.error); return }
    setAvaliacaoFeita(true)
    showMsg(`+XP ganho! Obrigado por avaliar "${aulaPendente.nome}".`)
  }

  // ── Inscrição com Server Action real ──────────────────────
  async function handleInscrever(aulaId: string) {
    setInscrevendo(aulaId)
    const result = await inscreverAluno(aulaId)
    setInscrevendo(null)
    if (!result.ok) { showMsg(result.error); return }
    showMsg(result.data.listaEspera ? 'Adicionado à lista de espera.' : 'Inscrição realizada!')
    router.refresh()
  }

  const metricsCards = [
    { valor: `${metricas.taxaPresenca}%`, label: `Presença ${metricas.mesLabel}`, cor: metricas.taxaPresenca >= 75 ? 'text-bordo' : 'text-orange-dk' },
    { valor: String(metricas.totalHabilidades), label: 'Habilidades', cor: 'text-orange-dk' },
    { valor: String(profile.xpTotal), label: 'XP Total', cor: 'text-chumbo' },
    { valor: metricas.posicaoRanking > 0 ? `${metricas.posicaoRanking}°` : '—', label: 'No ranking', cor: 'text-gray-dark' },
  ]

  return (
    <>
      <PageHeader
        title={`Bem-vindo(a), ${profile.nome.split(' ')[0]} 🤸`}
        subtitle={`Nível ${nivel} · ${profile.xpTotal} XP acumulados`}
      />

      {/* Slot de avaliação */}
      {aulaPendente && !avaliacaoFeita && (
        <div className="mb-6 p-4 rounded-2xl border-[1.5px] border-orange bg-off-white/60">
          <p className="text-sm font-bold text-gray-dark mb-1">⭐ Avalie sua última aula e ganhe XP</p>
          <p className="text-xs text-gray-mid mb-3">
            {aulaPendente.emoji} {aulaPendente.nome}
            {aulaPendente.local ? ` · ${aulaPendente.local}` : ''}
            {' · '}{new Date(aulaPendente.inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setEstrelas(s)}
                onMouseEnter={() => setEstrelasHover(s)} onMouseLeave={() => setEstrelasHover(0)}
                className="text-2xl transition-transform hover:scale-110 select-none"
                style={{ color: '#f27406' }}>
                {s <= (estrelasHover || estrelas) ? '★' : '☆'}
              </button>
            ))}
            {estrelas > 0 ? (
              <button onClick={handleAvaliar} disabled={enviandoAv}
                className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-orange text-off-white
                           hover:bg-orange-dk transition-colors disabled:opacity-50">
                {enviandoAv ? 'Enviando…' : '+XP Enviar'}
              </button>
            ) : (
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-orange text-off-white">+XP</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 mb-5">
        {/* Minhas aulas */}
        <Card>
          <CardTitle>Minhas aulas esta semana</CardTitle>
          {minhasAulas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-3xl opacity-30">📅</span>
              <p className="text-sm text-gray-mid">Nenhuma aula inscrita esta semana.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {minhasAulas.map((a) => {
                const { label, cor } = statusDaAula(a.inicio, a.presente)
                return (
                  <div key={a.inscricaoId} className="flex items-center gap-4 bg-gray-bg rounded-xl p-3.5">
                    <div className="text-center flex-shrink-0 w-10">
                      <p className="text-[10px] font-bold text-gray-mid uppercase">{formatDiaSemana(a.inicio)}</p>
                      <p className="text-xl font-extrabold text-gray-dark leading-none" style={{ fontFamily: 'var(--font-montserrat)' }}>{formatDia(a.inicio)}</p>
                    </div>
                    <div className="w-px h-9 bg-black/8 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-dark truncate">{a.emoji ?? '🎪'} {a.nome}</p>
                      <p className="text-xs text-gray-mid mt-0.5 truncate">
                        {formatHora(a.inicio)}{a.local ? ` · ${a.local}` : ''}{a.instrutor ? ` · ${a.instrutor}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${cor}`}>{label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Progresso */}
        <Card>
          <CardTitle>Meu progresso</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            {metricsCards.map(({ valor, label, cor }) => (
              <div key={label} className="bg-gray-bg rounded-xl p-3.5 text-center">
                <p className={`text-2xl font-extrabold ${cor}`} style={{ fontFamily: 'var(--font-montserrat)' }}>{valor}</p>
                <p className="text-[10px] text-gray-mid mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Disponíveis */}
      <Card>
        <CardTitle>Disponíveis para você</CardTitle>
        {aulasDisponiveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <span className="text-3xl opacity-30">🎪</span>
            <p className="text-sm text-gray-mid">Nenhuma aula disponível esta semana.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {aulasDisponiveis.map((d) => {
              const lotada     = d.vagasLivres === 0
              const carregando = inscrevendo === d.id
              return (
                <div key={d.id} className="border-[1.5px] border-black/[0.06] rounded-2xl p-4
                                            flex flex-col gap-3 hover:border-bordo/25 hover:shadow-md transition-all">
                  <span className="text-3xl">{d.emoji ?? '🎪'}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-dark">{d.nome}</p>
                    <p className="text-xs text-gray-mid mt-0.5">
                      {formatDiaSemana(d.inicio)} · {formatHora(d.inicio)}
                      {' · '}{lotada ? 'Lotada' : `${d.vagasLivres} vagas`}
                    </p>
                  </div>
                  <button onClick={() => !lotada && handleInscrever(d.id)} disabled={lotada || carregando}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      lotada ? 'bg-gray-bg text-gray-mid cursor-not-allowed'
                        : carregando ? 'bg-bordo/60 text-off-white cursor-wait'
                        : 'bg-bordo text-off-white hover:bg-bordo-dk'
                    }`}>
                    {carregando ? 'Inscrevendo…' : lotada ? 'Lista de espera' : 'Inscrever-se'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
