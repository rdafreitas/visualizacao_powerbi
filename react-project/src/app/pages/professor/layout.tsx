// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/layout.tsx
// Layout do modo Professor — brand-chumbo.
// Topbar chumbo + Sidebar #f0edeb + Main #f4f2f0 (prof-main)
// ─────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/server'
import { isProfessorRole, ROLE_HOME } from '@/lib/permissions'
import { Topbar } from '@/components/layout/Topbar'
import { ProfessorSidebar } from '@/components/professor/ProfessorSidebar'

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  if (!profile)                       redirect('/pages/login')
  if (!isProfessorRole(profile.role)) redirect(ROLE_HOME[profile.role])

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar user={profile} />
      <div className="flex flex-1 overflow-hidden">
        <ProfessorSidebar />
        {/* Fundo prof-main definido em globals.css */}
        <main className="prof-main flex-1 p-9 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
