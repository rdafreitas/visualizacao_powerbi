// ─────────────────────────────────────────────────────────────
// aluno/layout.tsx — versão FRONT-END ESTÁTICO
// Topbar bordô + AlunoSidebar branca + Main aluno-main (globals.css)
// Sem Supabase, sem redirect, sem props de role.
// Quando o back-end for integrado:
//   1. Tornar a função async
//   2. Descomentar getProfile e redirect
//   3. Passar user={profile} para Topbar
// ─────────────────────────────────────────────────────────────

import { Topbar } from '@/components/layout/Topbar'
import { AlunoSidebar } from '@/components/aluno/AlunoSidebar'

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <AlunoSidebar />
        {/* Fundo aluno-main definido em globals.css */}
        <main className="aluno-main flex-1 p-9 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
