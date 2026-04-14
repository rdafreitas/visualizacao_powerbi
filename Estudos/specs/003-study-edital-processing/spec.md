# Feature Specification: Study Edital Processing

**Feature Branch**: `003-study-edital-processing`
**Created**: 2026-04-13
**Status**: Draft
**Role**: Feature
**Epic**: [001-study-agent-epic](../001-study-agent-epic/spec.md)
**Dependencies**: [002-study-foundation](../002-study-foundation/spec.md) (memória, logging, contratos de dados)

---

## Escopo

Pipeline de ingestão e parsing de editais de concursos públicos: conversão de PDF para Markdown, extração estruturada de dados (cargo, banca, matérias, conteúdo programático, pesos) e persistência em formato canônico JSON.

## Rationale

O edital é a fonte primária de contexto para priorização de estudos. Extraí-lo de forma estruturada permite que a classificação de relevância (005) seja fundamentada no que realmente será cobrado. Bounded context isolado — funciona independentemente do pipeline de resumo (004).

---

## User Scenarios & Testing

### User Story 1 — Conversão Automática de Edital (Priority: P1)

O usuário coloca um PDF de edital em `/input/editais/` e o sistema converte automaticamente para Markdown durante a fase de setup, sem intervenção adicional.

**Why this priority**: Elimina a etapa manual de conversão. É o primeiro passo obrigatório para qualquer processamento de edital.

**Independent Test**: Colocar um PDF de edital em `/input/editais/`, invocar setup e verificar que `/data/editais_md/<nome>.md` é gerado.

**Acceptance Scenarios**:

1. **Given** um PDF de edital em `/input/editais/` que nunca foi processado, **When** a fase de setup é invocada, **Then** o sistema converte o PDF para Markdown e salva em `/data/editais_md/<nome_arquivo>.md`.
2. **Given** um edital já convertido (`.md` correspondente já existe em `/data/editais_md/`), **When** o setup é invocado novamente, **Then** o sistema pergunta ao usuário se deseja reconverter ou reutilizar o existente.
3. **Given** o PDF não pode ser convertido (protegido por senha, sem texto extraível), **When** o sistema tenta a conversão, **Then** informa ao usuário o motivo da falha e sugere alternativas.
4. **Given** múltiplos PDFs em `/input/editais/`, **When** o setup é invocado, **Then** o sistema lista todos os PDFs encontrados e pergunta quais processar.

---

### User Story 2 — Extração Estruturada de Dados do Edital (Priority: P2)

O sistema analisa o Markdown do edital e extrai campos estruturados: cargo, banca organizadora, matérias com conteúdo programático e pesos/quantidade de questões quando disponíveis.

**Why this priority**: A extração estruturada é o valor central desta spec — sem ela, o edital é apenas texto sem utilidade para classificação.

**Independent Test**: Fornecer um Markdown de edital e verificar que `/data/edital_parsed.json` contém pelo menos banca e uma matéria.

**Acceptance Scenarios**:

1. **Given** um Markdown de edital com estrutura padrão (seções identificáveis), **When** o parsing é executado, **Then** o sistema extrai cargo, banca, lista de matérias e conteúdo programático para `/data/edital_parsed.json`.
2. **Given** um edital com formato não-padrão (tabelas irregulares, listas sem marcadores, parágrafos corridos), **When** o parsing é executado, **Then** o sistema usa heurísticas para extrair o máximo possível, marca campos não encontrados como `null` e informa ao usuário quais campos falharam.
3. **Given** um edital com múltiplos cargos, **When** o parsing detecta mais de um cargo, **Then** apresenta a lista ao usuário com numeração e pergunta qual cargo processar.
4. **Given** o parsing extraiu dados com sucesso, **When** a extração é concluída, **Then** o sistema valida que pelo menos `banca` e pelo menos uma `materia` foram extraídas antes de salvar.
5. **Given** a validação falha (nenhuma banca nem matéria extraída), **When** o sistema conclui o parsing, **Then** informa ao usuário que a extração falhou e sugere verificar manualmente o conteúdo do edital.

---

### User Story 3 — Consulta de Dados do Edital (Priority: P3)

Outras fases do pipeline (especialmente a classificação de relevância) podem consultar os dados estruturados do edital para contextualizar decisões.

**Why this priority**: Sem interface de consulta, o valor extraído do edital não é consumível por outras specs.

**Independent Test**: Com `/data/edital_parsed.json` existente, invocar consulta de matérias e verificar que a lista é retornada.

**Acceptance Scenarios**:

1. **Given** `/data/edital_parsed.json` existe e é válido, **When** outra fase consulta matérias do edital, **Then** retorna a lista de matérias com conteúdo programático.
2. **Given** `/data/edital_parsed.json` não existe, **When** outra fase tenta consultar, **Then** retorna indicação de ausência e a fase prossegue sem contexto de edital.

---

### Edge Cases

- O que acontece quando o edital contém conteúdo programático em formato de tabela mal formatada? O sistema deve tentar extrair usando patterns de separação comuns (pipes, tabs, espações regulares).
- O que acontece quando matérias aparecem com nomes diferentes em seções distintas do edital? O sistema deve normalizar nomes e alertar o usuário sobre possíveis duplicatas.
- O que acontece quando o edital não menciona pesos por matéria? O sistema deve salvar `pesos: null` e informar que pesos não foram encontrados.

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE detectar PDFs em `/input/editais/` durante a fase de setup e converter cada um para Markdown em `/data/editais_md/<nome>.md`.
- **FR-002**: O sistema DEVE preservar a integridade textual do edital durante a conversão PDF → Markdown.
- **FR-003**: O sistema DEVE extrair do Markdown do edital os campos: cargo, banca organizadora, matérias (lista), conteúdo programático por matéria (lista de tópicos), pesos por matéria (quando disponíveis), número de questões por matéria (quando disponível).
- **FR-004**: O sistema DEVE utilizar heurísticas de detecção de seções para tolerar variações de estrutura entre editais: buscar patterns como "Conteúdo Programático", "Conhecimentos Específicos", "Disciplinas", "Provas", "Quadro de Vagas".
- **FR-005**: O sistema DEVE suportar editais com múltiplos cargos, apresentando a lista ao usuário e solicitando seleção antes de prosseguir.
- **FR-006**: O sistema DEVE validar a extração antes de salvar: pelo menos `banca` e pelo menos uma `materia` devem ter sido extraídas. Se a validação falhar, informar ao usuário e não salvar JSON inválido.
- **FR-007**: O sistema DEVE persistir dados extraídos em `/data/edital_parsed.json` seguindo o contrato de dados definido em 002-foundation (campos `meta` + `data`).
- **FR-008**: O sistema DEVE marcar campos não extraídos como `null` (não omitir) para que consumidores saibam que a extração foi tentada.
- **FR-009**: O sistema DEVE registrar no log quais campos foram extraídos com sucesso e quais falharam, com contexto da heurística usada.
- **FR-010**: O sistema DEVE não deletar PDFs originais de `/input/editais/` após processamento.

### Key Entities

- **Edital**: Documento oficial do concurso. Atributos: cargo, banca organizadora, lista de matérias, conteúdo programático por matéria, pesos (quando disponíveis), número de questões (quando disponível), caminho do PDF original, caminho do Markdown convertido.
- **Matéria do Edital**: Disciplina exigida. Atributos: nome, conteúdo programático (lista de tópicos), peso, número de questões.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Para editais com formato padrão (seções identificáveis), 100% dos campos obrigatórios (banca, pelo menos 1 matéria) são extraídos com sucesso.
- **SC-002**: Para editais com formato não-padrão, o sistema extrai pelo menos a banca OU pelo menos 1 matéria em 80% dos casos, e informa claramente os campos faltantes.
- **SC-003**: Toda conversão PDF → Markdown preserva pelo menos 95% do conteúdo textual original.
- **SC-004**: O tempo de processamento de um edital (conversão + parsing) não excede 2 minutos de interação ativa do usuário.

## Assumptions

- Editais são documentos textuais em PDF (não escaneados).
- A estrutura do edital, embora variável, contém pelo menos uma seção identificável como conteúdo programático.
- O usuário é capaz de resolver ambiguidades (seleção de cargo, validação de campos parciais).
