// ─────────────────────────────────────────────────────────────
// src/types/database.ts
//
// Tipos TypeScript que espelham o schema PostgreSQL do Supabase.
//
// POR QUE este arquivo existe?
// O Supabase permite gerar estes tipos automaticamente via CLI:
//   npx supabase gen types typescript --project-id SEU_ID > src/types/database.ts
//
// Fazemos isso manualmente agora para entender a estrutura.
// Após criar as tabelas no Supabase (Fase 1), substitua este
// arquivo pelo output gerado automaticamente — ele será mais
// preciso e incluirá views e funções.
// Relationships declara apenas as relações tipadas usadas pelas consultas
// atuais. As listas vazias não são um inventário das FKs existentes no banco.
//
// ESTRUTURA de cada tabela:
//   Row    — tipo de uma linha retornada por SELECT
//   Insert — tipo aceito por INSERT (campos opcionais têm ?)
//   Update — tipo aceito por UPDATE (todos os campos são opcionais)
// ─────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {

      // ── profiles ────────────────────────────────────────────
      profiles: {
        Relationships: []
        Row: {
          id:         string
          nome:       string
          role:       'proprietario' | 'funcionario' | 'professor' | 'aluno'
          telefone:   string | null
          avatar_url: string | null
          xp_total:   number
          created_at: string
        }
        Insert: {
          id:          string
          nome:        string
          role:        'proprietario' | 'funcionario' | 'professor' | 'aluno'
          telefone?:   string | null
          avatar_url?: string | null
          xp_total?:   number
          created_at?: string
        }
        Update: {
          nome?:       string
          role?:       'proprietario' | 'funcionario' | 'professor' | 'aluno'
          telefone?:   string | null
          avatar_url?: string | null
          xp_total?:   number
        }
      }

      // ── profiles_credencial ─────────────────────────────────
      profiles_credencial: {
        Relationships: [
          {
            foreignKeyName: 'profiles_credencial_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_credencial_criado_por_fkey'
            columns: ['criado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
        Row: {
          profile_id:    string
          email:         string
          ativo:         boolean
          ultimo_acesso: string | null
          criado_por:    string | null
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
        Relationships: []
        Row: {
          id:         string
          nome:       string
          valor:      number
          max_modal:  number
          fidelidade: number
          ativo:      boolean
        }
        Insert: {
          id?:         string
          nome:        string
          valor:       number
          max_modal:   number
          fidelidade?: number
          ativo?:      boolean
        }
        Update: {
          nome?:       string
          valor?:      number
          max_modal?:  number
          fidelidade?: number
          ativo?:      boolean
        }
      }

      // ── matriculas ──────────────────────────────────────────
      matriculas: {
        Relationships: []
        Row: {
          id:                    string
          aluno_id:              string
          plano_id:              string
          status:                'ativo' | 'inadimplente' | 'experimental' | 'inativo'
          inicio:                string
          vencimento:            string
          asaas_subscription_id: string | null
          asaas_customer_id:     string | null
        }
        Insert: {
          id?:                    string
          aluno_id:               string
          plano_id:               string
          status?:                'ativo' | 'inadimplente' | 'experimental' | 'inativo'
          inicio?:                string
          vencimento:             string
          asaas_subscription_id?: string | null
          asaas_customer_id?:     string | null
        }
        Update: {
          status?:                'ativo' | 'inadimplente' | 'experimental' | 'inativo'
          vencimento?:            string
          asaas_subscription_id?: string | null
          asaas_customer_id?:     string | null
        }
      }

      // ── turmas ──────────────────────────────────────────────
      turmas: {
        Relationships: []
        Row: {
          id:             string
          nome:           string
          professor_id:   string
          modalidade:     string
          dia_semana:     number
          horario_inicio: string
          horario_fim:    string
          local:          string | null
          ativa:          boolean
          created_at:     string
        }
        Insert: {
          id?:             string
          nome:            string
          professor_id:    string
          modalidade:      string
          dia_semana:      number
          horario_inicio:  string
          horario_fim:     string
          local?:          string | null
          ativa?:          boolean
          created_at?:     string
        }
        Update: {
          nome?:           string
          professor_id?:   string
          modalidade?:     string
          dia_semana?:     number
          horario_inicio?: string
          horario_fim?:    string
          local?:          string | null
          ativa?:          boolean
        }
      }

      // ── aulas ───────────────────────────────────────────────
      aulas: {
        Relationships: []
        Row: {
          id:                  string
          turma_id:            string | null
          nome:                string
          emoji:               string | null
          instrutor_id:        string
          local:               string | null
          inicio:              string
          fim:                 string
          vagas:               number
          status:              'agendada' | 'cancelada' | 'concluida'
          motivo_cancelamento: string | null
          cancelada_em:        string | null
        }
        Insert: {
          id?:                  string
          turma_id?:            string | null
          nome:                 string
          emoji?:               string | null
          instrutor_id:         string
          local?:               string | null
          inicio:               string
          fim:                  string
          vagas:                number
          status?:              'agendada' | 'cancelada' | 'concluida'
          motivo_cancelamento?: string | null
          cancelada_em?:        string | null
        }
        Update: {
          turma_id?:            string | null
          nome?:                string
          emoji?:               string | null
          instrutor_id?:        string
          local?:               string | null
          inicio?:              string
          fim?:                 string
          vagas?:               number
          status?:              'agendada' | 'cancelada' | 'concluida'
          motivo_cancelamento?: string | null
          cancelada_em?:        string | null
        }
      }

      // ── habilidades ─────────────────────────────────────────
      habilidades: {
        Relationships: []
        Row: {
          id:         string
          nome:       string
          descricao:  string | null
          emoji:      string | null
          modalidade: string | null
        }
        Insert: {
          id?:         string
          nome:        string
          descricao?:  string | null
          emoji?:      string | null
          modalidade?: string | null
        }
        Update: {
          nome?:       string
          descricao?:  string | null
          emoji?:      string | null
          modalidade?: string | null
        }
      }

      // ── aula_habilidade ─────────────────────────────────────
      aula_habilidade: {
        Relationships: []
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

      // ── inscricoes ──────────────────────────────────────────
      inscricoes: {
        Relationships: []
        Row: {
          id:             string
          aula_id:        string
          aluno_id:       string
          nivel_inscrito: number | null
          presente:       boolean
          lista_espera:   boolean
        }
        Insert: {
          id?:             string
          aula_id:         string
          aluno_id:        string
          nivel_inscrito?: number | null
          presente?:       boolean
          lista_espera?:   boolean
        }
        Update: {
          nivel_inscrito?: number | null
          presente?:       boolean
          lista_espera?:   boolean
        }
      }

      // ── treinos ─────────────────────────────────────────────
      treinos: {
        Relationships: []
        Row: {
          id:           string
          professor_id: string
          nome:         string
          objetivo:     string | null
          valencias:    string[]
          musculos:     string[]
          nivel:        'Iniciante' | 'Intermediário' | 'Avançado' | null
          series:       string | null
          obs:          string | null
          created_at:   string
        }
        Insert: {
          id?:          string
          professor_id: string
          nome:         string
          objetivo?:    string | null
          valencias?:   string[]
          musculos?:    string[]
          nivel?:       'Iniciante' | 'Intermediário' | 'Avançado' | null
          series?:      string | null
          obs?:         string | null
          created_at?:  string
        }
        Update: {
          nome?:      string
          objetivo?:  string | null
          valencias?: string[]
          musculos?:  string[]
          nivel?:     'Iniciante' | 'Intermediário' | 'Avançado' | null
          series?:    string | null
          obs?:       string | null
        }
      }

      // ── treino_habilidades ──────────────────────────────────
      treino_habilidades: {
        Relationships: []
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

      // ── aula_treino ─────────────────────────────────────────
      aula_treino: {
        Relationships: []
        Row: {
          id:           string
          aula_id:      string
          treino_id:    string
          definido_em:  string
          definido_por: string | null
        }
        Insert: {
          id?:           string
          aula_id:       string
          treino_id:     string
          definido_em?:  string
          definido_por?: string | null
        }
        Update: {
          treino_id?:    string
          definido_por?: string | null
        }
      }

      // ── professor_modalidades ───────────────────────────────
      professor_modalidades: {
        Relationships: []
        Row: {
          id:            string
          professor_id:  string
          modalidade:    string
          ativo:         boolean
          cadastrado_em: string
        }
        Insert: {
          id?:            string
          professor_id:   string
          modalidade:     string
          ativo?:         boolean
          cadastrado_em?: string
        }
        Update: {
          ativo?: boolean
        }
      }

      // ── aluno_restricoes ────────────────────────────────────
      aluno_restricoes: {
        Relationships: []
        Row: {
          id:              string
          aluno_id:        string
          tipo:            'pontual' | 'cronica'
          descricao:       string
          regiao_corporal: string | null
          ativa:           boolean
          inicio_em:       string | null
          fim_previsto:    string | null
          observacoes:     string | null
          registrado_por:  string | null
          created_at:      string
        }
        Insert: {
          id?:              string
          aluno_id:         string
          tipo:             'pontual' | 'cronica'
          descricao:        string
          regiao_corporal?: string | null
          ativa?:           boolean
          inicio_em?:       string | null
          fim_previsto?:    string | null
          observacoes?:     string | null
          registrado_por?:  string | null
          created_at?:      string
        }
        Update: {
          tipo?:            'pontual' | 'cronica'
          descricao?:       string
          regiao_corporal?: string | null
          ativa?:           boolean
          inicio_em?:       string | null
          fim_previsto?:    string | null
          observacoes?:     string | null
        }
      }

      // ── aluno_habilidades ───────────────────────────────────
      aluno_habilidades: {
        Relationships: []
        Row: {
          id:            string
          aluno_id:      string
          habilidade_id: string
          nivel_atual:   number
          atualizado_em: string
        }
        Insert: {
          id?:            string
          aluno_id:       string
          habilidade_id:  string
          nivel_atual?:   number
          atualizado_em?: string
        }
        Update: {
          nivel_atual?:   number
          atualizado_em?: string
        }
      }

      // ── aluno_xp_log ────────────────────────────────────────
      aluno_xp_log: {
        Relationships: []
        Row: {
          id:            string
          aluno_id:      string
          origem:        'presenca' | 'avaliacao' | 'conquista' | 'bonus'
          xp_ganho:      number
          referencia_id: string | null
          descricao:     string | null
          criado_em:     string
        }
        Insert: {
          id?:            string
          aluno_id:       string
          origem:         'presenca' | 'avaliacao' | 'conquista' | 'bonus'
          xp_ganho:       number
          referencia_id?: string | null
          descricao?:     string | null
          criado_em?:     string
        }
        Update: Record<string, never>
      }

      // ── avaliacoes ──────────────────────────────────────────
      avaliacoes: {
        Relationships: []
        Row: {
          id:           string
          inscricao_id: string
          aluno_id:     string
          nota:         number
          comentario:   string | null
          xp_gerado:    number
          criado_em:    string
        }
        Insert: {
          id?:           string
          inscricao_id:  string
          aluno_id:      string
          nota:          number
          comentario?:   string | null
          xp_gerado?:    number
          criado_em?:    string
        }
        Update: Record<string, never>
      }

      // ── conquistas ──────────────────────────────────────────
      conquistas: {
        Relationships: []
        Row: {
          id:        string
          nome:      string
          descricao: string | null
          emoji:     string | null
          tipo:      'nivel' | 'ranking' | 'presenca' | 'especial'
          criterio:  Json | null
        }
        Insert: {
          id?:        string
          nome:       string
          descricao?: string | null
          emoji?:     string | null
          tipo:       'nivel' | 'ranking' | 'presenca' | 'especial'
          criterio?:  Json | null
        }
        Update: {
          nome?:      string
          descricao?: string | null
          emoji?:     string | null
          tipo?:      'nivel' | 'ranking' | 'presenca' | 'especial'
          criterio?:  Json | null
        }
      }

      // ── aluno_conquistas ────────────────────────────────────
      aluno_conquistas: {
        Relationships: []
        Row: {
          id:              string
          aluno_id:        string
          conquista_id:    string
          desbloqueado_em: string
          referencia:      string | null
        }
        Insert: {
          id?:              string
          aluno_id:         string
          conquista_id:     string
          desbloqueado_em?: string
          referencia?:      string | null
        }
        Update: Record<string, never>
      }

      // ── pagamentos_professores ──────────────────────────────
      pagamentos_professores: {
        Relationships: []
        Row: {
          id:             string
          professor_id:   string
          aula_id:        string
          presencas:      number
          valor:          number
          pago:           boolean
          nota_fiscal_id: string | null
          mes:            string
        }
        Insert: {
          id?:             string
          professor_id:    string
          aula_id:         string
          presencas?:      number
          valor?:          number
          pago?:           boolean
          nota_fiscal_id?: string | null
          mes:             string
        }
        Update: {
          presencas?:      number
          valor?:          number
          pago?:           boolean
          nota_fiscal_id?: string | null
        }
      }

      // ── notas_fiscais ───────────────────────────────────────
      notas_fiscais: {
        Relationships: []
        Row: {
          id:             string
          professor_id:   string
          mes_referencia: string
          valor:          number
          numero_nf:      string | null
          storage_path:   string
          enviada_em:     string
          aprovada:       boolean
          aprovada_em:    string | null
          aprovada_por:   string | null
        }
        Insert: {
          id?:             string
          professor_id:    string
          mes_referencia:  string
          valor:           number
          numero_nf?:      string | null
          storage_path:    string
          enviada_em?:     string
          aprovada?:       boolean
          aprovada_em?:    string | null
          aprovada_por?:   string | null
        }
        Update: {
          numero_nf?:    string | null
          aprovada?:     boolean
          aprovada_em?:  string | null
          aprovada_por?: string | null
        }
      }

      // ── transacoes ──────────────────────────────────────────
      transacoes: {
        Relationships: []
        Row: {
          id:               string
          tipo:             'receita' | 'despesa'
          categoria:        string
          descricao:        string | null
          valor:            number
          metodo_pagamento: 'pix' | 'cartao' | 'boleto' | 'transferencia' | 'dinheiro' | null
          data:             string
          mes:              string
          criado_por:       string | null
          criado_em:        string
        }
        Insert: {
          id?:               string
          tipo:              'receita' | 'despesa'
          categoria:         string
          descricao?:        string | null
          valor:             number
          metodo_pagamento?: 'pix' | 'cartao' | 'boleto' | 'transferencia' | 'dinheiro' | null
          data?:             string
          mes:               string
          criado_por?:       string | null
          criado_em?:        string
        }
        Update: {
          tipo?:             'receita' | 'despesa'
          categoria?:        string
          descricao?:        string | null
          valor?:            number
          metodo_pagamento?: 'pix' | 'cartao' | 'boleto' | 'transferencia' | 'dinheiro' | null
          data?:             string
          mes?:              string
        }
      }

    }

    Views:     Record<string, never>

    Functions: {
      // get_my_role: retorna o role do usuário logado sem recursão no RLS
      get_my_role: {
        Args:    Record<string, never>
        Returns: string
      }
      // get_avisos_professor: avisos em tempo real para o painel do professor.
      // ref_id: renomeado de aula_id para evitar conflito de nome no SQL PostgreSQL
      // (ORDER BY não conseguia resolver aula_id pois conflitava com coluna da tabela aulas).
      get_avisos_professor: {
        Args:    { p_id?: string }
        Returns: Array<{
          tipo:    string
          titulo:  string
          corpo:   string
          ref_id:  string    // ← era aula_id — corrigido junto com o SQL no Supabase
          urgente: boolean
        }>
      }
    }

    Enums:     Record<string, never>
  }
}
