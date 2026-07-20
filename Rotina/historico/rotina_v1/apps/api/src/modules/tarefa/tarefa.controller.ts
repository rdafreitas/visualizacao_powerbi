// apps/api/src/modules/tarefa/tarefa.controller.ts
// Controller: única responsabilidade é orquestrar req → service → res.
// Não contém lógica de negócio.

import type { Request, Response } from 'express';
import { CreateTarefaSchema, UpdateTarefaSchema } from './tarefa.types';
import type { TarefaService } from './tarefa.service';
import * as http from '../../shared/helpers/http.helper';

export class TarefaController {
  constructor(private readonly service: TarefaService) {}

  listar = async (_req: Request, res: Response): Promise<void> => {
    const tarefas = await this.service.listar();
    http.ok(res, tarefas);
  };

  buscarPorId = async (req: Request, res: Response): Promise<void> => {
    const tarefa = await this.service.buscarPorId(req.params['id']!);
    http.ok(res, tarefa);
  };

  criar = async (req: Request, res: Response): Promise<void> => {
    const input = CreateTarefaSchema.parse(req.body);
    const nova = await this.service.criar(input);
    http.created(res, nova, 'Tarefa criada com sucesso.');
  };

  atualizar = async (req: Request, res: Response): Promise<void> => {
    const input = UpdateTarefaSchema.parse(req.body);
    const atualizada = await this.service.atualizar(req.params['id']!, input);
    http.ok(res, atualizada, 'Tarefa atualizada.');
  };

  excluir = async (req: Request, res: Response): Promise<void> => {
    await this.service.excluir(req.params['id']!);
    http.noContent(res);
  };
}
