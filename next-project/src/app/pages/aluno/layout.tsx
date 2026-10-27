// ─────────────────────────────────────────────────────────────
// src/app/pages/aluno/layout.tsx
// Layout Server Component do modo Aluno.
// Mesmo padrão do admin/layout.tsx — ver comentários lá.
// ─────────────────────────────────────────────────────────────

import { requireAuth }   from '@/(auth)/session'
import { Topbar }        from '@/components/layout/Topbar'
import { AlunoSidebar }  from '@/components/aluno/AlunoSidebar'

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAuth()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar
        role="aluno"
        nome={profile.nome}
        email={profile.email}
      />
      <div className="flex flex-1 overflow-hidden">
        <AlunoSidebar />
        <main className="aluno-main flex-1 p-9 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
