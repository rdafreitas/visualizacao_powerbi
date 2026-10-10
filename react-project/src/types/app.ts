// ─────────────────────────────────────────────────────────────
// src/types/app.ts
// Tipos centrais da aplicação PaVoar
// ─────────────────────────────────────────────────────────────

// ── Roles de acesso ──────────────────────────────────────────
export type Role = 'proprietario' | 'funcionario' | 'professor' | 'aluno'

// ── Permissões granulares ─────────────────────────────────────
export type Permission =
  // Admin
  | 'admin:home'
  | 'admin:alunos'
  | 'admin:agenda'
  | 'admin:professores'
  | 'admin:financeiro'
  | 'admin:perfil'
  | 'admin:perfil:acessos'
  // Professor
  | 'professor:home'
  | 'professor:treinos'
  | 'professor:agenda'
  | 'professor:pagamentos'
  | 'professor:perfil'
  // Aluno
  | 'aluno:home'
  | 'aluno:evolucao'
  | 'aluno:agenda'
  | 'aluno:pagamentos'
  | 'aluno:perfil'

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

// ── Credencial de acesso (profiles_credencial) ───────────────
export interface UserCredencial {
  profileId:    string
  email:        string
  ativo:        boolean
  ultimoAcesso: string | null
  criadoPor:    string | null
  updatedAt:    string
}

// ── Usuário com credencial (join profiles + profiles_credencial) ──
export interface UsuarioCompleto extends UserProfile {
  ativo:        boolean
  ultimoAcesso: string | null
  criadoPor:    string | null
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
  inicio:      string
  fim:         string
  data:        string
  vagasLivres: number
  total:       number
  inscritos:   Inscrito[]
}

// ── Inscrito em aula ──────────────────────────────────────────
export interface Inscrito {
  id:       string
  nome:     string
  presente: boolean
  saude?:   string
}

// ── Plano de matrícula ────────────────────────────────────────
export interface Plano {
  id:         string
  nome:       string
  valor:      number
  maxModal:   number
  fidelidade: number
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
  data:      string
  mes:       string
}

// ── Pagamento do professor ────────────────────────────────────
export interface PagamentoProfessor {
  id:          string
  professorId: string
  aulaId:      string
  presencas:   number
  valor:       number
  pago:        boolean
  mes:         string
}

// ── Aviso para professor (painel inicial) ─────────────────────
export type AvisoTipo = 'pagamento' | 'treino' | 'urgente' | 'saude' | 'trial'

export interface Aviso {
  id:    string
  tipo:  AvisoTipo
  titulo: string
  corpo?: string
  badge?: string
}

// ── XP e nível do aluno ───────────────────────────────────────
export interface XPData {
  total:        number
  nivel:        number
  nomeNivel:    string
  emoji:        string
  xpParaProx:   number
  aulas:        number
  presenca:     number   // 0-100
  mediaAval:    number   // 0-5
}

// ── Habilidade do aluno ───────────────────────────────────────
export interface Habilidade {
  id:       string
  emoji:    string
  nome:     string
  modal:    string   // modalidade
  nivel:    number   // 1-5
  nova:     boolean
  descricao?: string
}

// ── Histórico de aula do aluno ────────────────────────────────
export interface HistoricoAula {
  id:        string
  emoji:     string
  nome:      string
  data:      string
  presente:  boolean
  habilidades: string[]
  avaliacao?: number   // estrelas 1-5
}
