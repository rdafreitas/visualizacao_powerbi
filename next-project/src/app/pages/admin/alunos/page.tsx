import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Alunos — Andorin Admin' }

export default function AdminAlunosPage() {
  return (
    <>
      <PageHeader title="Alunos" subtitle="Esta tela será implementada na próxima fase." />
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <span className="text-5xl opacity-40">🚧</span>
          <h3 className="text-lg font-bold text-gray-dark opacity-50"
            style={{ fontFamily: 'var(--font-montserrat)' }}>Em desenvolvimento</h3>
          <p className="text-sm text-gray-mid max-w-sm">
            A tela de alunos do modo Administrador será implementada na próxima fase de desenvolvimento.
          </p>
        </div>
      </Card>
    </>
  )
}
