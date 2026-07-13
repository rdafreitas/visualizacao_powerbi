// apps/api/src/modules/acao/acao.routes.ts
import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';

export function acaoRoutes(_db: PrismaClient): Router {
  const router = Router();
  // TODO: implementar seguindo o mesmo padrão de tarefa.routes.ts
  // AcaoRepository → AcaoService → AcaoController → Routes
  router.get('/', (_req, res) => res.json({ success: true, data: [] }));
  return router;
}

// ─────────────────────────────────────────────────────────
// apps/api/src/modules/bloco/bloco.routes.ts
// ─────────────────────────────────────────────────────────
