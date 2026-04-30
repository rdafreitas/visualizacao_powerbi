# Research: Study Summary Generation

**Feature**: `004-study-summary-generation` | **Data**: 2026-04-30

---

## 1. Estrutura Completa de `topicos.json`

> **Por que um schema detalhado?** Antes de escrever código, você precisa saber exatamente
> como os dados são organizados. O schema é o "contrato" entre esta feature e todas as
> specs downstream (005, 006, 007). Se o schema mudar de forma incompatível, as outras
> features quebram.

### Schema

```json
{
  "meta": {
    "materia":     "string — nome da matéria (ex: 'Direito Constitucional')",
    "banca":       "string | null — banca do concurso quando disponível (ex: 'CESPE')",
    "created_at":  "string — ISO 8601 (ex: '2026-04-30T10:00:00')",
    "updated_at":  "string — ISO 8601 — atualizado a cada regeneração do outline",
    "source_file": "string — nome do arquivo PDF de origem (ex: 'material_df.pdf')",
    "source_hash": "string — SHA-256 do PDF (ex: 'sha256:abc123...') — detecta substituição",
    "version":     "string — versão do schema (ex: '1.0') — para compatibilidade futura"
  },
  "data": [
    {
      "id":       "string — identificador hierárquico único (ex: 't001', 't001.1')",
      "level":    "integer — 0, 1, 2 ou 3",
      "text":     "string — texto do nó com marcador incluído para L1/L2/L3",
      "children": "array de nós (mesma estrutura recursiva) — ausente ou [] em folhas"
    }
  ]
}
```

**Regras do campo `id`**:
- Nós L0 recebem IDs sequenciais: `t001`, `t002`, `t003`...
- Nós filhos herdam o ID do pai com sufixo: `t001.1`, `t001.2`, `t001.2.1`
- IDs são estáveis entre regenerações do outline — se o L0 "Princípio da Legalidade" era
  `t003` antes, continua `t003` após atualização do outline

**Regras do campo `text`**:
- L0: texto limpo sem marcador (ex: `"O que é o princípio da legalidade?"`)
- L1: inclui marcador `❖` (ex: `"❖ Ninguém é obrigado a fazer..."`)
- L2: inclui marcador `➤` (ex: `"➤ Base: Art. 5º, II da CF/88"`) — máximo 15 palavras
- L3: inclui marcador `■` (ex: `"■ A lei deve ser anterior ao fato"`)

### Exemplo Real

```json
{
  "meta": {
    "materia": "Direito Constitucional",
    "banca": "CESPE",
    "created_at": "2026-04-30T10:00:00",
    "updated_at": "2026-04-30T10:45:00",
    "source_file": "material_df.pdf",
    "source_hash": "sha256:3a7f1c9b2d4e6f8a0b2c4d6e8f0a1b3c5d7e9f1a2b3c4d5e6f7a8b9c0d1e2f3a",
    "version": "1.0"
  },
  "data": [
    {
      "id": "t001",
      "level": 0,
      "text": "O que é o princípio da legalidade?",
      "children": [
        {
          "id": "t001.1",
          "level": 1,
          "text": "❖ Ninguém é obrigado a fazer ou deixar de fazer algo senão em virtude de lei",
          "children": [
            {
              "id": "t001.1.1",
              "level": 2,
              "text": "➤ Base constitucional: Art. 5º, inciso II da CF/88"
            },
            {
              "id": "t001.1.2",
              "level": 2,
              "text": "➤ Garante previsibilidade e segurança jurídica ao cidadão"
            }
          ]
        },
        {
          "id": "t001.2",
          "level": 1,
          "text": "❖ Aplica-se tanto à administração pública quanto aos particulares",
          "children": [
            {
              "id": "t001.2.1",
              "level": 2,
              "text": "➤ Administração só pode agir quando a lei autoriza"
            },
            {
              "id": "t001.2.2",
              "level": 2,
              "text": "➤ Particular pode fazer tudo que a lei não proíbe"
            },
            {
              "id": "t001.2.3",
              "level": 3,
              "text": "■ Distinção essencial: legalidade para o Estado vs liberdade para o indivíduo"
            }
          ]
        }
      ]
    },
    {
      "id": "t002",
      "level": 0,
      "text": "O que é o princípio da isonomia?",
      "children": [
        {
          "id": "t002.1",
          "level": 1,
          "text": "❖ Todos são iguais perante a lei, sem distinção de qualquer natureza",
          "children": [
            {
              "id": "t002.1.1",
              "level": 2,
              "text": "➤ Igualdade formal: mesma lei aplica-se a todos"
            },
            {
              "id": "t002.1.2",
              "level": 2,
              "text": "➤ Igualdade material: tratar desiguais desigualmente na medida da desigualdade"
            },
            {
              "id": "t002.1.3",
              "level": 3,
              "text": "■ Ações afirmativas são expressão da igualdade material — ex: cotas raciais"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 2. Estrutura Completa de `questoes.json`

### Schema

```json
{
  "meta": {
    "materia":     "string — mesmo valor de topicos.json (vinculação por matéria)",
    "banca":       "string | null",
    "created_at":  "string — ISO 8601",
    "source_file": "string — nome do PDF de origem",
    "source_hash": "string — SHA-256 do PDF",
    "version":     "string — '1.0'"
  },
  "data": [
    {
      "id":           "string — identificador sequencial (ex: 'q001', 'q002')",
      "enunciado":    "string — texto completo da questão",
      "alternativas": "object | null — null quando questão dissertativa",
      "gabarito":     "string | null — letra correta ou null quando não disponível",
      "tipo":         "string — 'multipla_escolha' | 'certo_errado' | 'dissertativa'"
    }
  ]
}
```

**Estrutura de `alternativas`** (quando presente):
```json
{
  "A": "texto da alternativa A",
  "B": "texto da alternativa B",
  "C": "texto da alternativa C",
  "D": "texto da alternativa D",
  "E": "texto da alternativa E — opcional, nem toda questão tem 5 alternativas"
}
```

### Exemplo Real

```json
{
  "meta": {
    "materia": "Direito Constitucional",
    "banca": "CESPE",
    "created_at": "2026-04-30T10:00:00",
    "source_file": "material_df.pdf",
    "source_hash": "sha256:3a7f1c9b2d4e6f8a0b2c4d6e8f0a1b3c5d7e9f1a2b3c4d5e6f7a8b9c0d1e2f3a",
    "version": "1.0"
  },
  "data": [
    {
      "id": "q001",
      "enunciado": "Acerca dos direitos e garantias fundamentais previstos na Constituição Federal de 1988, julgue o item a seguir. O princípio da legalidade impõe que ninguém seja obrigado a fazer ou a deixar de fazer algo senão em virtude de lei.",
      "alternativas": null,
      "gabarito": "Certo",
      "tipo": "certo_errado"
    },
    {
      "id": "q002",
      "enunciado": "Com base no princípio da isonomia, assinale a alternativa correta.",
      "alternativas": {
        "A": "A igualdade formal e a igualdade material são conceitos idênticos.",
        "B": "O princípio da isonomia proíbe qualquer distinção entre as pessoas, inclusive as favoráveis.",
        "C": "A igualdade material permite tratar desigualmente os desiguais na medida de sua desigualdade.",
        "D": "O princípio da isonomia aplica-se exclusivamente nas relações entre particulares.",
        "E": "A Constituição de 1988 não prevê expressamente o princípio da igualdade."
      },
      "gabarito": "C",
      "tipo": "multipla_escolha"
    },
    {
      "id": "q003",
      "enunciado": "Explique a diferença entre igualdade formal e igualdade material, dando um exemplo de cada.",
      "alternativas": null,
      "gabarito": null,
      "tipo": "dissertativa"
    }
  ]
}
```

---

## 3. Decisão: Por que o Agente Claude Gera o Outline

> Esta é a decisão de design mais importante desta feature. Entenda o *porquê*.

### O problema

Gerar um outline L0–L3 de qualidade requer duas capacidades que técnicas puramente locais
não possuem:

1. **Compreensão semântica**: formular um L0 como questionamento afirmativo requer entender
   o *sentido* do parágrafo. "Ninguém é obrigado a fazer ou deixar de fazer algo senão em
   virtude de lei" deve virar "O que é o princípio da legalidade?" — isso exige raciocínio,
   não apenas extração de texto.

2. **Julgamento editorial**: decidir o que vai em L1 (detalhamento principal) vs L2 (resposta
   direta, máx 15 palavras) vs L3 (detalhe adicional) requer avaliar a importância relativa
   das informações — um julgamento que varia por conteúdo, não por padrão fixo.

### Alternativas avaliadas e descartadas

| Alternativa | Por que foi descartada |
|-------------|----------------------|
| **Regex puro** | Extrai texto mas não entende semântica. Não consegue formular questionamentos nem classificar granularidade. Produz outlines mecânicos sem valor educacional. |
| **Análise heurística de cabeçalhos** | Funciona para materiais bem estruturados com `#`, `##`, `###`. Falha em PDFs de concurso que usam negrito, caps lock ou numeração própria como hierarquia. |
| **spaCy / NLTK (NLP local)** | Adiciona dependências pesadas (spaCy ~500MB) sem garantia de resultado. Requer treinamento específico para PT-BR técnico-jurídico. Não formula perguntas. |
| **GPT-4 ou outro LLM externo** | Requer conta adicional e custos variáveis. O agente Claude já está disponível no ambiente — usar outro LLM seria redundância sem benefício. |

### Por que Claude é a escolha certa

- **Já disponível**: o agente Claude é o ambiente de execução desta skill. Não há custo
  adicional de integração.
- **Compreensão de PT-BR técnico-jurídico**: Claude lida bem com linguagem de concurso,
  termos jurídicos e estrutura de material de estudo brasileiro.
- **Instrução por prompt**: as regras do outline (L0 = questionamento, L2 = máx 15 palavras)
  são expressas em linguagem natural no prompt — sem código de regras frágil.
- **Julgamento editorial consistente**: Claude produz outlines com granularidade similar
  entre execuções quando o prompt é bem definido.

### Como o Claude é usado (fluxo técnico)

O `outline_builder.py` envia para o Claude o texto da matéria (extraído do Markdown) com
um prompt de sistema que especifica:
- As 4 regras de nível (L0/L1/L2/L3) e seus marcadores
- O limite de 15 palavras no L2
- O formato de saída esperado (uma linha por nó, com marcador)

O Claude retorna o outline formatado. O Builder então parseia linha por linha para montar
a estrutura de árvore com IDs hierárquicos.

---

## 4. Regras do Outline L0–L3

> Estas regras são a "constituição" do outline. Devem ser seguidas à risca.

### O que vai em cada nível

| Nível | Marcador | Função | Regra de conteúdo |
|-------|----------|--------|-------------------|
| **L0** | (nenhum) | Conceito / Pergunta introdutória | Formulado como questionamento afirmativo. Sem número de tópico inline. Títulos principais são numerados (1, 2, 3...) nos L0. |
| **L1** | `❖` | Detalhamento principal | Resposta, explicação ou definição completa do L0. Sem limite de palavras. Indentação: 1 tab. |
| **L2** | `➤` | Resposta direta / síntese | Máximo 15 palavras. Se o conteúdo precisar de mais, o excedente vai para L3. Indentação: 2 tabs. |
| **L3** | `■` | Detalhe adicional | Complemento do L2 — exceção, exemplo, referência normativa, distinção. Indentação: 3 tabs. |

### Regra do limite de 15 palavras no L2

**Antes** (viola a regra):
```
	➤ A igualdade material permite tratar os desiguais de forma desigual, na exata medida de sua desigualdade, como nas ações afirmativas
```
(23 palavras — inválido)

**Depois** (conforme):
```
		➤ Igualdade material: tratar desiguais desigualmente na medida da desigualdade
			■ Exemplo: ações afirmativas — cotas raciais e para PcD em concursos
```
(L2 com 8 palavras + L3 com o detalhe)

### Numeração de títulos

- Títulos principais (L0 de seção): `1.`, `2.`, `3.`...
- Subtítulos (ainda L0, mas subordinados a um título): `1.1`, `1.2`, `2.1`...
- O número faz parte do campo `text` do nó, não do `id`

### Exemplo de `_topicos.txt` formatado

```
1. Princípios Fundamentais

O que é o princípio da legalidade?
	❖ Ninguém é obrigado a fazer ou deixar de fazer algo senão em virtude de lei
		➤ Base constitucional: Art. 5º, inciso II da CF/88
		➤ Administração só pode agir quando autorizada por lei
			■ Particular: pode fazer tudo que a lei não proíbe (liberdade)
			■ Estado: só pode fazer o que a lei expressamente permite (vinculação)

O que é o princípio da isonomia?
	❖ Todos são iguais perante a lei, sem distinção de qualquer natureza
		➤ Igualdade formal: mesma lei aplica-se a todos sem exceção
		➤ Igualdade material: tratar desiguais desigualmente na medida da desigualdade
			■ Ações afirmativas expressam igualdade material — ex: cotas raciais
```

---

## 5. Como Detectar Questões vs Matéria (Heurísticas)

O `content_splitter.py` usa quatro estratégias em cadeia. A primeira que confirmar com
confiança suficiente é usada; se nenhuma confirmar, o bloco é tratado como matéria.

### Estratégia 1 — EstrategiaEnunciado

Detecta padrões de abertura de questão na linha que inicia o bloco:

```python
PADROES_ENUNCIADO = [
    r"^(Questão|Questao|QUESTÃO|Q\.)\s*\d+",   # "Questão 01", "Q. 5"
    r"^\d{1,3}\s*[\.)\-]\s+[A-Z]",             # "01. Acerca...", "5) Em relação..."
    r"^(Exercício|Exercicio)\s*\d+",            # "Exercício 3"
    r"^\(\s*\)",                                 # "( )" — item de certo/errado
]
```

**Confiança**: Alta — se o bloco começa com esses padrões, é quase certamente uma questão.

### Estratégia 2 — EstrategiaAlternativas

Detecta linhas de alternativas em múltipla escolha dentro do bloco:

```python
PADROES_ALTERNATIVAS = [
    r"^[A-Ea-e]\)\s+\S",    # "A) Texto", "b) Texto"
    r"^\([A-Ea-e]\)\s+\S",  # "(A) Texto", "(b) Texto"
    r"^[A-Ea-e]\.\s+\S",    # "A. Texto"
]
```

**Lógica**: Se o bloco contém 3 ou mais linhas que correspondem a padrões de alternativas,
é tratado como questão de múltipla escolha.

**Confiança**: Alta para 4+ alternativas; média para 3 alternativas.

### Estratégia 3 — EstrategiaGabarito

Detecta seções de gabarito que seguem uma questão:

```python
PADROES_GABARITO = [
    r"^(Gabarito|GABARITO)\s*:?\s*[A-Ea-e]",  # "Gabarito: C"
    r"^(Resposta|RESPOSTA)\s*:?\s*[A-Ea-e]",   # "Resposta: Certo"
    r"^(Certo|Errado|CERTO|ERRADO)$",           # linha isolada com "Certo"
]
```

**Lógica**: Se o bloco termina com padrão de gabarito, é questão. O gabarito é extraído
e associado ao campo `questao.gabarito`.

### Estratégia 4 — EstrategiaDefault

Fallback: se nenhuma das estratégias anteriores confirmar que o bloco é questão, ele é
tratado como **matéria**. Isso é conservador — preferimos incluir algo duvidoso na matéria
do que perder conteúdo explicativo.

### Tratamento de ambiguidade

Quando um bloco satisfaz critérios de matéria e questão simultaneamente (ex: questão
discursiva que é parte do conteúdo), o splitter:
1. Inclui o bloco como **matéria** (conservador)
2. Registra no log: `"ambiguidade detectada — bloco incluído como matéria"`
3. Informa ao usuário ao final da execução: "X blocos ambíguos tratados como matéria"
