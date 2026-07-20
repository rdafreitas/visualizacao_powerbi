// apps/api/src/modules/tarefa/tarefa.service.ts
// Regras de negócio isoladas. Não conhece Request/Response.

import type { Tarefa } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';
import type { TarefaRepository } from './tarefa.repository';
import type { CreateTarefaInput, UpdateTarefaInput } from './tarefa.types';

export class TarefaService {
  constructor(private readonly repo: TarefaRepository) {}

  async listar(): Promise<Tarefa[]> {
    return this.repo.findAll();
  }

  async buscarPorId(id: string): Promise<Tarefa> {
    const tarefa = await this.repo.findById(id);
    if (!tarefa) throw new NotFoundError('Tarefa');
    return tarefa;
  }

  async criar(input: CreateTarefaInput): Promise<Tarefa> {
    // Regra de negócio: prioridade deve ser única dentro da mesma ação
    const conflito = await this.repo.findByAcaoAndPrioridade(input.acaoId, input.prioridade);
    if (conflito) {
      throw new ConflictError(
        `A ação já possui uma tarefa com prioridade ${input.prioridade}: "${conflito.descricao}"`
      );
    }
    return this.repo.create(input);
  }

  async atualizar(id: string, input: UpdateTarefaInput): Promise<Tarefa> {
    const existente = await this.repo.findById(id);
    if (!existente) throw new NotFoundError('Tarefa');

    // Verifica conflito de prioridade ao alterar (exclui o próprio registro da checagem)
    if (input.prioridade !== undefined) {
      const conflito = await this.repo.findByAcaoAndPrioridade(
        existente.acaoId,
        input.prioridade,
        id
      );
      if (conflito) {
        throw new ConflictError(
          `A ação já possui uma tarefa com prioridade ${input.prioridade}: "${conflito.descricao}"`
        );
      }
    }

    return this.repo.update(id, input);
  }

  async excluir(id: string): Promise<void> {
    const existente = await this.repo.findById(id);
    if (!existente) throw new NotFoundError('Tarefa');
    await this.repo.delete(id);
  }
}
