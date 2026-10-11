import { Topbar } from '@/components/layout/Topbar'
import { AlunoSidebar } from '@/components/aluno/AlunoSidebar'

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar role="aluno" />
      <div className="flex flex-1 overflow-hidden">
        <AlunoSidebar />
        <main className="aluno-main flex-1 p-9 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
