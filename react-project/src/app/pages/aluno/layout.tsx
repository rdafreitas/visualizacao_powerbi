// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/layout.tsx
// Layout do modo Aluno — brand-oficial-bordo.
// Topbar bordô + Sidebar + Main off-white #f5f0e8 (padrão)
// ─────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { isAlunoRole, ROLE_HOME } from '@/lib/permissions'
import { Topbar } from '@/components/layout/Topbar'
import { AlunoSidebar } from '@/components/aluno/AlunoSidebar'

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  if (!profile)               redirect('/pages/login')
  if (!isAlunoRole(profile.role)) redirect(ROLE_HOME[profile.role])

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar user={profile} />
      <div className="flex flex-1 overflow-hidden">
        <AlunoSidebar />
        {/* Fundo aluno-main = off-white cálido #f5f0e8 */}
        <main className="aluno-main flex-1 p-9 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
