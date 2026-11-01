'use client'
// ─────────────────────────────────────────────────────────────
// src/hooks/useInscricoesRealtime.ts
//
// Hook que escuta mudanças na tabela inscricoes em tempo real
// para uma aula específica, via WebSocket do Supabase Realtime.
//
// PRÉ-REQUISITO:
//   Realtime ativado para a tabela inscricoes no Supabase:
//   Database → Replication → Source Tables → ativar inscricoes
//   (etapa 3A.4)
//
// COMO FUNCIONA:
//   1. Cria um canal WebSocket para events da tabela inscricoes
//      filtrados pelo aulaId específico
//   2. Quando qualquer INSERT/UPDATE/DELETE ocorre naquela aula,
//      o callback re-conta as inscrições ativas via query direta
//   3. O componente que usa o hook recebe a contagem atualizada
//      e re-renderiza sem recarregar a página
//
// POR QUE REBUSAR OS DADOS APÓS O EVENTO?
//   O payload do evento Realtime contém os dados da linha
//   modificada, mas pode estar desatualizado se múltiplas
//   mudanças ocorrerem em rápida sucessão. Fazer uma query
//   fresca após o evento garante a contagem correta.
//
// USO:
//   const inscritos = useInscricoesRealtime(aulaId)
//   // inscritos atualiza automaticamente quando alguém se inscreve/cancela
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { createClient }        from '@/lib/supabase/client'

export function useInscricoesRealtime(aulaId: string): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!aulaId) return

    const supabase = createClient()

    // Busca contagem inicial antes de subscribir
    supabase
      .from('inscricoes')
      .select('id', { count: 'exact', head: true })
      .eq('aula_id', aulaId)
      .eq('lista_espera', false)
      .then(({ count: c }) => setCount(c ?? 0))

    // Cria canal WebSocket específico para esta aula
    const channel = supabase
      .channel(`aula-inscritos-${aulaId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',          // INSERT, UPDATE e DELETE
          schema: 'public',
          table:  'inscricoes',
          filter: `aula_id=eq.${aulaId}`,
        },
        () => {
          // Re-conta após qualquer mudança — mais confiável que o payload do evento
          supabase
            .from('inscricoes')
            .select('id', { count: 'exact', head: true })
            .eq('aula_id', aulaId)
            .eq('lista_espera', false)
            .then(({ count: c }) => setCount(c ?? 0))
        }
      )
      .subscribe()

    // Cleanup: remove o canal ao desmontar o componente
    // Evita memory leak e canais WebSocket órfãos
    return () => {
      supabase.removeChannel(channel)
    }
  }, [aulaId])

  return count
}
