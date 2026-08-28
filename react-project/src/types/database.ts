// ─────────────────────────────────────────────────────────────
// src/types/database.ts
// Tipos espelhando as tabelas do Supabase (PostgreSQL)
// ─────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {

      // ── profiles ────────────────────────────────────────────
      // Dados públicos do usuário. O id é o mesmo UUID do auth.users.
      profiles: {
        Row: {
          id:         string
          nome:       string
          role:       'proprietario' | 'funcionario' | 'professor' | 'aluno'
          telefone:   string | null
          avatar_url: string | null
          created_at: string
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

      // ── profiles_credencial ─────────────────────────────────
      // Relação 1:1 com profiles. Guarda dados de acesso separados
      // dos dados de identidade. A SENHA vive no auth.users do Supabase
      // — jamais é armazenada aqui. Esta tabela existe para:
      //   1. Registrar quem criou o acesso (criado_por)
      //   2. Permitir bloquear acesso sem excluir o usuário (ativo)
      //   3. Rastrear o último login (ultimo_acesso)
      //   4. Manter o e-mail de login visível para o admin
      profiles_credencial: {
        Row: {
          profile_id:    string        // PK e FK → profiles.id
          email:         string        // e-mail de login (espelho de auth.users.email)
          ativo:         boolean       // false = login bloqueado
          ultimo_acesso: string | null // atualizado a cada login bem-sucedido
          criado_por:    string | null // profile_id do admin que cadastrou
          updated_at:    string
        }
        Insert: {
          profile_id:     string
          email:          string
          ativo?:         boolean
          ultimo_acesso?: string | null
          criado_por?:    string | null
          updated_at?:    string
        }
        Update: {
          email?:         string
          ativo?:         boolean
          ultimo_acesso?: string | null
          criado_por?:    string | null
          updated_at?:    string
        }
      }

      // ── planos ──────────────────────────────────────────────
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

      // ── matriculas ──────────────────────────────────────────
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

      // ── aulas ───────────────────────────────────────────────
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

      // ── inscricoes ──────────────────────────────────────────
      inscricoes: {
        Row: {
          id:             string
          aula_id:        string
          aluno_id:       string
          nivel_inscrito: number | null
          presente:       boolean
        }
        Insert: {
          id?:             string
          aula_id:         string
          aluno_id:        string
          nivel_inscrito?: number | null
          presente?:       boolean
        }
        Update: {
          nivel_inscrito?: number | null
          presente?:       boolean
        }
      }

      // ── pagamentos_professores ──────────────────────────────
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
          pago?:      boolean
          presencas?: number
          valor?:     number
        }
      }

      // ── treinos ─────────────────────────────────────────────
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

      // ── habilidades ─────────────────────────────────────────
      habilidades: {
        Row: {
          id:        string
          nome:      string
          descricao: string | null
          emoji:     string | null
        }
        Insert: {
          id?:        string
          nome:       string
          descricao?: string | null
          emoji?:     string | null
        }
        Update: {
          nome?:      string
          descricao?: string | null
          emoji?:     string | null
        }
      }

      // ── aula_habilidade ─────────────────────────────────────
      aula_habilidade: {
        Row: {
          id:            string
          aula_id:       string
          habilidade_id: string
          nivel_da_aula: number
        }
        Insert: {
          id?:            string
          aula_id:        string
          habilidade_id:  string
          nivel_da_aula:  number
        }
        Update: {
          nivel_da_aula?: number
        }
      }

      // ── aluno_habilidades ───────────────────────────────────
      aluno_habilidades: {
        Row: {
          id:            string
          aluno_id:      string
          habilidade_id: string
          nivel_atual:   number
          atualizado_em: string
        }
        Insert: {
          id?:             string
          aluno_id:        string
          habilidade_id:   string
          nivel_atual:     number
          atualizado_em?:  string
        }
        Update: {
          nivel_atual?:   number
          atualizado_em?: string
        }
      }

      // ── treino_habilidades ──────────────────────────────────
      treino_habilidades: {
        Row: {
          id:            string
          treino_id:     string
          habilidade_id: string
        }
        Insert: {
          id?:            string
          treino_id:      string
          habilidade_id:  string
        }
        Update: Record<string, never>
      }

      // ── transacoes ──────────────────────────────────────────
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
          id?:        string
          tipo:       'receita' | 'despesa'
          categoria:  string
          descricao?: string | null
          valor:      number
          data:       string
          mes:        string
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
    Views:     Record<string, never>
    Functions: Record<string, never>
    Enums:     Record<string, never>
  }
}
