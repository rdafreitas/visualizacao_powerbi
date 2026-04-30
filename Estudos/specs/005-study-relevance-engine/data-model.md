# Data Model: Study Relevance Engine

**Feature**: `005-study-relevance-engine` | **Date**: 2026-04-30

> **Por que um data model?** Antes de escrever codigo, precisamos saber com quais
> "objetos" (dados) o sistema vai trabalhar e como eles se relacionam. Pense nisto
> como o "vocabulario" do sistema — a lingua que todos os arquivos da skill falam.

---

## Entidades

### ClassificacaoTopico

Resultado da analise de um unico topico. Produzido pelo `relevance_classifier.py`
e persistido pelo `relevance_repository.py` em `relevancia_topicos.json`.

| Campo | Tipo Python | Descricao | Obrigatorio |
|-------|------------|-----------|-------------|
| `id` | `str` | ID do topico de origem em `topicos.json` (ex: `"t001"`) | ✅ |
| `texto` | `str` | Texto do topico de nivel L1 | ✅ |
| `classificacao` | `str` | Nivel: `"alta"`, `"media"` ou `"baixa"` | ✅ |
| `emoji` | `str` | Representacao visual: `"🔥"`, `"⚠️"` ou `"📝"` | ✅ |
| `justificativa` | `str` | 1 a 2 frases explicando a decisao em PT-BR | ✅ |
| `fontes` | `list[str]` | Fontes usadas: `["edital"]`, `["ia"]` ou `["edital", "ia"]` | ✅ |
| `nivel_confianca` | `str` | Grau de certeza: `"alta"`, `"media"` ou `"baixa"` | ✅ |

**Regras de validacao**:
- `classificacao` DEVE ser um dos tres valores — qualquer outro valor e erro de schema
- `fontes` DEVE conter pelo menos um elemento
- `justificativa` nao pode ser vazia — se o modelo nao gerar justificativa, usar
  `"Classificacao por inferencia — sem justificativa detalhada disponivel."`
- `emoji` e derivado de `classificacao` (regra fixa, sem intervencao do modelo):
  - `"alta"` → `"🔥"`
  - `"media"` → `"⚠️"`
  - `"baixa"` → `"📝"`

---

### ClassificacaoQuestao

Mesmo formato de `ClassificacaoTopico`. A entidade e identica — o que muda e que
`id` e `texto` referenciam uma questao em `questoes.json` em vez de um topico.

| Campo | Tipo Python | Descricao | Obrigatorio |
|-------|------------|-----------|-------------|
| `id` | `str` | ID da questao de origem em `questoes.json` (ex: `"q001"`) | ✅ |
| `texto` | `str` | Enunciado da questao (primeiras 200 caracteres se muito longo) | ✅ |
| `classificacao` | `str` | `"alta"`, `"media"` ou `"baixa"` | ✅ |
| `emoji` | `str` | `"🔥"`, `"⚠️"` ou `"📝"` | ✅ |
| `justificativa` | `str` | Baseada no tema principal da questao | ✅ |
| `fontes` | `list[str]` | `["edital"]`, `["ia"]` ou `["edital", "ia"]` | ✅ |
| `nivel_confianca` | `str` | `"alta"`, `"media"` ou `"baixa"` | ✅ |

**Regra especial (US2 — Acceptance Scenario 2)**: Quando o enunciado referencia
multiplos temas, a classificacao usa o **tema principal** (mais relevante para a
pergunta central). Os temas secundarios sao ignorados para fins de classificacao.

---

### ResumoClassificacao

Agregado estatistico gerado apos a classificacao completa. Retornado pelo
`relevance_service.py` ao agente orquestrador e tambem gravado no campo `resumo`
dos arquivos de saida.

| Campo | Tipo Python | Descricao |
|-------|------------|-----------|
| `alta` | `int` | Quantidade de itens classificados como alta relevancia |
| `media` | `int` | Quantidade de itens classificados como media relevancia |
| `baixa` | `int` | Quantidade de itens classificados como baixa relevancia |
| `total` | `int` | Total de itens classificados (deve ser = alta + media + baixa) |
| `fontes_consultadas` | `list[str]` | Lista unica de todas as fontes usadas na sessao |
| `nivel_rag` | `int` | Nivel RAG da classificacao (sempre `1` na v1) |
| `estrategia_usada` | `str` | `"com_edital"` ou `"sem_edital"` |
| `alerta` | `str \| None` | Mensagem de alerta se confianca geral e baixa; `None` se tudo ok |

**Exemplo Python**:
```python
resumo = ResumoClassificacao(
    alta=15,
    media=22,
    baixa=8,
    total=45,
    fontes_consultadas=["edital", "ia"],
    nivel_rag=1,
    estrategia_usada="com_edital",
    alerta=None
)
```

**Regra de alerta**: Se mais de 50% dos itens tem `nivel_confianca == "baixa"`,
o campo `alerta` recebe: `"Mais de 50% das classificacoes tem confianca baixa.
Considere fornecer o edital para melhorar a precisao."`.

---

## Relacionamento entre Entidades e Arquivos

```
topicos.json                      relevancia_topicos.json
─────────────────────             ──────────────────────────────
data[].id         ──────────────► data[].id
data[].text (L1)  ──────────────► data[].texto
                                  data[].classificacao   (novo)
                                  data[].emoji            (novo)
                                  data[].justificativa    (novo)
                                  data[].fontes           (novo)
                                  data[].nivel_confianca  (novo)

questoes.json                     relevancia_questoes.json
─────────────────────             ──────────────────────────────
data[].id         ──────────────► data[].id
data[].texto      ──────────────► data[].texto
                                  (mesmos campos novos acima)

edital_parsed.json                (usado como contexto — nao produz output proprio)
──────────────────
conteudo_programatico[]  ────────► informa EstrategiaComEdital
                                   aparece em fontes: ["edital"]
```

**Rastreabilidade (Chain of Evidence)**:
- `ClassificacaoTopico.id` ←→ `topicos.json data[].id` — permite correlacionar
  classificacao com o topico original
- `ClassificacaoTopico.fontes` — permite auditar qual informacao embasou a decisao
- `ResumoClassificacao.fontes_consultadas` — visao geral das fontes da sessao inteira
- Downstream: `relevancia_topicos.json data[].id` ←→ `007-anki-export` usa este
  ID para adicionar tag de relevancia ao flashcard correto

---

## Fluxo de Dados (como os dados se movem)

```
topicos.json    ──┐
questoes.json   ──┤──► relevance_repository.py ──► [listas Python]
edital_parsed   ──┘         (Repository)                  │
(opcional)                                                 │
                                                           ▼
                              relevance_service.py ──────────────────────────────────
                                   (Orquestrador)          │
                                                           │ escolhe estrategia
                                                           ▼
                              classification_strategies.py
                                   (Strategy)              │
                                                           │ estrategia instanciada
                                                           ▼
                              relevance_classifier.py ──► [ClassificacaoTopico[]]
                                   (Pure Function)         [ClassificacaoQuestao[]]
                                                           │
                                                           ▼
                              relevance_repository.py ──► relevancia_topicos.json
                                   (Repository)            relevancia_questoes.json
                                                           │
                                                           ▼
                              relevance_service.py ──────► ResumoClassificacao
                                   (Orquestrador)          (retornado ao agente)
```

**Legenda**:
- `──►` = fluxo de dados
- `[listas Python]` = dados em memoria (nunca tocam o disco diretamente no classifier)
- O `relevance_repository.py` e o **unico** arquivo que toca o disco nesta skill
