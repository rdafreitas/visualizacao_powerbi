// ─────────────────────────────────────────────────────────────
// src/app/pages/admin/layout.tsx
//
// Layout Server Component do modo Admin.
//
// POR QUE async E requireAuth()?
//   async → permite chamar requireAuth() que é assíncrona
//            (faz getUser() no Supabase e SELECT no banco)
//
//   requireAuth() → importado de (auth)/session.ts
//                   se não houver sessão válida, redireciona
//                   automaticamente para LOGIN_ROUTE (/)
//                   sem precisar de if (!profile) redirect(...)
//
// DUPLA PROTEÇÃO:
//   1ª camada → middleware.ts (antes de renderizar qualquer coisa)
//   2ª camada → requireAuth() aqui (antes de montar o layout)
//   Se o middleware falhar por qualquer razão, o layout ainda
//   garante que nenhum conteúdo protegido seja exibido.
// ─────────────────────────────────────────────────────────────

import { requireAuth } from '@/(auth)/session'
import { Topbar }      from '@/components/layout/Topbar'
import { Sidebar }     from '@/components/layout/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verifica sessão no servidor e obtém o perfil real.
  // Redireciona para / automaticamente se não houver sessão.
  const profile = await requireAuth()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Passa nome e email reais — removido DEMO_USER */}
      <Topbar
        role="admin"
        nome={profile.nome}
        email={profile.email}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="admin-main flex-1 p-9 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
