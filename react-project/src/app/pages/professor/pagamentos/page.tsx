import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Pagamentos — Professor PaVoar' }

export default async function ProfessorPagamentosPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'professor') redirect('/pages/login')

  return (
    <>
      <PageHeader title="Pagamentos" subtitle="Extrato de remuneração por aula ministrada." />
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <span className="text-5xl opacity-40">💵</span>
          <h3 className="font-poppins text-lg font-bold text-gray-dark opacity-50">Em desenvolvimento</h3>
          <p className="text-sm text-gray-mid max-w-sm">
            O extrato de pagamentos será implementado na próxima fase, com detalhamento por aula e histórico mensal.
          </p>
        </div>
      </Card>
    </>
  )
}
