import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
export function blocoRoutes(_db: PrismaClient): Router {
  const router = Router();
  router.get('/', (_req, res) => res.json({ success: true, data: [], message: 'Módulo bloco em desenvolvimento' }));
  return router;
}
