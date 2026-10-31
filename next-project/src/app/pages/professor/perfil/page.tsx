// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/perfil/page.tsx
//
// Server Component puro — sem 'use client', sem useState.
// Perfil é leitura pura: dados pessoais, modalidades e resumo
// financeiro do mês. Sem interatividade, sem JS no bundle.
//
// QUATRO FONTES DE DADOS EM PARALELO:
//   1. requireAuth()                    → dados pessoais do profile
//   2. professor_modalidades            → especialidades ativas
//   3. turmas (COUNT)                   → turmas ativas do professor
//   4. listarPagamentosProfessor(mes)   → resumo financeiro do mês
// ─────────────────────────────────────────────────────────────

import { requireAuth }               from '@/(auth)/session'
import { createClient }              from '@/lib/supabase/server'
import { listarPagamentosProfessor } from '@/(auth)/actions/pagamentos-professor'
import { PageHeader }                from '@/components/layout/PageHeader'
import { Card }                      from '@/components/ui/Card'
import { iniciais, avatarColorByName, formatBRL, formatDataCurta } from '@/lib/utils'
import { VALOR_AULA_ALTO, VALOR_AULA_BAIXO, THRESHOLD_PRESENCAS } from '@/lib/constants'

export const metadata = { title: 'Perfil — Professor Andorin' }

export default async function ProfessorPerfilPage() {

  const profile  = await requireAuth()
  const supabase = await createClient()
  const mesAtual = new Date().toISOString().substring(0, 7)   // 'YYYY-MM'
  const mesLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const mesCapitalizado = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1)

  // ── Três queries em paralelo ────────────────────────────────
  const [modalidadesResult, turmasResult, pagamentosResult] = await Promise.all([

    // Modalidades ativas do professor (RLS filtra por professor_id automaticamente)
    supabase
      .from('professor_modalidades')
      .select('modalidade')
      .eq('professor_id', profile.id)
      .eq('ativo', true)
      .order('modalidade'),

    // Contagem de turmas ativas — head:true = COUNT sem retornar linhas
    supabase
      .from('turmas')
      .select('*', { count: 'exact', head: true })
      .eq('professor_id', profile.id)
      .eq('ativa', true),

    // Resumo financeiro do mês — reutiliza action de pagamentos
    listarPagamentosProfessor(mesAtual),
  ])

  const modalidades  = (modalidadesResult.data ?? []).map((m) => m.modalidade)
  const turmasAtivas = turmasResult.count ?? 0
  const pagamentos   = pagamentosResult.ok ? pagamentosResult.data : []

  // ── Cálculos do resumo financeiro ─────────────────────────
  const totalValor     = pagamentos.reduce((s, p) => s + p.valor,     0)
  const totalPresencas = pagamentos.reduce((s, p) => s + p.presencas, 0)
  const totalAulas     = pagamentos.length

  const statusPagamento =
    pagamentos.length === 0
      ? null
      : pagamentos.every((p) => p.pago)  ? 'pago'
      : pagamentos.some((p) => p.pago)   ? 'parcial'
      : 'pendente'

  const STATUS_LABEL: Record<string, { text: string; cor: string }> = {
    pago:     { text: '✓ Pago',     cor: 'text-chumbo'    },
    parcial:  { text: '◑ Parcial',  cor: 'text-orange-dk' },
    pendente: { text: '⏳ Pendente', cor: 'text-orange-dk' },
  }

  // ── Dados cadastrais dinâmicos ─────────────────────────────
  const dadosCadastrais = [
    {
      label: 'E-mail',
      valor: profile.email || '—',
    },
    {
      label: 'Telefone',
      valor: profile.telefone || 'Não cadastrado',
    },
    {
      label: 'Especialidades',
      valor: modalidades.length > 0
        ? modalidades.join(' · ')
        : 'Nenhuma modalidade cadastrada',
    },
    {
      label: 'Turmas ativas',
      valor: turmasAtivas > 0
        ? `${turmasAtivas} turma${turmasAtivas !== 1 ? 's' : ''}`
        : 'Sem turmas ativas',
    },
    {
      label: 'No Andorin desde',
      valor: profile.createdAt
        ? formatDataCurta(new Date(profile.createdAt))
        : '—',
    },
    {
      label: 'Função',
      valor: `Professor · ${
        turmasAtivas > 0
          ? `${turmasAtivas} turma${turmasAtivas !== 1 ? 's' : ''}`
          : 'sem turmas'
      }`,
    },
  ]

  // ── Resumo financeiro do mês ───────────────────────────────
  const resumoMes = [
    {
      label: 'Aulas ministradas',
      valor: String(totalAulas),
      negrito: true,
      cor: '',
    },
    {
      label: 'Total de presenças',
      valor: String(totalPresencas),
      negrito: true,
      cor: '',
    },
    {
      label: 'Remuneração',
      valor: formatBRL(totalValor),
      negrito: true,
      cor: 'text-chumbo',
    },
    {
      label: 'Status pagamento',
      valor: statusPagamento
        ? STATUS_LABEL[statusPagamento].text
        : '—',
      negrito: false,
      cor: statusPagamento
        ? STATUS_LABEL[statusPagamento].cor
        : 'text-gray-mid',
    },
  ]

  return (
    <>
      <PageHeader
        title="Perfil"
        subtitle={profile.email}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 items-start">

        {/* Card principal — dados do professor */}
        <Card>
          {/* Avatar + nome + badge */}
          <div className="flex items-center gap-5 pb-6 border-b border-gray-bg mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center
                         text-2xl font-extrabold text-off-white flex-shrink-0"
              style={{
                fontFamily: 'var(--font-montserrat)',
                background: avatarColorByName(profile.nome),
              }}
            >
              {iniciais(profile.nome)}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xl font-extrabold text-gray-dark truncate"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                {profile.nome}
              </p>
              <p className="text-sm text-gray-mid mt-1 truncate">{profile.email}</p>

              {/* Chips de modalidade — dados reais de professor_modalidades */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {modalidades.length > 0
                  ? modalidades.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                                   text-xs font-bold bg-chumbo/10 text-chumbo"
                      >
                        🎭 {m}
                      </span>
                    ))
                  : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                                     text-xs font-bold bg-chumbo/10 text-chumbo">
                      🎭 Professor
                    </span>
                  )
                }
              </div>
            </div>
          </div>

          {/* Dados cadastrais */}
          <p
            className="text-sm font-bold text-gray-dark mb-3"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            Dados cadastrais
          </p>
          <div className="flex flex-col divide-y divide-gray-bg">
            {dadosCadastrais.map(({ label, valor }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid font-medium flex-shrink-0 mr-3">
                  {label}
                </span>
                <span className="text-sm font-semibold text-gray-dark text-right max-w-[60%] truncate">
                  {valor}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Card lateral — resumo financeiro do mês */}
        <Card>
          <p
            className="text-sm font-bold text-gray-dark mb-3"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            Resumo — {mesCapitalizado}
          </p>

          {pagamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <span className="text-3xl opacity-30">💰</span>
              <p className="text-xs text-gray-mid text-center">
                Nenhuma aula com presenças este mês.
                Marque presenças na Agenda.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-bg">
              {resumoMes.map(({ label, valor, negrito, cor }) => (
                <div key={label} className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-mid">{label}</span>
                  <span
                    className={`text-sm ${negrito ? 'font-extrabold text-base' : 'font-semibold'} ${cor || 'text-gray-dark'}`}
                    style={negrito ? { fontFamily: 'var(--font-montserrat)' } : {}}
                  >
                    {valor}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tabela de regras de remuneração */}
          <div className="mt-4 pt-4 border-t border-gray-bg">
            <p className="text-[10px] font-bold text-gray-mid uppercase tracking-wide mb-2">
              Regra de remuneração
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-mid">{THRESHOLD_PRESENCAS}+ presenças</span>
                <span className="font-bold text-chumbo">{formatBRL(VALOR_AULA_ALTO)}/aula</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-mid">Menos de {THRESHOLD_PRESENCAS}</span>
                <span className="font-bold text-gray-mid">{formatBRL(VALOR_AULA_BAIXO)}/aula</span>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </>
  )
}
