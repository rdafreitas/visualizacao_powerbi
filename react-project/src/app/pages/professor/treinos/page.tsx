import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Treinos — Professor PaVoar' }

export default async function ProfessorTreinosPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'professor') redirect('/pages/login')

  return (
    <>
      <PageHeader title="Biblioteca de Treinos" subtitle="Exercícios cadastrados por você." />
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <span className="text-5xl opacity-40">🏋️</span>
          <h3 className="font-poppins text-lg font-bold text-gray-dark opacity-50">Em desenvolvimento</h3>
          <p className="text-sm text-gray-mid max-w-sm">
            A biblioteca de treinos será implementada na próxima fase, com filtros por valência, cadastro e edição de exercícios.
          </p>
        </div>
      </Card>
    </>
  )
}
