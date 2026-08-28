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
  | 'admin:financeiro'        // somente proprietario
  | 'admin:perfil'            // somente proprietario
  | 'admin:perfil:acessos'    // sub-aba de acessos dentro de Perfil

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
