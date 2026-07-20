import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
export function historicoRoutes(_db: PrismaClient): Router {
  const router = Router();
  router.get('/', (_req, res) => res.json({ success: true, data: [], message: 'Módulo historico em desenvolvimento' }));
  return router;
}
