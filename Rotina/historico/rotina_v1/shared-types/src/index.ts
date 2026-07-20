// ─────────────────────────────────────────────────────────
//  packages/shared-types/src/index.ts
//  Contratos de domínio compartilhados entre API e Frontend
// ─────────────────────────────────────────────────────────

// ── Enums de domínio ─────────────────────────────────────

export type DiaSemana = '2ª' | '3ª' | '4ª' | '5ª' | '6ª' | 'Sáb' | 'Dom';

export type DuracaoUnidade = 'dias' | 'semanas' | 'meses';

export type StatusAcao =
  | 'Ativo'
  | 'Próximo'
  | 'Reavaliar'
  | 'Permanente'
  | 'Concluído'
  | 'Backlog';

export type TipoAtividade =
  | 'Videoaula'
  | 'Resumo/Leitura'
  | 'Exercício/Questões'
  | 'Revisão'
  | 'Projeto'
  | 'Treino/Prática'
  | 'Reunião'
  | 'Rotineira'
  | 'A definir/Flexível';

export type ResultadoAtividade =
  | 'Feito completamente'
  | 'Feito parcialmente'
  | 'Não feito'
  | 'Adiado';

// ── Ação ─────────────────────────────────────────────────

export interface Acao {
  id: string;
  abreviacao: string;
  foco: string;
  status: StatusAcao;
  prioritaria: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcaoDTO {
  abreviacao: string;
  foco: string;
  status: StatusAcao;
  prioritaria?: boolean;
}

export interface UpdateAcaoDTO extends Partial<CreateAcaoDTO> {}

// ── Bloco ────────────────────────────────────────────────

export interface Bloco {
  id: string;
  nome: string;               // ex: "Bloco_13.07.2026"
  dataInicio: string;         // ISO date
  dataFim: string;            // ISO date
  duracaoValor: number;
  duracaoUnidade: DuracaoUnidade;
  acoes: BlocoAcao[];
  createdAt: string;
  updatedAt: string;
}

export interface BlocoAcao {
  id: string;
  blocoId: string;
  acaoId: string;
  acao: Acao;
  prioritaria: boolean;
  ordem: number;
}

export interface CreateBlocoDTO {
  dataInicio: string;
  duracaoValor: number;
  duracaoUnidade: DuracaoUnidade;
  acoes: Array<{ acaoId: string; prioritaria: boolean; ordem: number }>;
}

export interface UpdateBlocoDTO extends Partial<Omit<CreateBlocoDTO, 'acoes'>> {
  acoes?: Array<{ acaoId: string; prioritaria: boolean; ordem: number }>;
}

// ── Tarefa ───────────────────────────────────────────────

export interface Tarefa {
  id: string;
  acaoId: string;
  acao: Acao;
  descricao: string;
  tipo: TipoAtividade;
  localPlataforma: string;
  prioridade: number;         // único por acaoId
  diasParaConcluir: number;
  vinculadaA: string[];       // ids de outras tarefas
  createdAt: string;
  updatedAt: string;
}

export interface CreateTarefaDTO {
  acaoId: string;
  descricao: string;
  tipo: TipoAtividade;
  localPlataforma?: string;
  prioridade: number;
  diasParaConcluir?: number;
  vinculadaA?: string[];
}

export interface UpdateTarefaDTO extends Partial<CreateTarefaDTO> {}

// ── Horário de Bloco (Editar Blocos) ─────────────────────

export interface HorarioBloco {
  id: string;
  blocoId: string;
  acaoId: string;
  acao: Acao;
  diaSemana: DiaSemana;
  horaInicio: string;         // "HH:MM"
  horaFim: string;            // "HH:MM"
  duracao: string;            // calculada "HH:MM"
  numero: number;
  createdAt: string;
}

export interface CreateHorarioBlocoDTO {
  blocoId: string;
  acaoId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  numero: number;
}

// ── Rotina Atual ─────────────────────────────────────────

export interface LinhaRotina {
  id: string;
  blocoId: string;
  horarioBlocoId: string;
  tarefaId: string | null;
  acao: Acao;
  tarefa: Tarefa | null;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  prioridade: number;
  concluido: boolean;
  resultado: ResultadoAtividade | null;
  togglEntryId: string | null;  // referência Toggl
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLinhaRotinaDTO {
  prioridade?: number;
  concluido?: boolean;
  resultado?: ResultadoAtividade;
  togglEntryId?: string;
}

// ── Histórico ────────────────────────────────────────────

export interface HistoricoBloco {
  id: string;
  blocoId: string;
  bloco: Bloco;
  snapshot: LinhaRotina[];    // estado das tarefas no fechamento
  totalTarefas: number;
  totalConcluidas: number;
  percentualConclusao: number;
  registradoEm: string;
}

// ── Habitica ─────────────────────────────────────────────

export interface HabiticaStats {
  nome: string;
  level: number;
  classe: string;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  exp: number;
  expToNextLevel: number;
  gold: number;
  streak: number;
}

// ── Toggl ────────────────────────────────────────────────

export interface TogglEntry {
  id: string;
  description: string;
  start: string;
  stop: string | null;
  duration: number;           // segundos
  projectId: string | null;
}

export interface StartTogglDTO {
  description: string;
  projectId?: string;
}

// ── Respostas HTTP padronizadas ───────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  statusCode: number;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
