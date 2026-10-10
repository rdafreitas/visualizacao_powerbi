import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Agenda — Professor Andorin' }

export default function ProfessorAgendaPage() {
  return (
    <>
      <PageHeader title="Agenda" subtitle="Suas aulas do dia, alunos inscritos e check-in." />
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <span className="text-5xl opacity-40">📅</span>
          <h3 className="text-lg font-bold text-gray-dark opacity-50"
            style={{ fontFamily: 'var(--font-montserrat)' }}>Em desenvolvimento</h3>
          <p className="text-sm text-gray-mid max-w-sm">
            A agenda do professor será implementada na próxima fase, com tira de dias, check-in de alunos e modal de saúde.
          </p>
        </div>
      </Card>
    </>
  )
}
