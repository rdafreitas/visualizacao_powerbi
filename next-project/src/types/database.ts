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
      // Dados públicos de todos os usuários.
      // O id é o mesmo UUID do auth.users — criado pelo trigger
      // handle_new_user ao registrar um usuário no Auth.
      profiles: {
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
          id:          string           // obrigatório: vem do auth.users
          nome:        string
          role:        'proprietario' | 'funcionario' | 'professor' | 'aluno'
          telefone?:   string | null
          avatar_url?: string | null
          xp_total?:   number           // default 0
          created_at?: string           // default now()
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
      // Dados de acesso em relação 1:1 com profiles.
      // profile_id é PK e FK ao mesmo tempo (a PK é a FK).
      // Separa identidade (profiles) de credenciais de login.
      // A SENHA nunca fica aqui — vive no auth.users (hash bcrypt).
      profiles_credencial: {
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
          ativo?:         boolean        // default true
          ultimo_acesso?: string | null
          criado_por?:    string | null
          updated_at?:    string         // default now()
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
      // Catálogo de planos de matrícula.
      planos: {
        Row: {
          id:         string
          nome:       string
          valor:      number
          max_modal:  number
          fidelidade: number
          ativo:      boolean
        }
        Insert: {
          id?:        string
          nome:       string
          valor:      number
          max_modal:  number
          fidelidade?: number    // default 0
          ativo?:     boolean    // default true
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
      // Liga aluno a plano. Armazena apenas IDs do ASAAS —
      // nunca dados de cartão (responsabilidade do ASAAS/PCI-DSS).
      matriculas: {
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
          inicio?:                string    // default current_date
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
      // Agrupa aulas recorrentes do mesmo tipo com o mesmo professor.
      // Uma turma gera N instâncias de `aulas` ao longo do tempo.
      turmas: {
        Row: {
          id:             string
          nome:           string
          professor_id:   string
          modalidade:     string
          dia_semana:     number    // 0=Dom … 6=Sáb
          horario_inicio: string    // time HH:MM
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
          ativa?:          boolean    // default true
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
      // Instância específica de uma aula em uma data/hora concretos.
      // O campo `nivel` foi removido — vive em aula_habilidade.
      aulas: {
        Row: {
          id:                  string
          turma_id:            string | null
          nome:                string
          emoji:               string | null
          instrutor_id:        string
          local:               string | null
          inicio:              string    // timestamptz
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
      // Catálogo de habilidades da academia (Tecido, Acrobacia...).
      habilidades: {
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
      // Vínculo entre aula e habilidade + nível (1–5).
      // Uma aula pode trabalhar uma habilidade em um nível específico.
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

      // ── inscricoes ──────────────────────────────────────────
      // Aluno inscrito em aula. UNIQUE (aula_id, aluno_id)
      // impede inscrição dupla.
      inscricoes: {
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
          presente?:       boolean    // default false
          lista_espera?:   boolean    // default false
        }
        Update: {
          nivel_inscrito?: number | null
          presente?:       boolean
          lista_espera?:   boolean
        }
      }

      // ── treinos ─────────────────────────────────────────────
      // Biblioteca de exercícios dos professores.
      // RLS: professor_id = auth.uid() — professor só vê os seus.
      treinos: {
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
      // Relação N:M entre treinos e habilidades.
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

      // ── aula_treino ─────────────────────────────────────────
      // Vínculo 1:1 entre aula e treino da biblioteca.
      // Ausência de registro = "Treino não definido" (gera aviso).
      aula_treino: {
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
      // Modalidades que cada professor está habilitado a lecionar.
      professor_modalidades: {
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
          ativo?:         boolean    // default true
          cadastrado_em?: string
        }
        Update: {
          ativo?: boolean
        }
      }

      // ── aluno_restricoes ────────────────────────────────────
      // Restrições de saúde do aluno (dado sensível — LGPD Art. 5º II).
      // tipo = 'pontual' → tem fim_previsto, pode ser superada
      // tipo = 'cronica' → permanente, fim_previsto é null
      aluno_restricoes: {
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
          ativa?:           boolean    // default true
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
      // Progresso atual do aluno em cada habilidade.
      // UNIQUE (aluno_id, habilidade_id). Nível nunca regressa
      // graças ao GREATEST() no trigger de presença.
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
          nivel_atual?:    number    // default 1
          atualizado_em?:  string
        }
        Update: {
          nivel_atual?:   number
          atualizado_em?: string
        }
      }

      // ── aluno_xp_log ────────────────────────────────────────
      // Log imutável de cada evento que gerou XP.
      // O profiles.xp_total é o somatório deste log,
      // mantido em sincronia pelo trigger sincronizar_xp_total.
      aluno_xp_log: {
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
        Update: Record<string, never>    // log é imutável
      }

      // ── avaliacoes ──────────────────────────────────────────
      // Avaliação de uma aula pelo aluno após presença confirmada.
      // UNIQUE (inscricao_id) — uma avaliação por inscrição.
      avaliacoes: {
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
          xp_gerado?:    number    // calculado pelo trigger xp_ao_avaliar
          criado_em?:    string
        }
        Update: Record<string, never>    // avaliação é imutável
      }

      // ── conquistas ──────────────────────────────────────────
      // Catálogo de badges e títulos desbloqueáveis.
      conquistas: {
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
      // Conquistas desbloqueadas por cada aluno.
      // UNIQUE (aluno_id, conquista_id) evita duplicatas.
      aluno_conquistas: {
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
      // Remuneração por aula: R$50 (≥3 alunos) ou R$30 (<3).
      // Calculado e atualizado pelo trigger calcular_pagamento_professor.
      pagamentos_professores: {
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
          presencas?:      number    // default 0
          valor?:          number    // default 0
          pago?:           boolean   // default false
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
      // Metadados de NFs dos professores MEI.
      // O arquivo PDF fica no Supabase Storage (bucket notas-fiscais).
      // Retenção mínima: 5 anos (obrigação fiscal — LGPD não se aplica
      // ao prazo: obrigação legal prevalece sobre direito ao esquecimento).
      notas_fiscais: {
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
          aprovada?:       boolean    // default false
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
      // Receitas e despesas gerais da academia.
      // Desacoplada intencionalmente — sem FK para matrículas.
      // Acesso restrito ao proprietario (policy mais restritiva).
      transacoes: {
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
          data?:             string    // default current_date
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
      // get_avisos_professor: avisos em tempo real para o painel do professor
      get_avisos_professor: {
        Args:    { p_id?: string }
        Returns: Array<{
          tipo:    string
          titulo:  string
          corpo:   string
          aula_id: string
          urgente: boolean
        }>
      }
    }

    Enums:     Record<string, never>
  }
}
