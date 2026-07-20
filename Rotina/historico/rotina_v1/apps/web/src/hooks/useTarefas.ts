// apps/web/src/hooks/useTarefas.ts
// TanStack Query: gerencia cache, loading, error e optimistic updates.
// Persistência offline via localStorage integrada ao QueryClient (ver queryClient.ts).

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { tarefaApi } from '../services/api.service';
import type { Tarefa, CreateTarefaDTO, UpdateTarefaDTO } from '@rotina/shared-types';

// ── Query Keys centralizadas (evita magic strings) ────────

export const TAREFA_KEYS = {
  all:       ['tarefas']                   as const,
  byAcao:    (acaoId: string) => ['tarefas', 'acao', acaoId] as const,
  detail:    (id: string)     => ['tarefas', 'detail', id]   as const,
} as const;

// ── Hook principal ────────────────────────────────────────

export function useTarefas() {
  const queryClient = useQueryClient();

  // ── Leitura ───────────────────────────────────────────

  const {
    data: tarefas = [],
    isLoading,
    isError,
    error,
  } = useQuery<Tarefa[]>({
    queryKey: TAREFA_KEYS.all,
    queryFn:  () => tarefaApi.listar() as Promise<Tarefa[]>,
    staleTime: 1000 * 60 * 5, // 5 min antes de refetch automático
  });

  // ── Derivados com useMemo (evita recalcular a cada render) ──

  const tarefasPorAcao = useMemo(() => {
    return tarefas.reduce<Record<string, Tarefa[]>>((acc, t) => {
      if (!acc[t.acaoId]) acc[t.acaoId] = [];
      acc[t.acaoId]!.push(t);
      return acc;
    }, {});
  }, [tarefas]);

  const prioridadesEmUso = useCallback(
    (acaoId: string, excludeId?: string): number[] =>
      (tarefasPorAcao[acaoId] ?? [])
        .filter((t) => t.id !== excludeId)
        .map((t) => t.prioridade),
    [tarefasPorAcao]
  );

  // ── Criar ─────────────────────────────────────────────

  const criar = useMutation<Tarefa, Error, CreateTarefaDTO>({
    mutationFn: (input) => tarefaApi.criar(input) as Promise<Tarefa>,
    // Optimistic update: insere na cache antes da resposta da API
    onMutate: async (nova) => {
      await queryClient.cancelQueries({ queryKey: TAREFA_KEYS.all });
      const anterior = queryClient.getQueryData<Tarefa[]>(TAREFA_KEYS.all);

      queryClient.setQueryData<Tarefa[]>(TAREFA_KEYS.all, (old = []) => [
        ...old,
        { ...nova, id: `temp-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Tarefa,
      ]);

      return { anterior }; // contexto para rollback
    },
    onError: (_err, _nova, ctx) => {
      // Rollback em caso de erro
      if (ctx?.anterior) {
        queryClient.setQueryData(TAREFA_KEYS.all, ctx.anterior);
      }
    },
    onSettled: () => {
      // Sempre revalida após criar (seja sucesso ou erro)
      queryClient.invalidateQueries({ queryKey: TAREFA_KEYS.all });
    },
  });

  // ── Atualizar ─────────────────────────────────────────

  const atualizar = useMutation<
    Tarefa,
    Error,
    { id: string; data: UpdateTarefaDTO }
  >({
    mutationFn: ({ id, data }) => tarefaApi.atualizar(id, data) as Promise<Tarefa>,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: TAREFA_KEYS.all });
      const anterior = queryClient.getQueryData<Tarefa[]>(TAREFA_KEYS.all);

      queryClient.setQueryData<Tarefa[]>(TAREFA_KEYS.all, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, ...data } : t))
      );

      return { anterior };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.anterior) queryClient.setQueryData(TAREFA_KEYS.all, ctx.anterior);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TAREFA_KEYS.all });
    },
  });

  // ── Excluir ───────────────────────────────────────────

  const excluir = useMutation<void, Error, string>({
    mutationFn: (id) => tarefaApi.excluir(id) as Promise<void>,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TAREFA_KEYS.all });
      const anterior = queryClient.getQueryData<Tarefa[]>(TAREFA_KEYS.all);
      queryClient.setQueryData<Tarefa[]>(TAREFA_KEYS.all, (old = []) =>
        old.filter((t) => t.id !== id)
      );
      return { anterior };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.anterior) queryClient.setQueryData(TAREFA_KEYS.all, ctx.anterior);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TAREFA_KEYS.all });
    },
  });

  return {
    // Estado
    tarefas,
    tarefasPorAcao,
    isLoading,
    isError,
    error,
    // Derivados
    prioridadesEmUso,
    // Mutações
    criar,
    atualizar,
    excluir,
  };
}
