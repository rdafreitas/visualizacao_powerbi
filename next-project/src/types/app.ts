// ─────────────────────────────────────────────────────────────
// src/types/app.ts
// Tipos centrais da aplicação Andorin
// ─────────────────────────────────────────────────────────────

// ── Roles de acesso ──────────────────────────────────────────
export type Role = 'proprietario' | 'funcionario' | 'professor' | 'aluno'

// ── Permissões granulares ─────────────────────────────────────
export type Permission =
  | 'admin:home'
  | 'admin:alunos'
  | 'admin:agenda'
  | 'admin:professores'
  | 'admin:financeiro'       // somente proprietario
  | 'admin:perfil'           // somente proprietario
  | 'admin:perfil:acessos'   // sub-aba de acessos dentro de Perfil

// ── Item de navegação na sidebar ─────────────────────────────
export interface NavItem {
  label:      string
  href:       string
  permission: Permission
  icon:       string
}

// ── Perfil do usuário autenticado ────────────────────────────
// Retornado por getProfile() em src/lib/supabase/server.ts.
// xpTotal espelha profiles.xp_total — atualizado por trigger.
export interface UserProfile {
  id:         string
  nome:       string
  email:      string
  role:       Role
  xpTotal?:   number      // acumulador de XP (profiles.xp_total)
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
// "experimental" é o nome padrão deste projeto (equivale a "trial").
// Padronizado em todos os arquivos — não usar "trial".
export type MatriculaStatus = 'ativo' | 'inadimplente' | 'experimental' | 'inativo'

// ── Aluno (estende UserProfile) ───────────────────────────────
export interface Aluno extends UserProfile {
  plano?:      string
  turmas?:     string
  status?:     MatriculaStatus
  vencimento?: string
}

// ── Tipos de modalidades ──────────────────────────────────────
export type ModalidadeType = 'aéreos' | 'musculação' | 'danças' | 'personal'

// ── Modalidade do professor ───────────────────────────────────
// Espelha professor_modalidades no banco.
export interface Modalidades {
  modalidadeId:   string
  tipo:           ModalidadeType
  ativo:          boolean
  dataCadastrado: string | null
  updatedAt:      string
}

// ── Professor (estende UserProfile) ───────────────────────────
export interface Professor extends UserProfile {
  pagamento?:   string
  modalidades?: Modalidades
  status?:      MatriculaStatus
}

// ── Aula ──────────────────────────────────────────────────────
export interface Aula {
  id:          string
  nome:        string
  emoji:       string
  instrutor:   Professor
  instrutorId: string
  local:       string
  inicio:      string
  fim:         string
  data:        string
  vagasLivres: number
  total:       number
  inscritos:   Inscrito[]
  status:      'agendada' | 'cancelada' | 'concluida'
}

// ── Inscrito em aula ──────────────────────────────────────────
export interface Inscrito {
  id:       string
  nome:     string
  presente: boolean
  saude?:   string    // restrição ativa (aluno_restricoes)
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
  series?:     string
  obs?:        string
}

// ── Transação financeira ──────────────────────────────────────
export type TransacaoTipo = 'receita' | 'despesa'
export type MetodoPagamento = 'pix' | 'cartao' | 'boleto' | 'transferencia' | 'dinheiro'

export interface Transacao {
  id:               string
  tipo:             TransacaoTipo
  categoria:        string
  descricao:        string | null
  valor:            number
  metodoPagamento?: MetodoPagamento
  data:             string
  mes:              string
}

// ── Pagamento do professor ────────────────────────────────────
export interface PagamentoProfessor {
  id:           string
  professorId:  string
  aulaId:       string
  presencas:    number
  valor:        number
  pago:         boolean
  notaFiscalId?: string
  mes:          string
}

// ── Aviso do professor (retornado por get_avisos_professor) ───
export interface AvisoProfessor {
  tipo:    string
  titulo:  string
  corpo:   string
  aulaId:  string
  urgente: boolean
}
