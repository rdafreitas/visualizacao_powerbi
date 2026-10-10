import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Treinos — Professor Andorin' }

export default function ProfessorTreinosPage() {
  return (
    <>
      <PageHeader title="Biblioteca de Treinos" subtitle="Exercícios cadastrados por você." />
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <span className="text-5xl opacity-40">🏋️</span>
          <h3 className="text-lg font-bold text-gray-dark opacity-50"
            style={{ fontFamily: 'var(--font-montserrat)' }}>Em desenvolvimento</h3>
          <p className="text-sm text-gray-mid max-w-sm">
            A biblioteca de treinos será implementada na próxima fase, com filtros por valência, cadastro e edição de exercícios.
          </p>
        </div>
      </Card>
    </>
  )
}
