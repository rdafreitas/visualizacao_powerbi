// apps/web/src/services/api.service.ts
// Camada única de comunicação HTTP. Todos os hooks usam SOMENTE este módulo.

import type { ApiResponse, ApiError } from '@rotina/shared-types';

const BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3333/api';

class ApiServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  const json = await response.json() as ApiResponse<T> | ApiError;

  if (!json.success) {
    const err = json as ApiError;
    throw new ApiServiceError(err.error, err.statusCode, err.details);
  }

  return (json as ApiResponse<T>).data;
}

// ── Helpers de método ────────────────────────────────────

export const api = {
  get:    <T>(path: string)                    => request<T>(path),
  post:   <T>(path: string, body: unknown)     => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)     => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                    => request<T>(path, { method: 'DELETE' }),
};

// ── Endpoints por domínio ────────────────────────────────

export const tarefaApi = {
  listar:      ()                                    => api.get('/tarefas'),
  criar:       (body: unknown)                       => api.post('/tarefas', body),
  atualizar:   (id: string, body: unknown)           => api.patch(`/tarefas/${id}`, body),
  excluir:     (id: string)                          => api.delete(`/tarefas/${id}`),
};

export const rotinaApi = {
  listar:      (blocoId: string)                     => api.get(`/rotina/${blocoId}`),
  gerar:       (blocoId: string)                     => api.post(`/rotina/${blocoId}/gerar`, {}),
  atualizarLinha: (id: string, body: unknown)        => api.patch(`/rotina/linha/${id}`, body),
  excluirLinha:   (id: string)                       => api.delete(`/rotina/linha/${id}`),
};

export const historicoApi = {
  listar:      ()                                    => api.get('/historico'),
  registrar:   (blocoId: string)                     => api.post(`/historico/${blocoId}`, {}),
};

export const habiticaApi = {
  stats:       ()                                    => api.get('/habitica/stats'),
  marcarHabito:(habitoId: string, direcao: 'up'|'down') => api.post(`/habitica/habitos/${habitoId}/${direcao}`, {}),
};

export const togglApi = {
  iniciar:     (body: unknown)                       => api.post('/toggl/iniciar', body),
  parar:       ()                                    => api.post('/toggl/parar', {}),
  entryAtual:  ()                                    => api.get('/toggl/atual'),
};
