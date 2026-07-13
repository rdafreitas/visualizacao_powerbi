// apps/api/src/modules/tarefa/tarefa.repository.ts
// Repository Pattern: única camada que conhece o Prisma.
// O Service chama APENAS métodos daqui. Zero lógica de negócio aqui.

import type { PrismaClient, Tarefa } from '@prisma/client';
import type { CreateTarefaInput, UpdateTarefaInput } from './tarefa.types';

export class TarefaRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(): Promise<Tarefa[]> {
    return this.db.tarefa.findMany({
      include: { acao: true, vinculadaA: true },
      orderBy: [{ acaoId: 'asc' }, { prioridade: 'asc' }],
    });
  }

  async findById(id: string): Promise<Tarefa | null> {
    return this.db.tarefa.findUnique({
      where: { id },
      include: { acao: true, vinculadaA: { include: { destino: true } } },
    });
  }

  async findByAcao(acaoId: string): Promise<Tarefa[]> {
    return this.db.tarefa.findMany({
      where: { acaoId },
      orderBy: { prioridade: 'asc' },
    });
  }

  async findByAcaoAndPrioridade(
    acaoId: string,
    prioridade: number,
    excludeId?: string
  ): Promise<Tarefa | null> {
    return this.db.tarefa.findFirst({
      where: { acaoId, prioridade, id: excludeId ? { not: excludeId } : undefined },
    });
  }

  async create(data: CreateTarefaInput): Promise<Tarefa> {
    const { vinculadaA = [], ...rest } = data;
    return this.db.tarefa.create({
      data: {
        ...rest,
        vinculadaA: {
          create: vinculadaA.map((destinoId) => ({ destinoId })),
        },
      },
      include: { acao: true },
    });
  }

  async update(id: string, data: UpdateTarefaInput): Promise<Tarefa> {
    const { vinculadaA, ...rest } = data;
    return this.db.tarefa.update({
      where: { id },
      data: {
        ...rest,
        ...(vinculadaA !== undefined && {
          vinculadaA: {
            deleteMany: {},
            create: vinculadaA.map((destinoId) => ({ destinoId })),
          },
        }),
      },
      include: { acao: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.tarefa.delete({ where: { id } });
  }
}
