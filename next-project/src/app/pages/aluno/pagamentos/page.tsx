// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/pagamentos/page.tsx
//
// Server Component com dois fluxos condicionais:
//   • Sem matrícula ativa → exibe planos disponíveis do banco
//   • Com matrícula ativa → exibe contrato e histórico reais
//
// Ambos são determinados no servidor antes de qualquer HTML ser
// enviado ao browser — seguro e sem flash de conteúdo errado.
//
// FONTES DE DADOS:
//   1. Matrícula ativa do aluno (+ plano vinculado)
//   2. Planos disponíveis (quando sem matrícula)
//   3. Histórico de matrículas anteriores (status = 'inativo')
// ─────────────────────────────────────────────────────────────

import { requireAuth }    from '@/(auth)/session'
import { createClient }   from '@/lib/supabase/server'
import { PageHeader }     from '@/components/layout/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { formatBRL, formatDataCurta } from '@/lib/utils'

export const metadata = { title: 'Planos & Pagamentos — Andorin' }

// ── Badges de status ──────────────────────────────────────────
const STATUS_BADGE: Record<string, { text: string; cor: string }> = {
  ativo:        { text: '✅ Ativo',        cor: 'bg-green-light/40 text-chumbo' },
  experimental: { text: '🎟️ Experimental',  cor: 'bg-orange/15 text-orange-dk'  },
  inadimplente: { text: '⚠️ Inadimplente',  cor: 'bg-red/10 text-red'            },
}

// ── Ícones de destaque por faixa de valor ────────────────────
function iconeDesquePlano(valor: number): { emoji: string; destaque: boolean } {
  if (valor >= 400) return { emoji: '💎', destaque: false }
  if (valor >= 250) return { emoji: '⭐', destaque: true  }
  return              { emoji: '🎟️', destaque: false }
}

export default async function AlunoPagamentosPage() {

  const profile  = await requireAuth()
  const supabase = await createClient()

  // ── Busca matrícula ativa em paralelo com planos disponíveis ─
  const [matriculaResult, planosResult, historicoResult] = await Promise.all([

    // Matrícula ativa (inclui inadimplente — aluno precisa ver o aviso)
    supabase
      .from('matriculas')
      .select(`
        id, status, inicio, vencimento,
        planos!matriculas_plano_id_fkey ( nome, valor, max_modal, fidelidade )
      `)
      .eq('aluno_id', profile.id)
      .in('status', ['ativo', 'experimental', 'inadimplente'])
      .order('inicio', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Planos ativos do banco (para mostrar quando sem matrícula)
    // Policy "autenticados leem planos" — qualquer autenticado pode ler
    supabase
      .from('planos')
      .select('id, nome, valor, max_modal, fidelidade')
      .eq('ativo', true)
      .order('valor', { ascending: true }),

    // Histórico: matrículas inativas anteriores
    supabase
      .from('matriculas')
      .select(`
        id, status, inicio, vencimento,
        planos!matriculas_plano_id_fkey ( nome, valor )
      `)
      .eq('aluno_id', profile.id)
      .eq('status', 'inativo')
      .order('vencimento', { ascending: false })
      .limit(6),
  ])

  const matriculaAtiva   = matriculaResult.data
  const planosDisponiveis = planosResult.data    ?? []
  const historicoMats     = historicoResult.data ?? []

  // Normaliza o plano da matrícula ativa
  const planoAtivo = matriculaAtiva
    ? (Array.isArray(matriculaAtiva.planos) ? matriculaAtiva.planos[0] : matriculaAtiva.planos)
    : null

  const badge = matriculaAtiva ? (STATUS_BADGE[matriculaAtiva.status] ?? STATUS_BADGE.ativo) : null

  // ── Fluxo A: sem matrícula → mostrar planos ─────────────────
  if (!matriculaAtiva) {
    return (
      <>
        <PageHeader
          title="Planos & Pagamentos"
          subtitle="Escolha o plano ideal para o seu ritmo e comece a praticar."
        />

        {planosDisponiveis.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="text-4xl opacity-30">📋</span>
              <p className="text-sm text-gray-mid">
                Nenhum plano disponível no momento. Entre em contato com a academia.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {planosDisponiveis.map((p) => {
              const { emoji, destaque } = iconeDesquePlano(p.valor)
              return (
                <div
                  key={p.id}
                  className={`relative bg-white rounded-2xl p-6 flex flex-col gap-4 border-2
                               transition-all hover:-translate-y-1 hover:shadow-lg ${
                    destaque ? 'border-bordo shadow-md' : 'border-black/[0.06]'
                  }`}
                >
                  {destaque && (
                    <span
                      className="absolute -top-px right-5 text-off-white text-[9px]
                                 font-extrabold px-3 py-0.5 rounded-b-xl tracking-wide"
                      style={{ background: '#f27406' }}
                    >
                      MAIS POPULAR
                    </span>
                  )}

                  <p
                    className="text-base font-extrabold text-gray-dark"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {emoji} {p.nome}
                  </p>

                  <p
                    className="text-4xl font-extrabold text-bordo leading-none"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
                  >
                    {formatBRL(p.valor)}
                    <span className="text-sm font-medium text-gray-mid">/mês</span>
                  </p>

                  <div className="flex flex-col gap-1.5 text-sm text-gray-mid">
                    <span>
                      🎭 Até {p.max_modal} modalidade{p.max_modal !== 1 ? 's' : ''}
                    </span>
                    <span>
                      📅 {p.fidelidade > 0
                        ? `Fidelidade ${p.fidelidade} meses`
                        : 'Sem fidelidade'}
                    </span>
                  </div>

                  <button
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                      destaque
                        ? 'text-off-white hover:opacity-90'
                        : 'bg-bordo text-off-white hover:bg-bordo-dk'
                    }`}
                    style={destaque ? { background: '#f27406' } : {}}
                  >
                    Contratar — fale com a academia
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </>
    )
  }

  // ── Fluxo B: com matrícula ativa ─────────────────────────────
  return (
    <>
      <PageHeader
        title="Planos & Pagamentos"
        subtitle="Gerencie seu plano e veja o histórico de contratos."
      />

      {/* Hero — plano ativo */}
      <div
        className="rounded-2xl p-6 mb-5 flex items-center justify-between gap-5 flex-wrap"
        style={{
          background: matriculaAtiva.status === 'inadimplente'
            ? 'linear-gradient(135deg, #7f1d1d, #991b1b)'   // vermelho para inadimplente
            : 'linear-gradient(135deg, #211D1C, #7A1D2C)',
        }}
      >
        <div>
          {badge && (
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${badge.cor}`}>
              {badge.text}
            </span>
          )}
          <p
            className="text-xl font-extrabold text-white"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            {planoAtivo ? `${planoAtivo.nome}` : 'Plano ativo'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(244,231,206,.55)' }}>
            {planoAtivo
              ? `Até ${planoAtivo.max_modal} modalidade${planoAtivo.max_modal !== 1 ? 's' : ''}`
              : ''}
          </p>
          {matriculaAtiva.inicio && (
            <p className="text-xs mt-1" style={{ color: 'rgba(244,231,206,.45)' }}>
              Início: {formatDataCurta(new Date(matriculaAtiva.inicio))}
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'rgba(244,231,206,.5)' }}>
            {matriculaAtiva.status === 'inadimplente' ? 'Pagamento em atraso' : 'Vencimento'}
          </p>
          <p
            className="text-xl font-extrabold"
            style={{
              color:       matriculaAtiva.status === 'inadimplente' ? '#fca5a5' : '#f27406',
              fontFamily:  'var(--font-montserrat)',
            }}
          >
            {matriculaAtiva.vencimento
              ? formatDataCurta(new Date(matriculaAtiva.vencimento))
              : '—'}
          </p>
          {planoAtivo && (
            <p className="text-sm mt-0.5" style={{ color: 'rgba(244,231,206,.6)' }}>
              {formatBRL(planoAtivo.valor)}/mês
            </p>
          )}
        </div>
      </div>

      {/* Aviso de inadimplência */}
      {matriculaAtiva.status === 'inadimplente' && (
        <div className="mb-5 p-4 rounded-2xl border-[1.5px] border-red/40 bg-red/5">
          <p className="text-sm font-bold text-red mb-1">⚠️ Pagamento em atraso</p>
          <p className="text-xs text-gray-mid">
            Entre em contato com a academia para regularizar sua situação e manter o acesso às aulas.
          </p>
        </div>
      )}

      {/* Detalhes do plano */}
      {planoAtivo && (
        <Card className="mb-5">
          <CardTitle>Detalhes do contrato</CardTitle>
          <div className="flex flex-col divide-y divide-gray-bg">
            {[
              { label: 'Plano',       valor: planoAtivo.nome },
              { label: 'Mensalidade', valor: formatBRL(planoAtivo.valor) },
              { label: 'Modalidades', valor: `Até ${planoAtivo.max_modal} modalidade${planoAtivo.max_modal !== 1 ? 's' : ''}` },
              { label: 'Fidelidade',  valor: planoAtivo.fidelidade > 0 ? `${planoAtivo.fidelidade} meses` : 'Sem fidelidade' },
              { label: 'Status',      valor: badge?.text ?? '—' },
              { label: 'Vencimento',  valor: matriculaAtiva.vencimento ? formatDataCurta(new Date(matriculaAtiva.vencimento)) : '—' },
            ].map(({ label, valor }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid">{label}</span>
                <span className="text-sm font-semibold text-gray-dark">{valor}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-bg">
            <p className="text-xs text-gray-mid text-center">
              Para alterar seu plano ou forma de pagamento, entre em contato com a academia.
            </p>
          </div>
        </Card>
      )}

      {/* Histórico de contratos anteriores */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-bg">
          <CardTitle className="mb-0">Histórico de contratos</CardTitle>
        </div>

        {historicoMats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-3xl opacity-30">📋</span>
            <p className="text-sm text-gray-mid">Nenhum contrato anterior.</p>
            <p className="text-xs text-gray-mid">Este é o seu primeiro contrato na academia.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-bg">
            {historicoMats.map((m) => {
              const planoH = Array.isArray(m.planos) ? m.planos[0] : m.planos
              return (
                <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-dark">
                      {planoH?.nome ?? 'Plano'} — encerrado
                    </p>
                    <p className="text-xs text-gray-mid mt-0.5">
                      {m.inicio
                        ? formatDataCurta(new Date(m.inicio))
                        : '—'}
                      {' – '}
                      {m.vencimento
                        ? formatDataCurta(new Date(m.vencimento))
                        : '—'}
                    </p>
                  </div>
                  {planoH?.valor && (
                    <p
                      className="font-extrabold text-chumbo flex-shrink-0"
                      style={{ fontFamily: 'var(--font-montserrat)' }}
                    >
                      {formatBRL(planoH.valor)}/mês
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}
