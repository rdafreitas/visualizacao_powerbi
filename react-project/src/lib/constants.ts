// ─────────────────────────────────────────────────────────────
// src/lib/constants.ts
// Constantes globais: cores, regras de negócio, dados de referência
// ─────────────────────────────────────────────────────────────

// ── Paleta PaVoar ─────────────────────────────────────────────
export const COLORS = {
  purple:      '#2D1B69',
  purpleLight: '#3D2A85',
  orange:      '#FF6B35',
  orangeDk:    '#FF4500',
  gold:        '#FFD166',
  goldDk:      '#e6a800',
  green:       '#06D6A0',
  greenDk:     '#04956E',
  red:         '#EF476F',
  grayBg:      '#F4F4F8',
  grayMid:     '#9B9BB4',
  grayDark:    '#1A1A2E',
  white:       '#FFFFFF',
} as const

// Cores de avatar para professores conhecidos
export const PROF_AVATAR_COLORS: Record<string, string> = {
  'Camila Rocha': '#06D6A0',
  'Diego Mendes': '#2D1B69',
  'Lara Vaz':     '#FF6B35',
  'Ana Lima':     '#EF476F',
}

// ── Regras de negócio ─────────────────────────────────────────

/** Valor pago ao professor por aula com menos de 3 presenças */
export const VALOR_AULA_BAIXO = 30

/** Valor pago ao professor por aula com 3 ou mais presenças */
export const VALOR_AULA_ALTO = 50

/** Threshold de presenças para aplicar o valor mais alto */
export const THRESHOLD_PRESENCAS = 3

// ── Meses com movimentação financeira (demo) ──────────────────
export const MESES_COM_MOVIMENTO: Record<number, number[]> = {
  2025: [7, 8, 9, 10, 11],          // ago–dez 2025
  2026: [0, 1, 2, 3, 4, 5, 6],     // jan–jul 2026
}

// ── Modalidades ───────────────────────────────────────────────
export const MODALIDADES = [
  'Tecido Circense',
  'Acrobacia de Solo',
  'Malabares',
  'Contorcionismo',
  'Condicionamento',
] as const

export type Modalidade = (typeof MODALIDADES)[number]

// ── Planos ────────────────────────────────────────────────────
export const PLANOS_DEMO = [
  { nome: 'Básico',    valor: 180, maxModal: 1, fidelidade: 3 },
  { nome: 'Completo',  valor: 280, maxModal: 2, fidelidade: 0 },
  { nome: 'Premium',   valor: 480, maxModal: 5, fidelidade: 0 },
] as const

// ── Valências de treino ───────────────────────────────────────
export const VALENCIAS = [
  'Força', 'Flexibilidade', 'Equilíbrio',
  'Resistência', 'Criatividade', 'Coordenação',
  'Agilidade', 'Expressividade',
] as const

// ── Grupos musculares ─────────────────────────────────────────
export const GRUPOS_MUSCULARES = [
  'Core', 'Braços', 'Pernas', 'Ombros', 'Costas', 'Glúteos',
] as const

// ── Níveis de dificuldade ─────────────────────────────────────
export const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado', 'Todos'] as const

// ── Chave PIX ─────────────────────────────────────────────────
export const CHAVE_PIX = 'pagamentos@pavoar.com.br'

// ── Locais das aulas ──────────────────────────────────────────
export const LOCAIS_AULA = [
  'Studio A',
  'Studio B',
  'Sala Principal',
  'Área Externa',
] as const

// ── Rotas públicas (não exigem autenticação) ──────────────────
export const PUBLIC_ROUTES = ['/pages/login'] as const

// ── Gráfico financeiro: séries de dados (demo 6 meses) ───────
export const MESES_FIN_LABELS = ['Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul']

export const FIN_DADOS_TODOS = {
  Receitas: [14250, 14680, 14380, 15100, 16300, 18240],
  Despesas: [2880,  2940,  2860,  3000,  3180,  3520],
}

export const FIN_DADOS_CONTRATOS = {
  Premium:  [1800, 1920, 2160, 2400, 2400, 2400],
  Completo: [6720, 7280, 7560, 7840, 8400, 8960],
  Básico:   [5730, 5480, 4660, 4860, 5500, 6880],
}

export const FIN_DADOS_PAGAMENTO = {
  PIX:    [8100, 8200, 8300, 9000,  9400,  10580],
  Cartão: [4900, 5000, 5000, 5200,  5700,  6200],
  Boleto: [1250, 1480, 1080, 1060,  1200,  1460],
}

export const FIN_DADOS_DESPESAS = {
  Fixas:     [6100, 6200, 6300, 6480, 6480, 6480],
  Variáveis: [1080, 1020,  900,  960, 1100, 1520],
}

export const FIN_DADOS_LUCROS = {
  Caixa:        [2274, 2464, 2284, 2420, 2664, 2944],
  Investimento: [1137, 1232, 1152, 1210, 1320, 1472],
  Sócios:       [8259, 8948, 8368, 8810, 9376, 10304],
}

export const FIN_DADOS_FOLHA: Record<string, number[]> = {
  'Camila Rocha': [2600, 2700, 2700, 2800, 2800, 2800],
  'Diego Mendes': [2200, 2300, 2300, 2400, 2400, 2400],
  'Lara Vaz':     [1600, 1700, 1700, 1750, 1800, 1800],
  'Ana Lima':     [1300, 1400, 1400, 1400, 1400, 1400],
}

// Cores para as séries do gráfico
export const CHART_COLORS = [
  '#2D1B69', '#FF6B35', '#06D6A0', '#FFD166',
  '#EF476F', '#3D2A85', '#04956E', '#FF4500',
]
