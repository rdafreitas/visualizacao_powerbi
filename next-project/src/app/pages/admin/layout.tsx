// ─────────────────────────────────────────────────────────────
// admin/layout.tsx — versão FRONT-END ESTÁTICO
// Topbar laranja + Sidebar #fef3e8 + Main admin-main (globals.css)
// Sem Supabase, sem redirect, sem props de role.
// Quando o back-end for integrado:
//   1. Tornar a função async
//   2. Descomentar getProfile, redirect e isAdminRole
//   3. Passar user={profile} para Topbar e role={profile.role} para Sidebar
// ─────────────────────────────────────────────────────────────

import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {/* Fundo admin-main definido em globals.css */}
        <main className="admin-main flex-1 p-9 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
