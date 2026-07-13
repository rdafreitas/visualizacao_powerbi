// apps/web/src/services/queryClient.ts
// Configura o QueryClient com persistência no localStorage.
// Dados sobrevivem ao reload — comportamento offline-first.

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tenta do cache antes de ir à rede
      staleTime: 1000 * 60 * 5,       // 5 min
      gcTime:    1000 * 60 * 60 * 24, // 24h no cache
      retry: (failureCount, error) => {
        // Não retenta erros 4xx (problema do cliente, não da rede)
        if (error instanceof Error && error.message.includes('4')) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,     // offline-first: não refetch automático ao focar
    },
    mutations: {
      retry: 1,
    },
  },
});

// ── Persistência localStorage ─────────────────────────────
// Salva o cache do React Query no localStorage a cada mutação.
// Restaura ao inicializar o app.

const CACHE_KEY = 'rotina-query-cache';

export function persistirCache(): void {
  const cache = queryClient.getQueryCache().getAll();
  const serializavel = cache
    .filter((q) => q.state.status === 'success')
    .map((q) => ({ queryKey: q.queryKey, data: q.state.data, updatedAt: q.state.dataUpdatedAt }));

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(serializavel));
  } catch {
    // Quota excedida — limpa entradas mais antigas
    localStorage.removeItem(CACHE_KEY);
  }
}

export function restaurarCache(): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;

    const entradas = JSON.parse(raw) as Array<{
      queryKey: unknown[];
      data: unknown;
      updatedAt: number;
    }>;

    entradas.forEach(({ queryKey, data, updatedAt }) => {
      // Só restaura se os dados têm menos de 24h
      const idadeMs = Date.now() - updatedAt;
      if (idadeMs < 1000 * 60 * 60 * 24) {
        queryClient.setQueryData(queryKey, data);
      }
    });
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
}
