// ─────────────────────────────────────────────────────────────
// src/types/app.ts
// Tipos centrais da aplicação PaVoar
// ─────────────────────────────────────────────────────────────

// ── Roles de acesso ──────────────────────────────────────────
export type Role = 'proprietario' | 'funcionario' | 'professor' | 'aluno'

// ── Permissões granulares ─────────────────────────────────────
export type Permission =
  | 'admin:home'
  | 'admin:alunos'
  | 'admin:agenda'
  | 'admin:professores'
  | 'admin:financeiro'   // somente proprietario
  | 'admin:perfil'       // somente proprietario

// ── Item de navegação na sidebar ─────────────────────────────
export interface NavItem {
  label:      string
  href:       string
  permission: Permission
  icon:       string
}

// ── Perfil do usuário autenticado ────────────────────────────
export interface UserProfile {
  id:         string
  nome:       string
  email:      string
  role:       Role
  telefone?:  string
  avatarUrl?: string
  createdAt?: string
}

// ── Status de matrícula ───────────────────────────────────────
export type MatriculaStatus = 'ativo' | 'inadimplente' | 'trial' | 'inativo'

// ── Aluno (estende UserProfile) ───────────────────────────────
export interface Aluno extends UserProfile {
  plano?:      string
  turmas?:     string
  status?:     MatriculaStatus
  vencimento?: string
}

// ── Aula ──────────────────────────────────────────────────────
export interface Aula {
  id:          string
  nome:        string
  emoji:       string
  instrutor:   string
  instrutorId: string
  local:       string
  nivel:       string
  inicio:      string   // ex: '09:00'
  fim:         string   // ex: '10:30'
  data:        string   // ex: '2026-07-30'
  vagasLivres: number
  total:       number
  inscritos:   Inscrito[]
}

// ── Inscrito em aula ──────────────────────────────────────────
export interface Inscrito {
  id:        string
  nome:      string
  presente:  boolean
  saude?:    string   // descrição da condição de saúde, se houver
}

// ── Plano de matrícula ────────────────────────────────────────
export interface Plano {
  id:         string
  nome:       string
  valor:      number
  maxModal:   number
  fidelidade: number   // meses (0 = sem fidelidade)
}

// ── Treino cadastrado pelo professor ─────────────────────────
export interface Treino {
  id:          string
  professorId: string
  nome:        string
  objetivo?:   string
  valencias:   string[]
  musculos:    string[]
  nivel:       string
  obs?:        string
}

// ── Transação financeira ──────────────────────────────────────
export type TransacaoTipo = 'receita' | 'despesa'

export interface Transacao {
  id:        string
  tipo:      TransacaoTipo
  categoria: string
  descricao: string
  valor:     number
  data:      string   // ISO date
  mes:       string   // primeiro dia do mês (para agrupamento)
}

// ── Pagamento do professor ────────────────────────────────────
export interface PagamentoProfessor {
  id:          string
  professorId: string
  aulaId:      string
  presencas:   number
  valor:       number   // calcValorAula(presencas)
  pago:        boolean
  mes:         string
}
