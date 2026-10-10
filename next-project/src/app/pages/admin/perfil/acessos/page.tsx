import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Acessos — Andorin Admin' }

export default function AcessosPage() {
  return (
    <>
      <PageHeader
        title="Acessos"
        subtitle="Gerencie os usuários e permissões de acesso ao sistema."
      />
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <span className="text-5xl opacity-40">🔑</span>
          <h3 className="text-lg font-bold text-gray-dark opacity-50"
            style={{ fontFamily: 'var(--font-montserrat)' }}>Em desenvolvimento</h3>
          <p className="text-sm text-gray-mid max-w-sm">
            A gestão de acessos será implementada junto com a integração do Supabase Auth.
          </p>
        </div>
      </Card>
    </>
  )
}
