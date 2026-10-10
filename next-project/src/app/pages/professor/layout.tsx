// ─────────────────────────────────────────────────────────────
// professor/layout.tsx — versão FRONT-END ESTÁTICO
// Topbar chumbo + ProfessorSidebar #f0edeb + Main prof-main (globals.css)
// Sem Supabase, sem redirect, sem props de role.
// Quando o back-end for integrado:
//   1. Tornar a função async
//   2. Descomentar getProfile e redirect
//   3. Passar user={profile} para Topbar
// ─────────────────────────────────────────────────────────────

import { Topbar } from '@/components/layout/Topbar'
import { ProfessorSidebar } from '@/components/professor/ProfessorSidebar'

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
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
