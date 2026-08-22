import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { isAdminRole, ROLE_HOME } from '@/lib/permissions'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()
  if (!profile)             redirect('/pages/login')
  if (!isAdminRole(profile.role)) redirect(ROLE_HOME[profile.role])

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar user={profile} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={profile.role} />
        <main className="flex-1 p-9 overflow-y-auto min-w-0 bg-gray-bg">
          {children}
        </main>
      </div>
    </div>
  )
}
