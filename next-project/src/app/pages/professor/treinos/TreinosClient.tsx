'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/treinos/TreinosClient.tsx
//
// Client Component — substitui dados demo por dados reais.
// Mantém a UX original (filtros por valência, modal de detalhes)
// e adiciona: formulário real de cadastro, edição e exclusão.
// ─────────────────────────────────────────────────────────────

import { useState, useTransition }  from 'react'
import { useRouter }                from 'next/navigation'
import { PageHeader }               from '@/components/layout/PageHeader'
import { Card }                     from '@/components/ui/Card'
import { Button }                   from '@/components/ui/Button'
import { Chip }                     from '@/components/ui/Chip'
import { Input }                    from '@/components/ui/Input'
import { Modal }                    from '@/components/ui/Modal'
import { Toast }                    from '@/components/ui/Toast'
import {
  criarTreino,
  atualizarTreino,
  excluirTreino,
  vincularHabilidade,
  desvincularHabilidade,
  type TreinoRow,
  type HabilidadeSimples,
  type CriarTreinoInput,
} from '@/(auth)/actions/treinos'
import { VALENCIAS, GRUPOS_MUSCULARES, NIVEIS } from '@/lib/constants'

// ── Constantes visuais ─────────────────────────────────────────

const VALENCIAS_FILTRO = ['Todos', ...VALENCIAS]

const NIVEL_COR: Record<string, string> = {
  Iniciante:     'bg-green-light/40 text-chumbo',
  Intermediário: 'bg-orange/15 text-orange-dk',
  Avançado:      'bg-red/10 text-red',
}

// ── Props ──────────────────────────────────────────────────────

interface Props {
  treinos:      TreinoRow[]
  habilidades:  HabilidadeSimples[]
}

// ── Estado inicial do formulário ──────────────────────────────

const FORM_VAZIO: CriarTreinoInput = {
  nome:       '',
  objetivo:   '',
  valencias:  [],
  musculos:   [],
  nivel:      null,
  series:     '',
  obs:        '',
}

export function TreinosClient({ treinos: treinosIniciais, habilidades }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // ── Estado de treinos e filtros ────────────────────────────
  const [treinos,       setTreinos]       = useState<TreinoRow[]>(treinosIniciais)
  const [filtroValencia, setFiltroValencia] = useState('Todos')

  // ── Modais ─────────────────────────────────────────────────
  const [detalhe,       setDetalhe]       = useState<TreinoRow | null>(null)
  const [modalForm,     setModalForm]     = useState(false)
  const [editando,      setEditando]      = useState<TreinoRow | null>(null)

  // ── Formulário ─────────────────────────────────────────────
  const [form,          setForm]          = useState<CriarTreinoInput>(FORM_VAZIO)
  const [erroForm,      setErroForm]      = useState('')
  const [salvando,      setSalvando]      = useState(false)
  const [excluindo,     setExcluindo]     = useState(false)

  // ── Toast ─────────────────────────────────────────────────
  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)
  function showMsg(msg: string) { setToast(msg); setShowToast(true) }

  // ── Filtro em memória ──────────────────────────────────────
  const trenosFiltrados = filtroValencia === 'Todos'
    ? treinos
    : treinos.filter((t) => t.valencias.includes(filtroValencia))

  // Agrupa por modalidade (via habilidades vinculadas)
  // Treinos sem habilidade vinculada ficam em "Geral"
  const porModalidade = trenosFiltrados.reduce<Record<string, TreinoRow[]>>(
    (acc, t) => {
      const mod = t.habilidades[0]?.nome ? 'Com habilidades' : 'Geral'
      if (!acc[mod]) acc[mod] = []
      acc[mod].push(t)
      return acc
    },
    {}
  )

  // ── Abrir formulário de criação ────────────────────────────
  function abrirCriacao() {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErroForm('')
    setModalForm(true)
  }

  // ── Abrir formulário de edição ─────────────────────────────
  function abrirEdicao(t: TreinoRow) {
    setEditando(t)
    setForm({
      nome:      t.nome,
      objetivo:  t.objetivo   ?? '',
      valencias: t.valencias,
      musculos:  t.musculos,
      nivel:     t.nivel,
      series:    t.series     ?? '',
      obs:       t.obs        ?? '',
    })
    setErroForm('')
    setDetalhe(null)    // fecha o modal de detalhe
    setModalForm(true)
  }

  // ── Toggle de chip multisseleção ───────────────────────────
  function toggleChip(
    campo: 'valencias' | 'musculos',
    valor: string
  ) {
    setForm((prev) => {
      const lista = prev[campo] as string[]
      return {
        ...prev,
        [campo]: lista.includes(valor)
          ? lista.filter((v) => v !== valor)
          : [...lista, valor],
      }
    })
  }

  // ── Salvar (criar ou editar) ───────────────────────────────
  async function handleSalvar() {
    setErroForm('')
    if (!form.nome?.trim()) { setErroForm('Nome do exercício é obrigatório.'); return }

    setSalvando(true)

    if (editando) {
      const result = await atualizarTreino(editando.id, form)
      setSalvando(false)
      if (!result.ok) { setErroForm(result.error); return }

      // Atualiza o item no estado local sem router.refresh()
      setTreinos((prev) => prev.map((t) =>
        t.id === editando.id
          ? { ...t, ...form, habilidades: t.habilidades }
          : t
      ))
      showMsg(`Exercício "${form.nome}" atualizado.`)

    } else {
      const result = await criarTreino(form)
      setSalvando(false)
      if (!result.ok) { setErroForm(result.error); return }

      // Rebusca a lista atualizada via router.refresh()
      startTransition(() => router.refresh())
      showMsg(`Exercício "${form.nome}" criado com sucesso.`)
    }

    setModalForm(false)
    setEditando(null)
    setForm(FORM_VAZIO)
  }

  // ── Excluir ────────────────────────────────────────────────
  async function handleExcluir(t: TreinoRow) {
    setExcluindo(true)
    const result = await excluirTreino(t.id)
    setExcluindo(false)

    if (!result.ok) { showMsg(result.error); return }

    setTreinos((prev) => prev.filter((x) => x.id !== t.id))
    setDetalhe(null)
    showMsg(`Exercício "${t.nome}" excluído.`)
  }

  // ── Toggle de habilidade no detalhe ───────────────────────
  async function handleToggleHabilidade(
    treino:       TreinoRow,
    habilidadeId: string,
    vinculado:    boolean
  ) {
    const result = vinculado
      ? await desvincularHabilidade(treino.id, habilidadeId)
      : await vincularHabilidade(treino.id, habilidadeId)

    if (!result.ok) { showMsg(result.error); return }

    // Atualiza localmente
    setTreinos((prev) => prev.map((t) => {
      if (t.id !== treino.id) return t
      const hab = habilidades.find((h) => h.id === habilidadeId)!
      const novas = vinculado
        ? t.habilidades.filter((h) => h.id !== habilidadeId)
        : [...t.habilidades, { id: hab.id, nome: hab.nome, emoji: hab.emoji }]
      return { ...t, habilidades: novas }
    }))

    // Atualiza o detalhe aberto
    setDetalhe((prev) => {
      if (!prev || prev.id !== treino.id) return prev
      const hab = habilidades.find((h) => h.id === habilidadeId)!
      const novas = vinculado
        ? prev.habilidades.filter((h) => h.id !== habilidadeId)
        : [...prev.habilidades, { id: hab.id, nome: hab.nome, emoji: hab.emoji }]
      return { ...prev, habilidades: novas }
    })
  }

  return (
    <>
      <PageHeader
        title="Biblioteca de Treinos 🏋️"
        subtitle={`${treinos.length} exercício${treinos.length !== 1 ? 's' : ''} cadastrado${treinos.length !== 1 ? 's' : ''} — filtre por valência.`}
        actions={<Button onClick={abrirCriacao}>+ Novo exercício</Button>}
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
              active={filtroValencia === v}
              onClick={() => setFiltroValencia(v)}
            />
          ))}
        </div>
      </div>

      {/* Estado vazio */}
      {treinos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl opacity-30">🏋️</span>
          <p className="text-sm text-gray-mid">Nenhum exercício cadastrado ainda.</p>
          <Button size="sm" onClick={abrirCriacao}>Criar primeiro exercício</Button>
        </div>
      ) : trenosFiltrados.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-3xl opacity-30">🔍</span>
            <p className="text-sm text-gray-mid">Nenhum exercício com a valência "{filtroValencia}".</p>
            <Button size="sm" variant="secondary" onClick={() => setFiltroValencia('Todos')}>
              Ver todos
            </Button>
          </div>
        </Card>
      ) : (
        Object.entries(porModalidade).map(([grupo, lista]) => (
          <div key={grupo} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h3
                className="text-sm font-bold text-gray-dark"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {grupo}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-bg text-gray-mid">
                {lista.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lista.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDetalhe(t)}
                  className="text-left bg-white rounded-2xl border border-black/[0.04]
                             shadow-sm p-4 hover:border-chumbo/20 hover:shadow-md
                             hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p
                      className="text-sm font-bold text-gray-dark group-hover:text-chumbo
                                 transition-colors leading-tight"
                      style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                      {t.nome}
                    </p>
                    {t.nivel && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${NIVEL_COR[t.nivel]}`}>
                        {t.nivel}
                      </span>
                    )}
                  </div>

                  {t.objetivo && (
                    <p className="text-xs text-gray-mid leading-relaxed mb-2 line-clamp-2">
                      {t.objetivo}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {t.valencias.map((v) => (
                      <span
                        key={v}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          v === filtroValencia && filtroValencia !== 'Todos'
                            ? 'bg-chumbo text-off-white'
                            : 'bg-gray-bg text-gray-mid'
                        }`}
                      >
                        {v}
                      </span>
                    ))}
                  </div>

                  {t.series && (
                    <p className="text-[10px] text-gray-mid mt-2 pt-2 border-t border-gray-bg">
                      📊 {t.series}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal de detalhes */}
      <Modal
        open={!!detalhe}
        onClose={() => setDetalhe(null)}
        title={detalhe?.nome ?? ''}
        maxWidth="max-w-lg"
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="danger"
              size="sm"
              onClick={() => detalhe && handleExcluir(detalhe)}
              loading={excluindo}
            >
              🗑️ Excluir
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => setDetalhe(null)}>Fechar</Button>
            <Button onClick={() => detalhe && abrirEdicao(detalhe)}>✏️ Editar</Button>
          </div>
        }
      >
        {detalhe && (
          <div className="flex flex-col gap-4">
            {detalhe.nivel && (
              <span className={`self-start text-xs font-bold px-3 py-1 rounded-full ${NIVEL_COR[detalhe.nivel]}`}>
                {detalhe.nivel}
              </span>
            )}

            {detalhe.objetivo && (
              <div className="bg-gray-bg rounded-xl p-4">
                <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-1">Objetivo</p>
                <p className="text-sm text-gray-dark leading-relaxed">{detalhe.objetivo}</p>
              </div>
            )}

            {detalhe.series && (
              <div className="flex items-center gap-3 bg-chumbo/5 rounded-xl p-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="text-[10px] font-bold text-gray-mid uppercase tracking-wide">Séries / Repetições</p>
                  <p className="text-sm font-bold text-chumbo">{detalhe.series}</p>
                </div>
              </div>
            )}

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
            {detalhe.valencias.length > 0 && (
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
            )}

            {/* Habilidades vinculadas */}
            <div>
              <p className="text-[10px] font-bold text-gray-mid uppercase tracking-wide mb-2">
                Habilidades desenvolvidas
              </p>
              <div className="flex flex-wrap gap-2">
                {habilidades.map((h) => {
                  const vinculado = detalhe.habilidades.some((dh) => dh.id === h.id)
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleToggleHabilidade(detalhe, h.id, vinculado)}
                      className={[
                        'text-xs font-semibold px-3 py-1 rounded-full transition-all',
                        vinculado
                          ? 'bg-chumbo text-off-white'
                          : 'bg-gray-bg text-gray-mid hover:bg-chumbo/10',
                      ].join(' ')}
                    >
                      {h.emoji} {h.nome}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-gray-mid mt-1">
                Clique para vincular / desvincular
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de formulário (criar / editar) */}
      <Modal
        open={modalForm}
        onClose={() => { setModalForm(false); setEditando(null) }}
        title={editando ? `Editar — ${editando.nome}` : 'Novo exercício'}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalForm(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={salvando}>
              {editando ? 'Salvar alterações' : 'Criar exercício'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            id="nome"
            label="Nome do exercício"
            placeholder="Ex: Arabesque no tecido"
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            disabled={salvando}
          />

          <Input
            id="objetivo"
            label="Objetivo (opcional)"
            placeholder="Ex: Desenvolver flexibilidade da coluna"
            value={form.objetivo ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, objetivo: e.target.value }))}
            disabled={salvando}
          />

          {/* Nível */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">Nível</p>
            <div className="flex gap-2">
              {(['Iniciante', 'Intermediário', 'Avançado'] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, nivel: n }))}
                  disabled={salvando}
                  className={[
                    'px-3 py-1.5 rounded-xl border text-xs font-bold transition-all',
                    'disabled:opacity-50',
                    form.nivel === n
                      ? NIVEL_COR[n].replace('bg-', 'bg-').replace('/40', '').replace('/15', '').replace('/10', '')
                      : 'border-black/[0.06] text-gray-mid',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Valências */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">Valências</p>
            <div className="flex flex-wrap gap-2">
              {VALENCIAS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleChip('valencias', v)}
                  disabled={salvando}
                  className={[
                    'px-3 py-1 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50',
                    (form.valencias ?? []).includes(v)
                      ? 'border-chumbo bg-chumbo text-off-white'
                      : 'border-black/[0.06] text-gray-mid',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Grupos musculares */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">Grupos musculares</p>
            <div className="flex flex-wrap gap-2">
              {GRUPOS_MUSCULARES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleChip('musculos', g)}
                  disabled={salvando}
                  className={[
                    'px-3 py-1 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50',
                    (form.musculos ?? []).includes(g)
                      ? 'border-orange bg-orange/10 text-orange-dk'
                      : 'border-black/[0.06] text-gray-mid',
                  ].join(' ')}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <Input
            id="series"
            label="Séries / Repetições (opcional)"
            placeholder="Ex: 3 × 20s cada lado"
            value={form.series ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, series: e.target.value }))}
            disabled={salvando}
          />

          <Input
            id="obs"
            label="Observação de segurança (opcional)"
            placeholder="Ex: Aquecer coluna 10 min antes"
            value={form.obs ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, obs: e.target.value }))}
            disabled={salvando}
          />

          {erroForm && (
            <div
              className="px-4 py-3 rounded-xl border text-xs font-semibold"
              style={{
                background:  'rgba(192,57,43,0.06)',
                borderColor: 'rgba(192,57,43,0.25)',
                color:       '#922b21',
              }}
            >
              {erroForm}
            </div>
          )}
        </div>
      </Modal>

      <Toast message={toast} show={showToast} onHide={() => setShowToast(false)} />
    </>
  )
}
