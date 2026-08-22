// ─────────────────────────────────────────────────────────────
// src/types/database.ts
// Tipos espelhando as tabelas do Supabase (PostgreSQL)
// Substitua pelo output de `supabase gen types typescript` após
// configurar o projeto no Supabase.
// ─────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:          string
          nome:        string
          role:        'proprietario' | 'funcionario' | 'professor' | 'aluno'
          telefone:    string | null
          avatar_url:  string | null
          created_at:  string
        }
        Insert: {
          id:          string
          nome:        string
          role:        'proprietario' | 'funcionario' | 'professor' | 'aluno'
          telefone?:   string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          nome?:       string
          role?:       'proprietario' | 'funcionario' | 'professor' | 'aluno'
          telefone?:   string | null
          avatar_url?: string | null
        }
      }
      planos: {
        Row: {
          id:         string
          nome:       string
          valor:      number
          max_modal:  number
          fidelidade: number
        }
        Insert: {
          id?:        string
          nome:       string
          valor:      number
          max_modal:  number
          fidelidade: number
        }
        Update: {
          nome?:       string
          valor?:      number
          max_modal?:  number
          fidelidade?: number
        }
      }
      matriculas: {
        Row: {
          id:         string
          aluno_id:   string
          plano_id:   string
          status:     'ativo' | 'inadimplente' | 'trial' | 'inativo'
          inicio:     string
          vencimento: string
        }
        Insert: {
          id?:        string
          aluno_id:   string
          plano_id:   string
          status:     'ativo' | 'inadimplente' | 'trial' | 'inativo'
          inicio:     string
          vencimento: string
        }
        Update: {
          status?:     'ativo' | 'inadimplente' | 'trial' | 'inativo'
          vencimento?: string
        }
      }
      aulas: {
        Row: {
          id:           string
          nome:         string
          emoji:        string | null
          instrutor_id: string
          local:        string | null
          nivel:        string | null
          inicio:       string
          fim:          string
          vagas:        number
        }
        Insert: {
          id?:           string
          nome:          string
          emoji?:        string | null
          instrutor_id:  string
          local?:        string | null
          nivel?:        string | null
          inicio:        string
          fim:           string
          vagas:         number
        }
        Update: {
          nome?:         string
          emoji?:        string | null
          instrutor_id?: string
          local?:        string | null
          nivel?:        string | null
          inicio?:       string
          fim?:          string
          vagas?:        number
        }
      }
      inscricoes: {
        Row: {
          id:       string
          aula_id:  string
          aluno_id: string
          presente: boolean
        }
        Insert: {
          id?:      string
          aula_id:  string
          aluno_id: string
          presente?: boolean
        }
        Update: {
          presente?: boolean
        }
      }
      pagamentos_professores: {
        Row: {
          id:           string
          professor_id: string
          aula_id:      string
          presencas:    number
          valor:        number
          pago:         boolean
          mes:          string
        }
        Insert: {
          id?:          string
          professor_id: string
          aula_id:      string
          presencas:    number
          valor:        number
          pago?:        boolean
          mes:          string
        }
        Update: {
          pago?:     boolean
          presencas?: number
          valor?:    number
        }
      }
      treinos: {
        Row: {
          id:           string
          professor_id: string
          nome:         string
          objetivo:     string | null
          valencias:    string[]
          musculos:     string[]
          nivel:        string | null
          obs:          string | null
        }
        Insert: {
          id?:          string
          professor_id: string
          nome:         string
          objetivo?:    string | null
          valencias?:   string[]
          musculos?:    string[]
          nivel?:       string | null
          obs?:         string | null
        }
        Update: {
          nome?:      string
          objetivo?:  string | null
          valencias?: string[]
          musculos?:  string[]
          nivel?:     string | null
          obs?:       string | null
        }
      }
      transacoes: {
        Row: {
          id:        string
          tipo:      'receita' | 'despesa'
          categoria: string
          descricao: string | null
          valor:     number
          data:      string
          mes:       string
        }
        Insert: {
          id?:       string
          tipo:      'receita' | 'despesa'
          categoria: string
          descricao?: string | null
          valor:     number
          data:      string
          mes:       string
        }
        Update: {
          tipo?:      'receita' | 'despesa'
          categoria?: string
          descricao?: string | null
          valor?:     number
          data?:      string
          mes?:       string
        }
      }
    }
    Views:  Record<string, never>
    Functions: Record<string, never>
    Enums:  Record<string, never>
  }
}
