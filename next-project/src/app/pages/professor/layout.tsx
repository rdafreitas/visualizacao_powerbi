// ─────────────────────────────────────────────────────────────
// src/app/pages/professor/layout.tsx
// Layout Server Component do modo Professor.
// Mesmo padrão do admin/layout.tsx — ver comentários lá.
// ─────────────────────────────────────────────────────────────

import { requireAuth }       from '@/(auth)/session'
import { Topbar }            from '@/components/layout/Topbar'
import { ProfessorSidebar }  from '@/components/professor/ProfessorSidebar'

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAuth()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar
        role="professor"
        nome={profile.nome}
        email={profile.email}
      />
      <div className="flex flex-1 overflow-hidden">
        <ProfessorSidebar />
        <main className="prof-main flex-1 p-9 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
