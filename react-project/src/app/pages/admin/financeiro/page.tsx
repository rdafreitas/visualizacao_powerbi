import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'Financeiro — PaVoar Admin' }

export default async function AdminFinanceiroPage() {
  const profile = await getProfile()
  if (!profile) redirect('/pages/login')
  if (!hasPermission(profile.role, 'admin:financeiro')) redirect('/pages/admin/home')

  return (
    <>
      <PageHeader title="Financeiro" subtitle="Esta tela será implementada na próxima fase." />
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <span className="text-5xl opacity-40">🚧</span>
          <h3 className="font-poppins text-lg font-bold text-gray-dark opacity-50">Em desenvolvimento</h3>
          <p className="text-sm text-gray-mid max-w-sm">
            A tela de financeiro do modo Administrador será implementada na próxima fase de desenvolvimento.
          </p>
        </div>
      </Card>
    </>
  )
}
