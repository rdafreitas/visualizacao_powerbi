import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { RotinaService } from './rotina.service';
import * as http from '../../shared/helpers/http.helper';
export function rotinaRoutes(db: PrismaClient): Router {
  const router = Router();
  const service = new RotinaService(db);
  router.get('/:blocoId',         async (req, res) => { const d = await service.listarPorBloco(req.params.blocoId!); http.ok(res, d); });
  router.post('/:blocoId/gerar',  async (req, res) => { const d = await service.gerarDoBloco(req.params.blocoId!);  http.created(res, d); });
  router.patch('/linha/:id',      async (req, res) => { const d = await service.atualizarLinha(req.params.id!, req.body); http.ok(res, d); });
  router.delete('/linha/:id',     async (req, res) => { await service.excluirLinha(req.params.id!); http.noContent(res); });
  return router;
}
