'use client'
// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/perfil/RestricoesSaude.tsx
//
// Client Component isolado para gerenciar restrições de saúde.
// A página de perfil continua Server Component — apenas esta
// seção precisa de interatividade (modal de cadastro, encerrar).
//
// LGPD — dado sensível:
//   Restrições de saúde são exibidas apenas para o próprio aluno.
//   O professor vê durante o check-in (AgendaProfessorClient).
//   Nunca exibidas para outros alunos.
// ─────────────────────────────────────────────────────────────

import { useState }                from 'react'
import { Modal }                   from '@/components/ui/Modal'
import { Button }                  from '@/components/ui/Button'
import { Input }                   from '@/components/ui/Input'
import { Toast }                   from '@/components/ui/Toast'
import {
  declararRestricao,
  encerrarRestricao,
  type RestricaoRow,
}                                  from '@/(auth)/actions/restricoes'
import { formatDataCurta }         from '@/lib/utils'

// ── Estilos por tipo — espelha o AgendaProfessorClient ───────
const TIPO_DISPLAY = {
  pontual: { icon: '🟡', label: 'Pontual',  cor: 'bg-orange/15 text-orange-dk', bordaCor: 'border-orange/30' },
  cronica: { icon: '🔴', label: 'Crônica',  cor: 'bg-red/10 text-red',          bordaCor: 'border-red/30'    },
}

interface Props {
  restricoesIniciais: RestricaoRow[]
}

export function RestricoesSaude({ restricoesIniciais }: Props) {

  const [restricoes, setRestricoes] = useState<RestricaoRow[]>(restricoesIniciais)
  const [modalAberto, setModalAberto] = useState(false)

  // Estado do formulário
  const [tipo,           setTipo]           = useState<'pontual' | 'cronica'>('pontual')
  const [descricao,      setDescricao]      = useState('')
  const [regiaoCorporal, setRegiaoCorporal] = useState('')
  const [inicioEm,       setInicioEm]       = useState('')
  const [fimPrevisto,    setFimPrevisto]    = useState('')
  const [observacoes,    setObservacoes]    = useState('')
  const [erroForm,       setErroForm]       = useState('')
  const [salvando,       setSalvando]       = useState(false)

  // Estado de encerramento
  const [encerrando, setEncerrando] = useState<string | null>(null)

  // Toast
  const [toast,     setToast]     = useState('')
  const [showToast, setShowToast] = useState(false)
  function showMsg(msg: string) { setToast(msg); setShowToast(true) }

  function resetForm() {
    setTipo('pontual'); setDescricao(''); setRegiaoCorporal('')
    setInicioEm(''); setFimPrevisto(''); setObservacoes('')
    setErroForm('')
  }

  // ── Declarar restrição ────────────────────────────────────
  async function handleDeclararRestricao() {
    setErroForm('')
    if (!descricao.trim()) { setErroForm('Descrição é obrigatória.'); return }

    setSalvando(true)
    const result = await declararRestricao({
      tipo,
      descricao,
      regiao_corporal: regiaoCorporal || undefined,
      inicio_em:       inicioEm       || undefined,
      fim_previsto:    fimPrevisto    || undefined,
      observacoes:     observacoes    || undefined,
    })
    setSalvando(false)

    if (!result.ok) { setErroForm(result.error); return }

    // Adiciona localmente sem recarregar a página
    const nova: RestricaoRow = {
      id:             result.data.id,
      tipo,
      descricao:      descricao.trim(),
      regiaoCorporal: regiaoCorporal.trim() || null,
      ativa:          true,
      inicioEm:       inicioEm    || null,
      fimPrevisto:    fimPrevisto || null,
      observacoes:    observacoes.trim() || null,
      createdAt:      new Date().toISOString(),
    }
    setRestricoes((prev) => [nova, ...prev])
    resetForm()
    setModalAberto(false)
    showMsg('Restrição registrada. O professor será informado nas suas aulas.')
  }

  // ── Encerrar restrição ────────────────────────────────────
  async function handleEncerrar(id: string) {
    setEncerrando(id)
    const result = await encerrarRestricao(id)
    setEncerrando(null)

    if (!result.ok) { showMsg(result.error); return }

    // Remove da lista local (ativa = false → some da tela)
    setRestricoes((prev) => prev.filter((r) => r.id !== id))
    showMsg('Restrição encerrada. O professor não será mais alertado.')
  }

  return (
    <div>
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-sm font-bold text-gray-dark"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          🩺 Restrições de saúde ativas
        </p>
        <Button size="sm" onClick={() => { resetForm(); setModalAberto(true) }}>
          + Declarar
        </Button>
      </div>

      {/* Aviso de privacidade */}
      <p className="text-[11px] text-gray-mid mb-3">
        Estas informações são visíveis apenas para você e para o professor durante as aulas.
      </p>

      {/* Lista de restrições ativas */}
      {restricoes.length === 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-bg">
          <span className="text-xl opacity-50">✅</span>
          <p className="text-sm text-gray-mid">
            Nenhuma restrição ativa declarada.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {restricoes.map((r) => {
            const display  = TIPO_DISPLAY[r.tipo]
            const emEncerramento = encerrando === r.id
            return (
              <div
                key={r.id}
                className={`flex items-start gap-3 p-4 rounded-xl border bg-white ${display.bordaCor}`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{display.icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${display.cor}`}>
                      {display.label}
                    </span>
                    {r.regiaoCorporal && (
                      <span className="text-[10px] text-gray-mid">
                        📍 {r.regiaoCorporal}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-gray-dark leading-snug">
                    {r.descricao}
                  </p>

                  {r.observacoes && (
                    <p className="text-xs text-gray-mid mt-1 leading-relaxed">
                      {r.observacoes}
                    </p>
                  )}

                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    {r.inicioEm && (
                      <span className="text-[10px] text-gray-mid">
                        Desde {formatDataCurta(new Date(r.inicioEm))}
                      </span>
                    )}
                    {r.fimPrevisto && (
                      <span className="text-[10px] text-gray-mid">
                        Previsão: {formatDataCurta(new Date(r.fimPrevisto))}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleEncerrar(r.id)}
                  disabled={emEncerramento}
                  className="text-xs text-gray-mid hover:text-red transition-colors
                             flex-shrink-0 disabled:opacity-40"
                  title="Encerrar — marcar como resolvida"
                >
                  {emEncerramento ? '…' : '✕'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de nova restrição */}
      <Modal
        open={modalAberto}
        onClose={() => { setModalAberto(false); resetForm() }}
        title="Declarar restrição de saúde"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalAberto(false); resetForm() }} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={handleDeclararRestricao} loading={salvando}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">

          <p className="text-xs text-gray-mid bg-gray-bg rounded-xl p-3">
            🔒 Dado sensível — visível apenas para você e para o professor
            durante as suas aulas. Não é compartilhado com outros alunos.
          </p>

          {/* Tipo */}
          <div>
            <p className="text-xs font-bold text-gray-mid uppercase tracking-wide mb-2">
              Tipo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['pontual', 'cronica'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  disabled={salvando}
                  className={[
                    'py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50',
                    tipo === t
                      ? t === 'pontual'
                        ? 'border-orange bg-orange/10 text-orange-dk'
                        : 'border-red bg-red/8 text-red'
                      : 'border-black/[0.06] text-gray-mid',
                  ].join(' ')}
                >
                  {t === 'pontual' ? '🟡 Pontual' : '🔴 Crônica'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-mid mt-1">
              {tipo === 'pontual'
                ? 'Temporária — lesão, dor passageira ou cirurgia recente'
                : 'Permanente ou de longa duração — condição crônica'}
            </p>
          </div>

          <Input
            id="descricao"
            label="Descrição"
            placeholder="Ex: Dor no joelho direito, hérnia de disco L4-L5"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            disabled={salvando}
          />

          <Input
            id="regiao"
            label="Região corporal (opcional)"
            placeholder="Ex: Joelho direito, lombar, ombro esquerdo"
            value={regiaoCorporal}
            onChange={(e) => setRegiaoCorporal(e.target.value)}
            disabled={salvando}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="inicio"
              label="Início (opcional)"
              type="date"
              value={inicioEm}
              onChange={(e) => setInicioEm(e.target.value)}
              disabled={salvando}
            />
            <Input
              id="fim"
              label="Previsão de fim (opcional)"
              type="date"
              value={fimPrevisto}
              onChange={(e) => setFimPrevisto(e.target.value)}
              disabled={salvando}
            />
          </div>

          <Input
            id="obs"
            label="Observações para o professor (opcional)"
            placeholder="Ex: Evitar impacto, não fazer inversões"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
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
    </div>
  )
}
