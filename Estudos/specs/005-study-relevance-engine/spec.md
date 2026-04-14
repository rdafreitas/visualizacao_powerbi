# Feature Specification: Study Relevance Engine

**Feature Branch**: `005-study-relevance-engine`
**Created**: 2026-04-13
**Status**: Draft
**Role**: Feature
**Epic**: [001-study-agent-epic](../001-study-agent-epic/spec.md)
**Dependencies**:
- [002-study-foundation](../002-study-foundation/spec.md) (memória, logging, contratos de dados) — **obrigatório**
- [004-study-summary-generation](../004-study-summary-generation/spec.md) (topicos.json, questoes.json) — **obrigatório**
- [003-study-edital-processing](../003-study-edital-processing/spec.md) (edital_parsed.json) — **opcional** (enriquece classificação)

---

## Escopo

Motor de classificação de relevância para tópicos e questões extraídos do material de estudo. Atribui classificação 🔥 (alta) / ⚠️ (média) / 📝 (baixa) a cada item, com justificativa e fontes rastreáveis. Opera como análise pura — sem IO, sem publicação, sem efeitos colaterais.

## Rationale

A priorização transforma um resumo genérico em guia de estudo direcionado. O motor é isolado (Constitution VI — Separação de Responsabilidades): recebe JSONs, retorna JSONs de classificação. Toda IO é responsabilidade do orquestrador. Alinha com Constitution V (RAG com evolução controlada) — v1 opera sem web search.

---

## User Scenarios & Testing

### User Story 1 — Classificação de Tópicos por Relevância (Priority: P1)

O sistema classifica cada tópico de `/data/topicos.json` com nível de relevância (🔥/⚠️/📝), registrando justificativa e fontes para cada decisão.

**Why this priority**: Classificar tópicos é o core value desta spec — permite ao usuário focar nos assuntos mais cobrados.

**Independent Test**: Com `/data/topicos.json` existente, invocar classificação e verificar que `/data/relevancia_topicos.json` é gerado com classificação, justificativa e fontes para cada tópico.

**Acceptance Scenarios**:

1. **Given** `/data/topicos.json` com tópicos estruturados e `/data/edital_parsed.json` com conteúdo programático, **When** a classificação é invocada, **Then** o sistema classifica cada tópico de nível L1 com 🔥 (alta — consta explicitamente no edital e é tema recorrente), ⚠️ (média — consta no edital mas é complementar) ou 📝 (baixa — não consta no edital ou é informação tangencial).
2. **Given** `/data/topicos.json` mas sem `/data/edital_parsed.json`, **When** a classificação é invocada, **Then** o sistema classifica usando inferência do modelo, informa ao usuário "Classificação baseada apenas em conhecimento geral — sem edital como referência" e registra fonte como "ia".
3. **Given** a classificação foi executada, **When** o resultado é persistido, **Then** cada entrada em `/data/relevancia_topicos.json` contém: id do tópico, texto, classificação (emoji), justificativa (1–2 frases), fontes utilizadas (lista: "edital", "ia"), nível de confiança ("alta", "media", "baixa").
4. **Given** classificação anterior já existe em `/data/relevancia_topicos.json`, **When** o usuário reinvoca, **Then** o sistema pergunta se deseja reclassificar ou reutilizar.

---

### User Story 2 — Classificação de Questões por Relevância (Priority: P2)

O sistema classifica cada questão de `/data/questoes.json` com o mesmo critério e formato dos tópicos.

**Why this priority**: Classificar questões permite ao usuário priorizar quais exercícios praticar primeiro.

**Independent Test**: Com `/data/questoes.json` existente, invocar classificação e verificar que `/data/relevancia_questoes.json` é gerado.

**Acceptance Scenarios**:

1. **Given** `/data/questoes.json` com questões extraídas, **When** a classificação é invocada, **Then** o sistema classifica cada questão com 🔥/⚠️/📝 baseado na relevância do tema abordado.
2. **Given** o enunciado da questão referencia múltiplos temas, **When** a classificação é feita, **Then** o sistema utiliza o tema principal (mais relevante) para determinar a classificação.
3. **Given** a classificação é concluída, **When** persistida, **Then** `/data/relevancia_questoes.json` segue o mesmo formato de `/data/relevancia_topicos.json`.

---

### User Story 3 — Resumo de Classificação (Priority: P3)

O sistema gera um resumo estatístico da classificação, informando distribuição por nível e fontes consultadas.

**Why this priority**: Dá visibilidade ao usuário sobre a distribuição de prioridades do material, ajudando no planejamento de estudos.

**Independent Test**: Após classificação, verificar que o resumo contém contagens por nível (alta/média/baixa) e lista de fontes.

**Acceptance Scenarios**:

1. **Given** classificação concluída, **When** o resumo é gerado, **Then** o sistema exibe: `{alta: N, media: M, baixa: K}`, fontes consultadas e nível RAG utilizado.
2. **Given** modo debug ativo, **When** o resumo é gerado, **Then** o sistema exibe adicionalmente a justificativa de cada classificação no chat.

---

### Edge Cases

- O que acontece quando `/data/topicos.json` está vazio (sem tópicos)? O sistema deve informar que não há tópicos para classificar e encerrar a fase.
- O que acontece quando o edital contém matéria diferente da do material? O sistema deve informar a divergência e classificar com cautela (confiança "baixa").
- O que acontece quando todos os tópicos são classificados com a mesma relevância? O sistema deve alertar o usuário que a classificação pode não ser discriminativa e sugerir fornecer edital (se ausente).

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE classificar cada tópico de nível L1 em `/data/topicos.json` com relevância: 🔥 (alta), ⚠️ (média) ou 📝 (baixa).
- **FR-002**: O sistema DEVE classificar cada questão em `/data/questoes.json` com o mesmo critério de relevância.
- **FR-003**: Para cada classificação, o sistema DEVE registrar: justificativa (1–2 frases explicando a decisão), fontes utilizadas (lista com valores possíveis: "edital", "ia"), e nível de confiança ("alta", "media", "baixa").
- **FR-004**: O sistema DEVE utilizar o edital (`/data/edital_parsed.json`) como fonte primária de contexto quando disponível:
  - Tópico presente explicitamente no conteúdo programático → favorecer 🔥
  - Tópico relacionado a tema do edital mas não explícito → favorecer ⚠️
  - Tópico sem relação com conteúdo programático → favorecer 📝
- **FR-005**: O sistema DEVE funcionar sem edital, usando apenas inferência do modelo (fonte "ia"), e informar ao usuário que a classificação é baseada em conhecimento geral.
- **FR-006**: O sistema DEVE operar completamente sem web search na v1 (nível RAG 1).
- **FR-007**: O sistema DEVE persistir classificações em `/data/relevancia_topicos.json` e `/data/relevancia_questoes.json` seguindo o contrato de dados da 002-foundation.
- **FR-008**: O sistema DEVE gerar resumo com distribuição por nível (`{alta: N, media: M, baixa: K}`), fontes consultadas e nível RAG utilizado.
- **FR-009**: O motor de classificação DEVE operar como análise pura: recebe dados de entrada, retorna dados de saída. Não executa IO direto (leitura/escrita de arquivos é responsabilidade do orquestrador).
- **FR-010**: O sistema DEVE registrar cada decisão de classificação no log com nível DECISION, incluindo justificativa e fontes.

### Key Entities

- **Classificação de Tópico**: Resultado da análise. Atributos: id do tópico, texto, classificação (🔥/⚠️/📝), justificativa, fontes, confiança.
- **Classificação de Questão**: Resultado da análise para questão. Mesmo formato de tópico.
- **Resumo de Classificação**: Agregado estatístico. Atributos: contagem por nível, fontes consultadas, nível RAG usado.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% das classificações incluem justificativa e fontes rastreáveis.
- **SC-002**: Quando edital está disponível, tópicos explicitamente no conteúdo programático são classificados como 🔥 em pelo menos 90% dos casos.
- **SC-003**: Sem edital, o sistema informa claramente ao usuário e utiliza inferência com confiança marcada como "media" ou "baixa".
- **SC-004**: O motor de classificação não executa nenhuma operação de IO direta (conformidade com Constitution VI).

## Assumptions

- `/data/topicos.json` e/ou `/data/questoes.json` já existem quando esta spec é executada (produzidos por 004).
- A qualidade da classificação depende da qualidade do parsing do edital (003) e da extração de tópicos (004).
- Web search não está disponível na v1; evolução futura (nível RAG 2+) não é escopo desta spec.
- O modelo de IA (via Copilot/Claude) possui conhecimento suficiente sobre concursos públicos brasileiros para inferência básica.
