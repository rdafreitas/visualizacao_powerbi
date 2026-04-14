# Feature Specification: Study Google Docs Publishing

**Feature Branch**: `006-study-gdoc-publishing`
**Created**: 2026-04-13
**Status**: Draft
**Role**: Feature (Output)
**Epic**: [001-study-agent-epic](../001-study-agent-epic/spec.md)
**Dependencies**:
- [002-study-foundation](../002-study-foundation/spec.md) (memória, logging, contratos, confirmação) — **obrigatório**
- [004-study-summary-generation](../004-study-summary-generation/spec.md) (topicos.json, questoes.json, _topicos.txt) — **obrigatório**
- [005-study-relevance-engine](../005-study-relevance-engine/spec.md) (relevancia_topicos.json, relevancia_questoes.json) — **obrigatório**

---

## Escopo

Publicação de resumos e questões em Google Docs com formatação hierárquica preservada, ícones de relevância com diferenciação visual, e versionamento local obrigatório em Markdown antes de publicação remota. Cobre tanto o Google Doc de matéria quanto o de questões.

## Rationale

Canal de output principal — transforma dados estruturados em documentos legíveis e publicados. Agrupa matéria e questões numa única spec porque compartilham a mesma infraestrutura (Google Docs API, formatação, versionamento). Respeita Constitution IV (Markdown local salvo ANTES de publicar no Google Docs).

---

## User Scenarios & Testing

### User Story 1 — Publicação do Resumo em Google Docs (Priority: P1)

O sistema publica o resumo hierárquico (outline L0–L3) em Google Docs, preservando numeração, indentação, marcadores e ícones de relevância.

**Why this priority**: O Google Doc de resumo é o artefato principal de consumo — é o que o usuário usa para estudar.

**Independent Test**: Com `/data/topicos.json`, `_topicos.txt` e `/data/relevancia_topicos.json` existentes, invocar publicação e verificar que um Google Doc é criado com hierarquia visual intacta.

**Acceptance Scenarios**:

1. **Given** `_topicos.txt` com outline gerado e `/data/relevancia_topicos.json` com classificações, **When** a publicação é invocada, **Then** o sistema cria Google Doc preservando: numeração de títulos (1, 1.1, 1.2...), marcadores por nível (❖/➤/■), indentação progressiva, e ícones 🔥/⚠️/📝 antes de tópicos L1.
2. **Given** ícones de relevância nos tópicos, **When** o Google Doc é criado, **Then** tópicos 🔥 recebem destaque visual (cor vermelha ou fundo), ⚠️ destaque moderado (amarelo), 📝 tom neutro (cinza).
3. **Given** sistema vai publicar no Google Docs, **When** a fase é atingida, **Then** o sistema solicita confirmação do usuário antes de criar/atualizar o documento.
4. **Given** publicação concluída, **When** o Google Doc URL é obtido, **Then** o sistema registra a URL no log e na memória.

---

### User Story 2 — Publicação de Questões em Google Docs (Priority: P2)

O sistema publica as questões classificadas em um Google Doc separado, organizadas com ícones de relevância e formatação adequada.

**Why this priority**: Complementa o resumo com material de prática. Google Doc separado para não poluir o resumo de matéria.

**Independent Test**: Com `/data/questoes.json` e `/data/relevancia_questoes.json` existentes, invocar publicação e verificar Google Doc com questões formatadas.

**Acceptance Scenarios**:

1. **Given** `/data/questoes.json` com questões e `/data/relevancia_questoes.json` com classificações, **When** a publicação é invocada, **Then** o sistema cria Google Doc de questões com: ícone de relevância antes de cada enunciado, alternativas com indentação, gabarito ao final de cada bloco.
2. **Given** configuração de agrupamento por relevância, **When** o Google Doc é criado, **Then** questões são agrupadas em seções: 🔥 Alta Relevância, ⚠️ Média Relevância, 📝 Baixa Relevância.
3. **Given** sistema vai publicar, **When** a confirmação é solicitada, **Then** exibe contagem de questões por nível antes do usuário confirmar.

---

### User Story 3 — Versionamento Local Markdown (Priority: P3)

Antes de cada publicação em Google Docs, o sistema salva uma versão Markdown local em `/Histórico Anotações/`, garantindo que o conteúdo nunca é perdido mesmo se o Google Docs falhar.

**Why this priority**: Constitution IV exige Markdown como versionamento humano. Salvar ANTES de publicar garante resiliência.

**Independent Test**: Invocar publicação e verificar que o arquivo Markdown é salvo em `/Histórico Anotações/` ANTES da chamada ao Google Docs API.

**Acceptance Scenarios**:

1. **Given** resumo pronto para publicação, **When** a fase de publicação inicia, **Then** o sistema salva PRIMEIRO o Markdown em `/Histórico Anotações/Resumo/resumo_<materia>_<YYYY-MM-DD>.md` com frontmatter (materia, banca, data, tipo), DEPOIS publica no Google Docs.
2. **Given** questões prontas para publicação, **When** a fase inicia, **Then** o sistema salva PRIMEIRO em `/Histórico Anotações/Questões/questoes_<materia>_<YYYY-MM-DD>.md`, DEPOIS publica.
3. **Given** publicação no Google Docs falha (API indisponível, erro de autenticação), **When** o erro é detectado, **Then** o sistema informa ao usuário que a versão local foi salva com sucesso e a publicação pode ser tentada novamente.
4. **Given** publicação bem-sucedida, **When** o Markdown local é salvo, **Then** inclui no frontmatter a URL do Google Doc criado (`gdoc_url`).
5. **Given** múltiplas publicações no mesmo dia para mesma matéria, **When** já existe versão do mesmo dia, **Then** o sistema usa sufixo `_HH-MM` para diferenciar.

---

### User Story 4 — Consulta de Versões Anteriores (Priority: P4)

O usuário pode listar versões anteriores de resumos e questões para comparação ou rollback manual.

**Why this priority**: Habilita rastreabilidade e recuperação — valor incremental sobre o versionamento básico.

**Independent Test**: Com 2+ versões em `/Histórico Anotações/Resumo/`, invocar listagem e verificar que todas são retornadas com datas.

**Acceptance Scenarios**:

1. **Given** múltiplas versões em `/Histórico Anotações/Resumo/`, **When** o usuário solicita listagem, **Then** o sistema exibe: nome do arquivo, data, matéria e URL do Google Doc (quando disponível).
2. **Given** duas versões existentes, **When** o usuário solicita comparação, **Then** o sistema exibe diff simplificado (tópicos adicionados, removidos, alterados).

---

### Edge Cases

- O que acontece quando o Google Docs API está indisponível? O sistema deve salvar Markdown local, informar ao usuário e oferecer retry posterior.
- O que acontece quando as credentials estão expiradas? O sistema deve informar ao usuário para renovar token e não tentar publicar com token inválido.
- O que acontece quando o matéria é muito extenso (> 100 páginas de outline)? O sistema deve publicar normalmente; limites do Google Docs API (batch requests) devem ser respeitados.
- O que acontece quando `/Histórico Anotações/` não existe? Deve ser criado automaticamente (FR da 002-foundation).

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE publicar resumo (matéria) em Google Docs preservando: numeração de títulos, marcadores por nível (❖/➤/■), indentação progressiva L0–L3.
- **FR-002**: O sistema DEVE publicar questões em Google Doc separado com: ícone de relevância antes do enunciado, alternativas indentadas, gabarito ao final do bloco.
- **FR-003**: O sistema DEVE aplicar diferenciação visual por nível de relevância: 🔥 em destaque visual forte (cor vermelha), ⚠️ em destaque moderado (amarelo), 📝 em tom neutro (cinza).
- **FR-004**: O sistema DEVE salvar versão Markdown local ANTES de publicar no Google Docs: resumo em `/Histórico Anotações/Resumo/resumo_<materia>_<data>.md` e questões em `/Histórico Anotações/Questões/questoes_<materia>_<data>.md`.
- **FR-005**: O Markdown local DEVE incluir frontmatter com: materia, banca, data, gdoc_url (após publicação), tipo (resumo/questoes).
- **FR-006**: O sistema DEVE solicitar confirmação do usuário antes de cada publicação no Google Docs.
- **FR-007**: O sistema DEVE registrar URL de cada Google Doc publicado no log e na memória persistente.
- **FR-008**: Quando Google Docs API estiver indisponível, o sistema DEVE: salvar versão local, informar o erro ao usuário, e não marcar a fase como falhada permanentemente (permitir retry).
- **FR-009**: O sistema DEVE suportar listagem de versões anteriores em `/Histórico Anotações/`, exibindo: data, matéria e URL do doc.
- **FR-010**: O sistema DEVE suportar diff simplificado entre duas versões de resumo/questões.
- **FR-011**: Para múltiplas publicações no mesmo dia da mesma matéria, o sistema DEVE usar sufixo temporal (`_HH-MM`) para diferenciar versões.

### Key Entities

- **Google Doc de Resumo**: Documento publicado com outline. Atributos: URL, matéria, banca, data de publicação, caminho do Markdown local.
- **Google Doc de Questões**: Documento publicado com exercícios. Mesmo formato.
- **Versão Local (Markdown)**: Arquivo em `/Histórico Anotações/`. Atributos: frontmatter (materia, banca, data, gdoc_url, tipo), conteúdo.

## Success Criteria

### Measurable Outcomes

- **SC-001**: O Google Doc publicado preserva integralmente a hierarquia visual (numeração, indentação, marcadores) do outline gerado.
- **SC-002**: 100% das publicações são precedidas por salvamento local em Markdown.
- **SC-003**: Quando Google Docs API falha, 100% dos casos têm versão local salva e mensagem informativa ao usuário.
- **SC-004**: 0% de publicações ocorrem sem confirmação explícita do usuário.
- **SC-005**: O tempo total de publicação (Markdown local + Google Docs) não excede 3 minutos de interação ativa.

## Assumptions

- O usuário possui credentials válidas do Google Cloud (`credentials.json`, `token.json`).
- A conta Google do usuário tem permissão para criar documentos no Google Drive.
- O formato de batch API do Google Docs suporta a complexidade de formatação necessária (bullets, indentação, cores).
- O sistema de versionamento local não precisa suportar merge automático — apenas diff simplificado.
