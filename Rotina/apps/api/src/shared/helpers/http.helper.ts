// apps/api/src/shared/helpers/http.helper.ts
// Padroniza TODAS as respostas da API. Nunca chamar res.json() diretamente nos controllers.

import type { Response } from 'express';
import type { ApiResponse, ApiError } from '@rotina/shared-types';

// ── 2xx ──────────────────────────────────────────────────

export function ok<T>(res: Response, data: T, message?: string): void {
  const payload: ApiResponse<T> = { success: true, data, message };
  res.status(200).json(payload);
}

export function created<T>(res: Response, data: T, message?: string): void {
  const payload: ApiResponse<T> = { success: true, data, message };
  res.status(201).json(payload);
}

export function noContent(res: Response): void {
  res.status(204).send();
}

// ── 4xx ──────────────────────────────────────────────────

export function badRequest(res: Response, error: string, details?: unknown): void {
  const payload: ApiError = { success: false, error, statusCode: 400, details };
  res.status(400).json(payload);
}

export function notFound(res: Response, resource = 'Recurso'): void {
  const payload: ApiError = { success: false, error: `${resource} não encontrado.`, statusCode: 404 };
  res.status(404).json(payload);
}

export function conflict(res: Response, error: string): void {
  const payload: ApiError = { success: false, error, statusCode: 409 };
  res.status(409).json(payload);
}

export function unprocessable(res: Response, error: string, details?: unknown): void {
  const payload: ApiError = { success: false, error, statusCode: 422, details };
  res.status(422).json(payload);
}

// ── 5xx ──────────────────────────────────────────────────

export function serverError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
  const payload: ApiError = { success: false, error: message, statusCode: 500 };
  res.status(500).json(payload);
}
