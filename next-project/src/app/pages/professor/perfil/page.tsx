import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { iniciais } from '@/lib/utils'

export const metadata = { title: 'Perfil — Professor Andorin' }

// Demo — substituir por getProfile() quando integrar o backend
const DEMO = {
  nome:     'Diego Mendes',
  email:    'diego@andorin.com.br',
  telefone: '(11) 99999-0002',
}

const DADOS = [
  { label: 'E-mail',              valor: DEMO.email     },
  { label: 'Telefone',            valor: DEMO.telefone  },
  { label: 'Especialidade',       valor: 'Acrobacia de Solo' },
  { label: 'No Andorin desde',    valor: 'Março de 2024' },
  { label: 'Função',              valor: 'Professor · Turmas de Acrobacia' },
]

export default function ProfessorPerfilPage() {
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
                background: 'linear-gradient(135deg, #211D1C, #3a3330)',
              }}
            >
              {iniciais(DEMO.nome)}
            </div>
            <div className="flex-1">
              <p className="text-xl font-extrabold text-gray-dark"
                style={{ fontFamily: 'var(--font-montserrat)' }}>{DEMO.nome}</p>
              <p className="text-sm text-gray-mid mt-1">{DEMO.email}</p>
              <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-chumbo/10 text-chumbo">
                🎭 Professor
              </span>
            </div>
          </div>

          <p className="text-sm font-bold text-gray-dark mb-3"
            style={{ fontFamily: 'var(--font-montserrat)' }}>Dados cadastrais</p>
          <div className="flex flex-col divide-y divide-gray-bg">
            {DADOS.map(({ label, valor }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid font-medium">{label}</span>
                <span className="text-sm font-semibold text-gray-dark text-right max-w-[60%]">{valor}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-bold text-gray-dark mb-3"
            style={{ fontFamily: 'var(--font-montserrat)' }}>Resumo — Julho 2026</p>
          <div className="flex flex-col divide-y divide-gray-bg">
            {[
              { label: 'Aulas ministradas',  valor: '14',        bold: true,  color: ''               },
              { label: 'Total de presenças', valor: '98',        bold: true,  color: ''               },
              { label: 'Remuneração',        valor: 'R$ 2.400', bold: true,  color: 'text-chumbo'    },
              { label: 'Status pagamento',   valor: 'Pendente', bold: false, color: 'text-orange-dk' },
            ].map(({ label, valor, bold, color }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-mid">{label}</span>
                <span className={`text-sm ${bold ? 'font-extrabold text-base' : 'font-semibold'} ${color || 'text-gray-dark'}`}
                  style={bold ? { fontFamily: 'var(--font-montserrat)' } : {}}>
                  {valor}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
