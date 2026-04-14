# Feature Specification: Study Summary Generation

**Feature Branch**: `004-study-summary-generation`
**Created**: 2026-04-13
**Status**: Draft
**Role**: Feature (Core Value)
**Epic**: [001-study-agent-epic](../001-study-agent-epic/spec.md)
**Dependencies**: [002-study-foundation](../002-study-foundation/spec.md) (memória, logging, contratos de dados)
**Optional Input**: [003-study-edital-processing](../003-study-edital-processing/spec.md) (contexto de matéria/banca para metadados)

---

## Escopo

Pipeline principal de transformação de materiais de estudo: conversão de PDF para Markdown, separação de matéria explicativa e questões, geração de resumo hierárquico no formato outline L0–L3, alinhamento com referência editorial do usuário, e persistência em JSON canônico.

## Rationale

É a transformação central do sistema — produz os artefatos estruturados (`topicos.json`, `questoes.json`) que todas as specs downstream (005 relevância, 006 publicação, 007 Anki) consomem. Um usuário que executa apenas esta spec já obtém valor imediato: resumo estruturado dos seus materiais.

---

## User Scenarios & Testing

### User Story 1 — Conversão de PDF para Markdown (Priority: P1)

O usuário fornece um PDF de material de estudo e o sistema converte para Markdown preservando a estrutura textual.

**Why this priority**: Primeiro passo obrigatório do pipeline — sem Markdown, nenhuma transformação posterior é possível.

**Independent Test**: Fornecer um PDF e verificar que um arquivo `.md` é gerado preservando títulos, parágrafos e listas.

**Acceptance Scenarios**:

1. **Given** um PDF de material de estudo com texto extraível, **When** o usuário invoca a conversão, **Then** o sistema gera um arquivo Markdown preservando títulos, parágrafos, listas e estrutura original.
2. **Given** um PDF que falha na conversão (protegido, corrompido, apenas imagens), **When** a conversão é tentada, **Then** o sistema informa ao usuário com mensagem clara e sugere verificar o arquivo original.
3. **Given** um PDF já convertido anteriormente (Markdown existente), **When** o usuário reinvoca, **Then** o sistema pergunta se deseja reconverter ou reutilizar.

---

### User Story 2 — Separação de Matéria e Questões (Priority: P2)

O sistema analisa o Markdown e separa automaticamente o conteúdo em matéria explicativa (conceitos, definições, explicações) e questões (exercícios com alternativas/gabarito).

**Why this priority**: A separação habilita transformações distintas — a matéria gera resumo, as questões geram Google Doc separado e flashcards Anki.

**Independent Test**: Fornecer Markdown com conteúdo misto e verificar que `/data/topicos.json` contém matéria e `/data/questoes.json` contém questões.

**Acceptance Scenarios**:

1. **Given** Markdown contendo matéria e questões intercaladas, **When** o split é executado, **Then** o sistema separa corretamente e persiste matéria em `/data/topicos.json` e questões em `/data/questoes.json`.
2. **Given** Markdown contendo apenas matéria (sem questões), **When** o split é executado, **Then** o sistema gera `/data/topicos.json` e não cria `/data/questoes.json`, informando que não foram encontradas questões.
3. **Given** Markdown contendo apenas questões (sem matéria explicativa), **When** o split é executado, **Then** o sistema gera `/data/questoes.json` e não cria `/data/topicos.json`, informando que não foi encontrada matéria.
4. **Given** cada questão no Markdown, **When** o parsing de questão é executado, **Then** o sistema extrai: enunciado, alternativas (quando presentes), gabarito (quando presente) e identificador sequencial.

---

### User Story 3 — Geração de Resumo Hierárquico Outline (Priority: P3)

O sistema transforma a matéria explicativa em resumo no formato de tópicos hierárquicos com 4 níveis de profundidade, seguindo convenções de marcadores e indentação.

**Why this priority**: O outline é o artefato principal de estudo. Produz o formato que será publicado em Google Docs e usado para flashcards.

**Independent Test**: Fornecer `/data/topicos.json` e verificar que `_topicos.txt` é gerado com hierarquia L0–L3, marcadores corretos (❖/➤/■) e indentação progressiva.

**Acceptance Scenarios**:

1. **Given** matéria explicativa em `/data/topicos.json`, **When** a geração de outline é invocada, **Then** o sistema produz `_topicos.txt` com hierarquia:
   - **L0** (Introdução/Conceito): texto normal sem margem, primeira linha como questionamento afirmativo
   - **L1** (❖ detalhamento): tabulação + losango, resposta/explicação
   - **L2** (➤ resposta direta): tabulação + seta, máximo 15 palavras
   - **L3** (■ adicional): tabulação + quadrado, detalhamento extra além das 15 palavras
2. **Given** um parágrafo extenso no material, **When** o outline é gerado, **Then** o conteúdo é decomposto respeitando o limite de 15 palavras no L2, delegando excedente para L3.
3. **Given** títulos e subtítulos no material, **When** o outline é gerado, **Then** títulos principais são numerados (1, 2, 3...) e subtítulos progressivamente (1.1, 1.2...).
4. **Given** indentação visual, **When** o outline é gerado, **Then** a indentação é progressiva e consistente do L1 ao L3.

---

### User Story 4 — Alinhamento com Referência Editorial (Priority: P4)

O sistema utiliza Google Docs de referência editorial do usuário como modelo de estrutura, granularidade e estilo para calibrar a geração dos resumos.

**Why this priority**: Garante que os resumos gerados sejam consistentes com o padrão pessoal do usuário, evitando reestruturação manual.

**Independent Test**: Gerar outline para uma matéria e comparar estrutura/granularidade com o doc de referência correspondente.

**Acceptance Scenarios**:

1. **Given** Google Docs de referência acessíveis na pasta configurada, **When** o outline é gerado, **Then** a granularidade de tópicos (profundidade, quantidade de subtópicos por tema) é alinhada com os docs de referência.
2. **Given** nenhuma referência editorial disponível (pasta vazia ou inacessível), **When** o outline é gerado, **Then** o sistema utiliza padrão default de granularidade e informa ao usuário que não encontrou referências.
3. **Given** referências de múltiplas matérias disponíveis, **When** o outline é gerado para uma matéria específica, **Then** o sistema prioriza a referência da mesma matéria ou área de conhecimento mais próxima.

---

### Edge Cases

- O que acontece quando o PDF tem formatação complexa (duas colunas, notas de rodapé, equações)? O sistema deve extrair o máximo de texto possível e alertar sobre possíveis perdas de formatação.
- O que acontece quando a matéria é muito curta (< 1 página)? O sistema deve gerar outline proporcional, sem inflar artificialmente os níveis hierárquicos.
- O que acontece quando há ambiguidade entre matéria e questão (ex: "questão discursiva" que é parte do conteúdo)? O sistema deve incluir em ambos ou favorecer matéria e informar ao usuário.
- O que acontece quando `/data/topicos.json` já existe mas de um PDF diferente? O sistema deve detectar pela hash e alertar sobre inconsistência.

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE converter PDFs de material de estudo para Markdown, preservando a estrutura textual (títulos, parágrafos, listas, tabelas).
- **FR-002**: O sistema DEVE separar o Markdown em matéria explicativa e questões, usando heurísticas de detecção (patterns como "Questão", "Exercício", numeração com alternativas A/B/C/D, gabarito).
- **FR-003**: O sistema DEVE persistir matéria em `/data/topicos.json` e questões em `/data/questoes.json` seguindo o contrato de dados da 002-foundation.
- **FR-004**: O sistema DEVE gerar resumo no formato outline com 4 níveis hierárquicos: L0 (introdução/conceito como questionamento afirmativo), L1 (❖ detalhamento), L2 (➤ resposta direta com máximo 15 palavras), L3 (■ detalhamento adicional).
- **FR-005**: O sistema DEVE numerar títulos principais (1, 2, 3...) e subtítulos progressivamente (1.1, 1.2, 1.2.1...).
- **FR-006**: O sistema DEVE aplicar indentação visual progressiva e consistente do L1 ao L3.
- **FR-007**: O sistema DEVE respeitar o limite de 15 palavras no L2, delegando conteúdo excedente para L3.
- **FR-008**: O sistema DEVE alinhar a granularidade dos resumos (profundidade, número de subtópicos por tema) com os Google Docs de referência editorial quando disponíveis.
- **FR-009**: O sistema DEVE funcionar sem referência editorial (usar padrão default de granularidade) quando os docs de referência não estiverem acessíveis.
- **FR-010**: O sistema DEVE persistir o outline gerado em `_topicos.txt` no diretório de trabalho.
- **FR-011**: O sistema DEVE atualizar `/data/topicos.json` com a estrutura hierárquica gerada, incluindo IDs por tópico (ex: t001, t001.1, t001.2).
- **FR-012**: Para cada questão extraída, o sistema DEVE armazenar: identificador sequencial, enunciado, alternativas (quando presentes), gabarito (quando presente).

### Key Entities

- **Material de Estudo (PDF)**: Documento de entrada. Atributos: caminho, hash SHA-256, matéria (quando identificável), status de processamento.
- **Tópico**: Unidade de conhecimento. Atributos: id (ex: t001), nível hierárquico (L0–L3), texto, subtópicos (lista recursiva).
- **Questão**: Exercício extraído. Atributos: id sequencial, enunciado, alternativas (lista), gabarito.
- **Referência Editorial**: Google Doc modelo. Atributos: URL, matéria/área, padrões de granularidade.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% dos PDFs com texto extraível são convertidos para Markdown sem perda significativa de conteúdo textual.
- **SC-002**: A separação matéria/questões identifica corretamente pelo menos 90% das questões presentes no material.
- **SC-003**: Resumos gerados mantêm consistência estrutural (mesmos marcadores ❖/➤/■, mesma indentação, mesma numeração) entre execuções distintas com materiais diferentes.
- **SC-004**: 100% das linhas L2 respeitam o limite de 15 palavras.
- **SC-005**: Quando referência editorial está disponível, a granularidade do outline (profundidade média por tema) se alinha com a referência em ±20%.

## Assumptions

- PDFs de entrada contêm texto extraível (não escaneados).
- O conteúdo é predominantemente em português brasileiro.
- Questões seguem padrões reconhecíveis (numeração, alternativas A/B/C/D/E, gabarito).
- Google Docs de referência editorial estão em `Meu Drive/02-Renan (Anotações)/01-Concursos/Aprofundamento/Tecnologia da Informação` quando disponíveis.
- Cada execução processa um PDF por vez.
