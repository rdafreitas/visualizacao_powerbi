// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/home/page.tsx
//
// Server Component puro — sem 'use client', sem useState.
// A Home do Admin é leitura pura: não há interatividade, modais
// ou estados locais. Server Component é a escolha correta:
//   • Zero JS extra no bundle do browser
//   • HTML com dados já renderizados — sem loading state
//   • Performance máxima para uma dashboard estática
//
// QUERIES EXECUTADAS EM PARALELO:
//   Promise.all roda as 4 contagens + resumo financeiro
//   simultaneamente — sem esperar uma terminar para iniciar outra.
//   COUNT com head:true = SELECT COUNT(*) sem retornar linhas.
// ─────────────────────────────────────────────────────────────

import Link          from 'next/link'
import { requireAuth }          from '@/(auth)/session'
import { createClient }         from '@/lib/supabase/server'
import { resumoFinanceiro }     from '@/(auth)/actions/financeiro'
import { PageHeader }           from '@/components/layout/PageHeader'
import { Card, CardTitle }      from '@/components/ui/Card'
import { formatBRL, formatDataCurta, iniciais, avatarColorByName } from '@/lib/utils'

export const metadata = { title: 'Início — Andorin Admin' }

// ── Links de acesso rápido ────────────────────────────────────
// Definido aqui — sem estado, nunca muda, não precisa do Client.
const QUICK = [
  { icon: '👥', label: 'Alunos',      href: '/pages/admin/alunos'      },
  { icon: '💰', label: 'Financeiro',  href: '/pages/admin/financeiro'  },
  { icon: '🎭', label: 'Professores', href: '/pages/admin/professores' },
  { icon: '📅', label: 'Agenda',      href: '/pages/admin/agenda'      },
]

export default async function AdminHomePage() {

  // requireAuth verifica sessão + retorna profile real
  const profile = await requireAuth()
  const supabase = await createClient()

  // ── Datas ────────────────────────────────────────────────────
  const agora    = new Date()
  const hojeISO  = agora.toISOString().split('T')[0]           // '2026-07-30'
  const mesAtual = `${agora.toISOString().substring(0, 7)}-01` // '2026-07-01'

  // Saudação com data real — calculada no servidor
  const dataLabel = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  })
  // Capitaliza a primeira letra: 'quarta-feira' → 'Quarta-feira'
  const dataCapitalizada = dataLabel.charAt(0).toUpperCase() + dataLabel.slice(1)

  // ── Contagens em paralelo ─────────────────────────────────────
  // head: true → não retorna linhas, apenas o COUNT.
  // Equivalente a SELECT COUNT(*) WHERE ... no PostgreSQL.
  const [
    { count: alunosAtivos },
    { count: inadimplentes },
    { count: aulasHoje },
    { count: totalProfessores },
    resumo,
  ] = await Promise.all([
    supabase
      .from('matriculas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo'),

    supabase
      .from('matriculas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inadimplente'),

    supabase
      .from('aulas')
      .select('*', { count: 'exact', head: true })
      .gte('inicio', `${hojeISO}T00:00:00`)
      .lte('inicio', `${hojeISO}T23:59:59`)
      .eq('status', 'agendada'),

    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'professor'),

    resumoFinanceiro(mesAtual),
  ])

  const kpis = [
    {
      icon:  '👥',
      valor: String(alunosAtivos ?? 0),
      label: 'Alunos ativos',
      delta: inadimplentes
        ? `⚠️ ${inadimplentes} inadimplente${inadimplentes > 1 ? 's' : ''}`
        : '✅ Todos em dia',
      cor: (inadimplentes ?? 0) > 0 ? 'text-red' : 'text-chumbo',
    },
    {
      icon:  '💰',
      valor: formatBRL(resumo.receitas),
      label: `Receitas — ${agora.toLocaleDateString('pt-BR', { month: 'long' })}`,
      delta: resumo.lucro >= 0
        ? `✅ Lucro ${formatBRL(resumo.lucro)}`
        : `⚠️ Prejuízo ${formatBRL(Math.abs(resumo.lucro))}`,
      cor: resumo.lucro >= 0 ? 'text-chumbo' : 'text-red',
    },
    {
      icon:  '📅',
      valor: String(aulasHoje ?? 0),
      label: 'Aulas hoje',
      delta: (aulasHoje ?? 0) === 0 ? 'Nenhuma aula agendada' : 'Agendadas para hoje',
      cor: 'text-gray-mid',
    },
    {
      icon:  '🎭',
      valor: String(totalProfessores ?? 0),
      label: 'Professores',
      delta: `Despesas ${formatBRL(resumo.despesas)}`,
      cor: 'text-gray-mid',
    },
  ]

  // ── Feed de atividade — queries leves com limit ───────────────
  // Não há tabela de "eventos" no banco. O feed é construído
  // cruzando as últimas matrículas e as últimas transações.
  // limit(4) garante que apenas os mais recentes são buscados.
  const [{ data: novasMatriculas }, { data: ultimasTransacoes }] =
    await Promise.all([
      supabase
        .from('matriculas')
        .select(`
          id, status, inicio,
          profiles!matriculas_aluno_id_fkey ( nome )
        `)
        .order('inicio', { ascending: false })
        .limit(4),

      supabase
        .from('transacoes')
        .select('id, tipo, categoria, valor, criado_em')
        .order('criado_em', { ascending: false })
        .limit(4),
    ])

  // Monta o feed unificado e ordena por data decrescente
  type FeedItem = {
    id:   string
    icon: string
    text: string
    sub:  string
    data: string  // ISO — usado para ordenação
  }

  const feedItems: FeedItem[] = []

  for (const m of novasMatriculas ?? []) {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    const nomeAluno = prof?.nome ?? 'Aluno'
    feedItems.push({
      id:   m.id,
      icon: m.status === 'inadimplente' ? '⚠️' : '🆕',
      text: m.status === 'inadimplente'
        ? `Inadimplência registrada — ${nomeAluno}`
        : `Nova matrícula — ${nomeAluno}`,
      sub:  `${m.status === 'experimental' ? 'Experimental' : 'Plano ativo'} · ${formatDataCurta(new Date(m.inicio))}`,
      data: m.inicio,
    })
  }

  for (const t of ultimasTransacoes ?? []) {
    feedItems.push({
      id:   t.id,
      icon: t.tipo === 'receita' ? '💰' : '📉',
      text: `${t.tipo === 'receita' ? 'Receita' : 'Despesa'} — ${t.categoria}`,
      sub:  `${formatBRL(t.valor)} · ${formatDataCurta(new Date(t.criado_em))}`,
      data: t.criado_em,
    })
  }

  // Ordena por data decrescente e limita a 6 itens no feed
  feedItems.sort((a, b) => b.data.localeCompare(a.data))
  const feed = feedItems.slice(0, 6)

  return (
    <>
      <PageHeader
        title="Visão Geral 👑"
        subtitle={`Bem-vindo, ${profile.nome}. ${dataCapitalizada}.`}
      />

      {/* KPIs reais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {kpis.map((k) => (
          <Card key={k.label}>
            <span className="text-3xl block mb-3">{k.icon}</span>
            <p
              className="text-[28px] font-extrabold text-gray-dark leading-none"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {k.valor}
            </p>
            <p className="text-xs text-gray-mid mt-1">{k.label}</p>
            <p className={`text-xs font-semibold mt-2 ${k.cor}`}>{k.delta}</p>
          </Card>
        ))}
      </div>

      {/* Feed + Acesso Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">

        {/* Feed de atividade recente */}
        <Card>
          <CardTitle>Atividade Recente</CardTitle>
          {feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-3xl opacity-30">📋</span>
              <p className="text-sm text-gray-mid">
                Nenhuma atividade ainda. Cadastre alunos e transações.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-bg">
              {feed.map((f) => (
                <div
                  key={f.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div
                    className="w-10 h-10 rounded-xl bg-gray-bg flex items-center
                                justify-center text-lg flex-shrink-0"
                  >
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-dark">{f.text}</p>
                    <p className="text-xs text-gray-mid mt-0.5">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Acesso rápido + mini-card do perfil logado */}
        <div className="flex flex-col gap-5">

          {/* Mini-card do proprietário logado */}
          <Card>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center
                           text-base font-extrabold text-off-white flex-shrink-0"
                style={{
                  background: avatarColorByName(profile.nome),
                  fontFamily: 'var(--font-montserrat)',
                }}
              >
                {iniciais(profile.nome)}
              </div>
              <div className="min-w-0">
                <p
                  className="font-bold text-gray-dark truncate"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  {profile.nome}
                </p>
                <p className="text-xs text-gray-mid truncate">{profile.email}</p>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1
                                  bg-orange/20 text-orange-dk">
                  👑 Proprietário
                </span>
              </div>
            </div>
          </Card>

          {/* Acesso Rápido */}
          <Card>
            <CardTitle>Acesso Rápido</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              {QUICK.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl
                             bg-gray-bg hover:bg-white hover:border hover:border-bordo/15
                             hover:-translate-y-0.5 transition-all no-underline"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] font-bold text-gray-mid">{item.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </>
  )
}
