import { Topbar } from '@/components/layout/Topbar'
import { ProfessorSidebar } from '@/components/professor/ProfessorSidebar'

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar role="professor" />
      <div className="flex flex-1 overflow-hidden">
        <ProfessorSidebar />
        <main className="prof-main flex-1 p-9 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
