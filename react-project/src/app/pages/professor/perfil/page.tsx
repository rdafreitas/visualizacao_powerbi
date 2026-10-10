import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { avatarColorByName, iniciais, formatDataCurta } from '@/lib/utils'

export const metadata = { title: 'Perfil — Professor PaVoar' }

export default async function ProfessorPerfilPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'professor') redirect('/pages/login')

  const DADOS = [
    { label: 'E-mail',        valor: profile.email              },
    { label: 'Telefone',      valor: profile.telefone ?? '—'    },
    { label: 'Especialidade', valor: 'Acrobacia de Solo'        },
    { label: 'Na PaVoar desde', valor: 'Março de 2024'         },
    { label: 'Função',        valor: 'Professor · Turmas de Acrobacia' },
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
              style={{ background: 'linear-gradient(135deg, #06D6A0, #04956E)' }}
            >
              {iniciais(profile.nome)}
            </div>
            <div className="flex-1">
              <p className="font-poppins text-xl font-extrabold text-gray-dark">{profile.nome}</p>
              <p className="text-sm text-gray-mid mt-1">{profile.email}</p>
              <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-green/15 text-green-dk">
                🎭 Professor
              </span>
            </div>
          </div>

          {/* Dados */}
          <p className="font-poppins text-sm font-bold text-gray-dark mb-3">Dados cadastrais</p>
          <div className="flex flex-col divide-y divide-gray-bg">
            {DADOS.map(({ label, valor }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid font-medium">{label}</span>
                <span className="text-sm font-semibold text-gray-dark text-right max-w-[60%]">{valor}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Sidebar de resumo */}
        <Card>
          <p className="font-poppins text-sm font-bold text-gray-dark mb-3">Resumo — Julho 2026</p>
          <div className="flex flex-col divide-y divide-gray-bg">
            {[
              { label: 'Aulas ministradas', valor: '14',      bold: true  },
              { label: 'Total de presenças', valor: '98',     bold: true  },
              { label: 'Remuneração',        valor: 'R$ 2.400', bold: true, color: 'text-green-dk' },
              { label: 'Status pagamento',   valor: 'Pendente', bold: false, color: 'text-orange-dk' },
            ].map(({ label, valor, bold, color }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid">{label}</span>
                <span className={`text-sm ${bold ? 'font-poppins font-extrabold text-base' : 'font-semibold'} ${color ?? 'text-gray-dark'}`}>{valor}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
