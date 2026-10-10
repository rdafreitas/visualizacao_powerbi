import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { iniciais } from '@/lib/utils'

export const metadata = { title: 'Perfil — PaVoar' }

export default async function AlunoPerfilPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'aluno') redirect('/pages/login')

  const DADOS = [
    { label: 'E-mail',           valor: profile.email           },
    { label: 'Telefone',         valor: profile.telefone ?? '—' },
    { label: 'Modalidades',      valor: 'Tecido Circense · Acrobacia de Solo' },
    { label: 'Aluna desde',      valor: 'Janeiro de 2025'       },
    { label: 'Plano atual',      valor: 'Completo · R$ 280/mês' },
    { label: 'Próximo pagamento',valor: '30 ago 2026'           },
  ]

  const RESUMO = [
    { emoji: '🥋', valor: 'Nível 3',  label: 'Intermediário', color: 'text-purple'   },
    { emoji: '✨', valor: '246',       label: 'XP total',      color: 'text-gold-dk'  },
    { emoji: '💪', valor: '12',        label: 'Habilidades',   color: 'text-orange-dk'},
    { emoji: '📅', valor: '90%',       label: 'Presença Jul',  color: 'text-green-dk' },
  ]

  return (
    <>
      <PageHeader title="Perfil" subtitle={profile.email} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 items-start">
        {/* Card principal */}
        <Card>
          {/* Hero */}
          <div className="flex items-center gap-5 pb-6 border-b border-gray-bg mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-poppins text-2xl font-extrabold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FF4500)' }}
            >
              {iniciais(profile.nome)}
            </div>
            <div className="flex-1">
              <p className="font-poppins text-xl font-extrabold text-gray-dark">{profile.nome}</p>
              <p className="text-sm text-gray-mid mt-1">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange/15 text-orange-dk">
                  🤸 Aluna · Plano Completo
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange/10 text-orange-dk">
                  🥋 Nível 3
                </span>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-dk hover:opacity-90 transition flex-shrink-0">
              Editar
            </button>
          </div>

          {/* Dados */}
          <p className="font-poppins text-sm font-bold text-gray-dark mb-3">Dados cadastrais</p>
          <div className="flex flex-col divide-y divide-gray-bg">
            {DADOS.map(({ label, valor }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid font-medium">{label}</span>
                <span className={`text-sm font-semibold text-gray-dark text-right max-w-[60%] ${label === 'Próximo pagamento' ? 'text-orange-dk font-bold' : ''}`}>
                  {valor}
                </span>
              </div>
            ))}
          </div>

          {/* Sair */}
          <button className="mt-6 w-full py-3 rounded-xl text-sm font-bold bg-red/10 text-red hover:bg-red/15 transition-colors border border-red/20">
            Sair da conta
          </button>
        </Card>

        {/* Sidebar de evolução */}
        <div className="flex flex-col gap-4">
          <Card>
            <p className="font-poppins text-sm font-bold text-gray-dark mb-4">Resumo de evolução</p>
            <div className="grid grid-cols-2 gap-3">
              {RESUMO.map(({ emoji, valor, label, color }) => (
                <div key={label} className="bg-gray-bg rounded-xl p-3.5 text-center">
                  <span className="text-xl block mb-1">{emoji}</span>
                  <p className={`font-poppins text-xl font-extrabold ${color}`}>{valor}</p>
                  <p className="text-[10px] text-gray-mid mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="font-poppins text-sm font-bold text-gray-dark mb-3">Posição no ranking</p>
            <div className="flex flex-col divide-y divide-gray-bg">
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid">Ranking geral</span>
                <span className="text-sm font-extrabold text-orange-dk">4° lugar</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid">Tecido Circense</span>
                <span className="text-sm font-extrabold text-orange-dk">1° lugar 🥇</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
