import { PageHeader }   from '@/components/layout/PageHeader'
import { Card }          from '@/components/ui/Card'
import { AcessosClient } from '../AcessosClient'

export const metadata = { title: 'Acessos — Andorin Admin' }

export default function AcessosPage() {
  return (
    <>
      <PageHeader
        title="Acessos"
        subtitle="Gerencie os usuários e permissões de acesso ao sistema."
      />
      <Card>
        <AcessosClient />
      </Card>
    </>
  )
}
