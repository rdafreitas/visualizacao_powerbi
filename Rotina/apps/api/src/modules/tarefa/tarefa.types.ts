// ─────────────────────────────────────────────────────────
//  apps/api/src/modules/tarefa/tarefa.types.ts
// ─────────────────────────────────────────────────────────

import { z } from 'zod';

export const CreateTarefaSchema = z.object({
  acaoId: z.string().cuid(),
  descricao: z.string().min(1).max(200),
  tipo: z.enum([
    'Videoaula', 'Resumo_Leitura', 'Exercicio_Questoes',
    'Revisao', 'Projeto', 'Treino_Pratica', 'Reuniao', 'Rotineira', 'A_definir',
  ]),
  localPlataforma: z.string().optional().default(''),
  prioridade: z.number().int().min(1).max(99),
  diasParaConcluir: z.number().int().min(1).optional().default(1),
  vinculadaA: z.array(z.string().cuid()).optional().default([]),
});

export const UpdateTarefaSchema = CreateTarefaSchema.partial().omit({ acaoId: true });

export type CreateTarefaInput = z.infer<typeof CreateTarefaSchema>;
export type UpdateTarefaInput = z.infer<typeof UpdateTarefaSchema>;
