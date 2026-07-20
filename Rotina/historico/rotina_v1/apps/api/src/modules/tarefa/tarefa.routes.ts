// apps/api/src/modules/tarefa/tarefa.routes.ts

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { TarefaRepository } from './tarefa.repository';
import { TarefaService } from './tarefa.service';
import { TarefaController } from './tarefa.controller';

export function tarefaRoutes(db: PrismaClient): Router {
  const router = Router();

  // Injeção de dependência manual (sem container IoC por ora)
  const repository = new TarefaRepository(db);
  const service    = new TarefaService(repository);
  const controller = new TarefaController(service);

  router.get('/',      controller.listar);
  router.get('/:id',   controller.buscarPorId);
  router.post('/',     controller.criar);
  router.patch('/:id', controller.atualizar);
  router.delete('/:id',controller.excluir);

  return router;
}
