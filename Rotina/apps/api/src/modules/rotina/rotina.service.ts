// apps/api/src/modules/rotina/rotina.service.ts
// Regra principal: gerar a rotina cruzando horários × tarefas por prioridade.
// A alteração de prioridade aqui propaga de volta para Tarefa (bidirecional).

import type { PrismaClient, LinhaRotina } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError';

export class RotinaService {
  constructor(private readonly db: PrismaClient) {}

  async listarPorBloco(blocoId: string): Promise<LinhaRotina[]> {
    return this.db.linhaRotina.findMany({
      where: { blocoId },
      include: { acao: true, tarefa: true, horarioBloco: true },
      orderBy: [
        { diaSemana: 'asc' },
        { horaInicio: 'asc' },
      ],
    });
  }

  // Gera todas as LinhasRotina a partir dos HorariosBlocos × Tarefas
  async gerarDoBloco(blocoId: string): Promise<LinhaRotina[]> {
    const bloco = await this.db.bloco.findUnique({
      where: { id: blocoId },
      include: {
        horarios: { include: { acao: true } },
        acoes:    { include: { acao: { include: { tarefas: { orderBy: { prioridade: 'asc' } } } } } },
      },
    });
    if (!bloco) throw new NotFoundError('Bloco');

    // Remove rotina existente do bloco antes de regenerar
    await this.db.linhaRotina.deleteMany({ where: { blocoId } });

    const linhas = bloco.horarios.map((h) => {
      const blocoAcao = bloco.acoes.find((ba) => ba.acaoId === h.acaoId);
      // Pega a tarefa de menor prioridade disponível
      const tarefa = blocoAcao?.acao.tarefas[0] ?? null;

      return {
        blocoId,
        horarioBlocoId: h.id,
        acaoId: h.acaoId,
        tarefaId: tarefa?.id ?? null,
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFim: h.horaFim,
        prioridade: tarefa?.prioridade ?? 0,
      };
    });

    await this.db.linhaRotina.createMany({ data: linhas });

    return this.listarPorBloco(blocoId);
  }

  async atualizarLinha(
    id: string,
    data: {
      prioridade?: number;
      concluido?: boolean;
      resultado?: string;
      togglEntryId?: string;
    }
  ): Promise<LinhaRotina> {
    const linha = await this.db.linhaRotina.findUnique({ where: { id }, include: { tarefa: true } });
    if (!linha) throw new NotFoundError('Linha de Rotina');

    // Se alterou prioridade e a linha tem tarefa → propaga para Tarefa (sincronização bidirecional)
    if (data.prioridade !== undefined && linha.tarefaId) {
      const conflito = await this.db.tarefa.findFirst({
        where: {
          acaoId: linha.acaoId,
          prioridade: data.prioridade,
          id: { not: linha.tarefaId },
        },
      });
      if (conflito) {
        throw new ConflictError(
          `Prioridade ${data.prioridade} já em uso na ação por: "${conflito.descricao}"`
        );
      }
      await this.db.tarefa.update({
        where: { id: linha.tarefaId },
        data: { prioridade: data.prioridade },
      });
    }

    return this.db.linhaRotina.update({ where: { id }, data, include: { acao: true, tarefa: true } });
  }

  async adicionarManual(data: {
    blocoId: string;
    horarioBlocoId: string;
    acaoId: string;
    tarefaId?: string;
    diaSemana: string;
    horaInicio: string;
    horaFim: string;
    prioridade?: number;
  }): Promise<LinhaRotina> {
    return this.db.linhaRotina.create({ data: data as Parameters<typeof this.db.linhaRotina.create>[0]['data'], include: { acao: true, tarefa: true } });
  }

  async excluirLinha(id: string): Promise<void> {
    await this.db.linhaRotina.delete({ where: { id } });
  }
}
