// apps/api/src/shared/middlewares/errorHandler.middleware.ts

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Erros de validação Zod
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: 'Dados inválidos.',
      statusCode: 422,
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Erros operacionais da aplicação
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Erros inesperados — log e resposta genérica
  console.error('[ERRO NÃO TRATADO]', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor.',
    statusCode: 500,
  });
}
