import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { iniciais } from '@/lib/utils'

export const metadata = { title: 'Perfil — Andorin' }

// Demo — substituir por getProfile() quando integrar o backend
const DEMO = {
  nome:     'Ana Lima',
  email:    'ana@andorin.com.br',
  telefone: '(11) 99999-0001',
}

const DADOS = [
  { label: 'E-mail',            valor: DEMO.email     },
  { label: 'Telefone',          valor: DEMO.telefone  },
  { label: 'Modalidades',       valor: 'Tecido Circense · Acrobacia de Solo' },
  { label: 'Aluna desde',       valor: 'Janeiro de 2025'       },
  { label: 'Plano atual',       valor: 'Completo · R$ 280/mês' },
  { label: 'Próximo pagamento', valor: '30 ago 2026'           },
]

const RESUMO = [
  { emoji: '🥋', valor: 'Nível 3', label: 'Intermediário', color: 'text-bordo'    },
  { emoji: '✨', valor: '246',      label: 'XP total',      color: 'text-orange-dk' },
  { emoji: '💪', valor: '12',       label: 'Habilidades',   color: 'text-chumbo'   },
  { emoji: '📅', valor: '90%',      label: 'Presença Jul',  color: 'text-chumbo'   },
]

export default function AlunoPerfilPage() {
  return (
    <>
      <PageHeader title="Perfil" subtitle={DEMO.email} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 items-start">
        <Card>
          <div className="flex items-center gap-5 pb-6 border-b border-gray-bg mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-off-white flex-shrink-0"
              style={{
                fontFamily: 'var(--font-montserrat)',
                background: 'linear-gradient(135deg, #7A1D2C, #5a1520)',
              }}
            >
              {iniciais(DEMO.nome)}
            </div>
            <div className="flex-1">
              <p className="text-xl font-extrabold text-gray-dark"
                style={{ fontFamily: 'var(--font-montserrat)' }}>{DEMO.nome}</p>
              <p className="text-sm text-gray-mid mt-1">{DEMO.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-bordo/10 text-bordo">
                  🤸 Aluna · Plano Completo
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-bordo/8 text-bordo">
                  🥋 Nível 3
                </span>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl text-xs font-bold text-off-white bg-bordo hover:bg-bordo-dk transition flex-shrink-0">
              Editar
            </button>
          </div>

          <p className="text-sm font-bold text-gray-dark mb-3"
            style={{ fontFamily: 'var(--font-montserrat)' }}>Dados cadastrais</p>
          <div className="flex flex-col divide-y divide-gray-bg">
            {DADOS.map(({ label, valor }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid font-medium">{label}</span>
                <span className={`text-sm font-semibold text-right max-w-[60%] ${label === 'Próximo pagamento' ? 'text-orange-dk font-bold' : 'text-gray-dark'}`}>
                  {valor}
                </span>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full py-3 rounded-xl text-sm font-bold bg-red/10 text-red hover:bg-red/15 transition-colors border border-red/20">
            Sair da conta
          </button>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <p className="text-sm font-bold text-gray-dark mb-4"
              style={{ fontFamily: 'var(--font-montserrat)' }}>Resumo de evolução</p>
            <div className="grid grid-cols-2 gap-3">
              {RESUMO.map(({ emoji, valor, label, color }) => (
                <div key={label} className="bg-gray-bg rounded-xl p-3.5 text-center">
                  <span className="text-xl block mb-1">{emoji}</span>
                  <p className={`text-xl font-extrabold ${color}`}
                    style={{ fontFamily: 'var(--font-montserrat)' }}>{valor}</p>
                  <p className="text-[10px] text-gray-mid mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-sm font-bold text-gray-dark mb-3"
              style={{ fontFamily: 'var(--font-montserrat)' }}>Posição no ranking</p>
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
